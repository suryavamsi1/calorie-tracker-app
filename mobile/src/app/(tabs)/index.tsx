import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EmptyState } from '@/components/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { ProgressRing } from '@/components/ProgressRing';
import { SkeletonCard } from '@/components/Skeleton';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { MealColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { todayDateString } from '@/lib/date';
import type { MealEntry, MealType } from '@/types';

function getMotivation(remaining: number | null, goal: number | null): string {
  if (goal === null || remaining === null) return "Set a daily goal to start tracking.";
  if (remaining < 0) return `${Math.abs(remaining)} over your goal today`;
  if (remaining <= goal * 0.1) return "Almost at your goal — nice work!";
  if (remaining === goal) return "Let's log your first meal today.";
  return "You're on track today";
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const theme = useTheme();
  const toast = useToast();
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);

  const date = todayDateString();

  const load = useCallback(async () => {
    try {
      const { entries: fetched } = await api.get<{ entries: MealEntry[] }>(`/entries?date=${date}`);
      setEntries(fetched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleRefresh() {
    setRefreshing(true);
    await load();
  }

  async function handleSaveEntry(quantity: number) {
    if (!editingEntry) return;
    await api.put(`/entries/${editingEntry.id}`, { quantity });
    setEditingEntry(null);
    await load();
    toast.show('Entry updated');
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="overline" themeColor="textSecondary">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </ThemedText>
            <ThemedText type="h1">Today</ThemedText>
          </View>
        </View>

        {loading ? (
          <Card>
            <SkeletonCard />
          </Card>
        ) : (
          <Animated.View entering={FadeInDown.duration(400)}>
            <Card style={styles.heroCard}>
              <ProgressRing progress={progress} color={isOverGoal ? theme.danger : theme.primary}>
                <ThemedText type="caption" themeColor="textSecondary">
                  {isOverGoal ? 'Over by' : 'Remaining'}
                </ThemedText>
                <ThemedText type="display" style={styles.ringNumber}>
                  {remaining !== null ? Math.abs(remaining) : '—'}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  cal
                </ThemedText>
              </ProgressRing>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <ThemedText type="h2">{consumed}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Eaten
                  </ThemedText>
                </View>
                <View style={[styles.heroDivider, { backgroundColor: theme.border }]} />
                <View style={styles.heroStat}>
                  <ThemedText type="h2">{goal ?? '—'}</ThemedText>
                  <ThemedText type="caption" themeColor="textSecondary">
                    Goal
                  </ThemedText>
                </View>
              </View>

              <View
                style={[
                  styles.motivationPill,
                  { backgroundColor: isOverGoal ? theme.dangerSoft : theme.successSoft },
                ]}
              >
                <ThemedText
                  type="caption"
                  themeColor={isOverGoal ? 'danger' : 'success'}
                  style={styles.motivationText}
                >
                  {getMotivation(remaining, goal)}
                </ThemedText>
              </View>
            </Card>
          </Animated.View>
        )}

        {MEAL_TYPES.map((mealType, index) => {
          const mealEntries = entriesByMeal[mealType];
          const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
          const meal = MealColors[mealType];

          return (
            <Animated.View key={mealType} entering={FadeInDown.duration(400).delay(80 * (index + 1))}>
              <Card style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <View style={styles.mealTitleRow}>
                    <View style={[styles.mealIcon, { backgroundColor: theme.backgroundElement }]}>
                      <ThemedText style={styles.mealIconText}>{meal.icon}</ThemedText>
                    </View>
                    <ThemedText type="h3">{MEAL_TYPE_LABELS[mealType]}</ThemedText>
                  </View>
                  <ThemedText type="caption" themeColor="textSecondary">
                    {mealTotal} cal
                  </ThemedText>
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

                <Button
                  title={`+ Add to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`}
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push({ pathname: '/add-food', params: { mealType, date } })}
                />
              </Card>
            </Animated.View>
          );
        })}
      </ScrollView>

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntry}
        onDelete={() => handleDeleteEntry()}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  heroCard: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  ringNumber: {
    fontSize: 34,
    lineHeight: 38,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  heroStat: {
    alignItems: 'center',
    gap: 2,
    minWidth: 64,
  },
  heroDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  motivationPill: {
    borderRadius: Radius.full,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  motivationText: {
    textAlign: 'center',
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
    gap: Spacing.two,
  },
  mealIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealIconText: {
    fontSize: 15,
  },
  entryList: {
    gap: 2,
  },
});
