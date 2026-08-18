import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { EditEntryModal, type EntryUpdates } from '@/components/EditEntryModal';
import { EmptyState } from '@/components/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { Fab } from '@/components/Fab';
import { Icon } from '@/components/Icon';
import { InsightBanner } from '@/components/InsightBanner';
import { MacroStatCard } from '@/components/MacroStatCard';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ProgressRing } from '@/components/ProgressRing';
import { SkeletonCard } from '@/components/Skeleton';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { MacroColors, MealColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api, ApiError } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import { guessMealType, todayDateString } from '@/lib/date';
import type { MealEntry, MealType } from '@/types';

function getMotivation(
  remaining: number | null,
  goal: number | null
): { title: string; message: string; tone: 'success' | 'warning' | 'danger' } {
  if (goal === null || remaining === null) {
    return { title: 'Set a goal', message: 'Set a daily calorie goal to start tracking progress.', tone: 'warning' };
  }
  if (remaining < 0) {
    return { title: 'Over goal', message: `You're ${Math.abs(remaining)} cal over your goal today.`, tone: 'danger' };
  }
  if (remaining <= goal * 0.1) {
    return { title: 'Almost there!', message: `Just ${remaining} cal left \u2014 nice work today.`, tone: 'success' };
  }
  if (remaining === goal) {
    return { title: 'Let\u2019s get started', message: 'Log your first meal to start tracking today.', tone: 'success' };
  }
  return { title: 'On track', message: `You have ${remaining} cal left for the rest of the day.`, tone: 'success' };
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const date = todayDateString();
  const cacheKey = `entries:${date}`;

  const load = useCallback(async () => {
    try {
      const { entries: fetched } = await api.get<{ entries: MealEntry[] }>(`/entries?date=${date}`);
      setEntries(fetched);
      setIsOffline(false);
      setCache(cacheKey, fetched);
    } catch (err) {
      const cached = await getCache<MealEntry[]>(cacheKey);
      if (cached) {
        setEntries(cached);
        setIsOffline(true);
      } else if (!(err instanceof ApiError)) {
        setIsOffline(true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date, cacheKey]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
  }

  async function handleSaveEntry(updates: EntryUpdates) {
    if (!editingEntry) return;
    await api.put(`/entries/${editingEntry.id}`, updates);
    setEditingEntry(null);
    await load();
    toast.show('Entry updated');
  }

  function handleReplaceFood() {
    if (!editingEntry) return;
    const { id, mealType, entryDate } = editingEntry;
    setEditingEntry(null);
    router.push({ pathname: '/add-food', params: { mealType, date: entryDate, entryId: id } });
  }

  async function handleDeleteEntry(entry?: MealEntry) {
    const target = entry ?? editingEntry;
    if (!target) return;
    await api.delete(`/entries/${target.id}`);
    if (editingEntry?.id === target.id) setEditingEntry(null);
    await load();
    toast.show('Entry deleted', 'info');
  }

  const goal = user?.dailyCalorieGoal ?? null;
  const consumed = entries.reduce((sum, e) => sum + e.calories, 0);
  const remaining = goal !== null ? goal - consumed : null;
  const progress = goal ? Math.min(consumed / goal, 1) : 0;
  const isOverGoal = remaining !== null && remaining < 0;
  const insight = getMotivation(remaining, goal);

  const totalProteinG = entries.reduce((sum, e) => sum + (e.proteinG ?? 0), 0);
  const totalCarbsG = entries.reduce((sum, e) => sum + (e.carbsG ?? 0), 0);
  const totalFatG = entries.reduce((sum, e) => sum + (e.fatG ?? 0), 0);

  const entriesByMeal: Record<MealType, MealEntry[]> = useMemo(() => {
    const grouped: Record<MealType, MealEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
    for (const entry of entries) {
      grouped[entry.mealType]?.push(entry);
    }
    return grouped;
  }, [entries]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <AppHeader title="Dashboard" />
      </SafeAreaView>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {isOffline ? <OfflineBanner /> : null}

        {loading ? (
          <Card>
            <SkeletonCard />
          </Card>
        ) : (
          <>
            <Animated.View entering={FadeInDown.duration(400)}>
              <Card style={styles.overviewCard}>
                <View style={styles.ringWrap}>
                  <ProgressRing size={192} strokeWidth={8} progress={progress} color={isOverGoal ? theme.danger : theme.primary}>
                    <ThemedText type="display" style={styles.ringNumber}>
                      {remaining !== null ? Math.abs(remaining) : '—'}
                    </ThemedText>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {isOverGoal ? 'cal over' : 'kcal left'}
                    </ThemedText>
                  </ProgressRing>
                </View>

                <View style={styles.macroRow}>
                  <MacroStatCard label="Protein" valueG={totalProteinG} goalG={user?.dailyProteinGoal ?? null} color={MacroColors.protein} />
                  <MacroStatCard label="Carbs" valueG={totalCarbsG} goalG={user?.dailyCarbsGoal ?? null} color={MacroColors.carbs} />
                  <MacroStatCard label="Fats" valueG={totalFatG} goalG={user?.dailyFatGoal ?? null} color={MacroColors.fat} />
                </View>
              </Card>
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(100)}>
              <InsightBanner title={insight.title} message={insight.message} tone={insight.tone} />
            </Animated.View>
          </>
        )}

        <ThemedText type="h2" style={styles.sectionHeading}>
          Today&apos;s Meals
        </ThemedText>

        {MEAL_TYPES.map((mealType, index) => {
          const mealEntries = entriesByMeal[mealType];
          const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
          const meal = MealColors[mealType];

          return (
            <Animated.View key={mealType} entering={FadeInDown.duration(400).delay(80 * (index + 1))}>
              <Card style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleRow}>
                    <View style={[styles.mealIcon, { backgroundColor: theme.backgroundSelected }]}>
                      <Icon name={meal.icon} size={24} color={theme.text} />
                    </View>
                    <View>
                      <ThemedText type="h2" style={styles.mealName}>{MEAL_TYPE_LABELS[mealType]}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {mealTotal} kcal
                      </ThemedText>
                    </View>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push({ pathname: '/add-food', params: { mealType, date } })}
                    style={[styles.mealAddButton, { backgroundColor: theme.primary }]}
                  >
                    <Icon name="add" size={20} color="#ffffff" />
                  </Pressable>
                </View>

                {mealEntries.length === 0 ? (
                  <EmptyState
                    compact
                    icon={meal.icon}
                    title="Nothing logged yet"
                    subtitle={`Add a food to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`}
                  />
                ) : (
                  <View style={styles.entryList}>
                    {mealEntries.map((entry) => (
                      <SwipeableRow
                        key={entry.id}
                        onEdit={() => setEditingEntry(entry)}
                        onDelete={() => handleDeleteEntry(entry)}
                      >
                        <EntryRow entry={entry} onPress={() => setEditingEntry(entry)} />
                      </SwipeableRow>
                    ))}
                  </View>
                )}
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>

      <Fab onPress={() => router.push({ pathname: '/add-food', params: { mealType: guessMealType(), date } })} />

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntry}
        onDelete={() => handleDeleteEntry()}
        onReplaceFood={handleReplaceFood}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three + 4,
    gap: Spacing.four,
    paddingBottom: Spacing.six + Spacing.five,
  },
  overviewCard: {
    gap: Spacing.three,
  },
  ringWrap: {
    alignItems: 'center',
  },
  ringNumber: {
    fontSize: 44,
    lineHeight: 50,
  },
  macroRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sectionHeading: {
    marginTop: Spacing.two,
  },
  mealCard: {
    gap: Spacing.two,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 20,
    lineHeight: 28,
  },
  mealAddButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryList: {
    gap: 2,
  },
});
