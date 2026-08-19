import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { EditEntryModal, type EntryUpdates } from '@/components/EditEntryModal';
import { EmptyState } from '@/components/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { Icon } from '@/components/Icon';
import { ProgressBar } from '@/components/ProgressBar';
import { SkeletonCard } from '@/components/Skeleton';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { MacroColors, MealColors, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import type { HistoryDayDetail, MealEntry, MealType } from '@/types';

function toMealEntry(entry: HistoryDayDetail['entries'][number], date: string): MealEntry {
  return {
    id: entry.id,
    foodId: entry.foodId,
    foodName: entry.foodName,
    servingSize: entry.servingSize,
    servingUnit: entry.servingUnit,
    quantity: entry.quantity,
    calories: entry.calories,
    proteinG: entry.proteinG,
    carbsG: entry.carbsG,
    fatG: entry.fatG,
    mealType: entry.mealType,
    entryDate: date,
    createdAt: '',
  };
}

export default function HistoryDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const theme = useTheme();
  const { user } = useAuth();
  const toast = useToast();
  const [detail, setDetail] = useState<HistoryDayDetail | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!date) return;
    try {
      const data = await api.get<HistoryDayDetail>(`/history/${date}`);
      setDetail(data);
      setError(false);
    } catch {
      setError(true);
    }
  }, [date]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

  if (!detail) {
    return (
      <ThemedView style={styles.flex}>
        <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
          <AppHeader title="Day summary" variant="detail" />
        </SafeAreaView>
        <View style={styles.content}>
          {error ? (
            <Card>
              <EmptyState
                icon="alert-circle-outline"
                title="Couldn't load this day"
                subtitle="Check your connection and try again."
                actionLabel="Retry"
                onAction={load}
              />
            </Card>
          ) : (
            <Card>
              <SkeletonCard />
            </Card>
          )}
        </View>
      </ThemedView>
    );
  }

  const entriesByMeal: Record<MealType, HistoryDayDetail['entries']> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };
  for (const entry of detail.entries) {
    entriesByMeal[entry.mealType]?.push(entry);
  }

  const overGoal = detail.remainingCalories !== null && detail.remainingCalories < 0;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <AppHeader title="Day summary" variant="detail" />
      </SafeAreaView>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryLabelBlock}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.summaryLabel}>
              Daily Summary
            </ThemedText>
            <ThemedText type="h1" style={styles.summaryDate}>{formatDisplayDate(detail.date)}</ThemedText>
          </View>
          <View style={styles.summaryTotals}>
            <ThemedText type="display" style={styles.summaryTotal} themeColor={overGoal ? 'danger' : 'primary'}>
              {detail.totalCalories.toLocaleString()}
            </ThemedText>
            {detail.calorieGoal !== null ? (
              <ThemedText type="small" themeColor="textSecondary">
                {`/ ${detail.calorieGoal.toLocaleString()} kcal`}
              </ThemedText>
            ) : null}
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(350)}>
          <Card style={styles.macroCard}>
            <DayMacroColumn label="PRO" valueG={detail.totalProteinG} goalG={user?.dailyProteinGoal ?? null} color={MacroColors.protein} />
            <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
            <DayMacroColumn label="CARB" valueG={detail.totalCarbsG} goalG={user?.dailyCarbsGoal ?? null} color={MacroColors.carbs} />
            <View style={[styles.macroDivider, { backgroundColor: theme.border }]} />
            <DayMacroColumn label="FAT" valueG={detail.totalFatG} goalG={user?.dailyFatGoal ?? null} color={MacroColors.fat} />
          </Card>
        </Animated.View>

        {detail.entries.length === 0 ? (
          <Card>
            <EmptyState icon="file-tray-outline" title="No foods logged" subtitle="This day doesn't have any entries." />
          </Card>
        ) : (
          MEAL_TYPES.map((mealType, index) => {
            const mealEntries = entriesByMeal[mealType];
            if (mealEntries.length === 0) return null;
            const isLast = index === MEAL_TYPES.length - 1 || MEAL_TYPES.slice(index + 1).every((m) => entriesByMeal[m].length === 0);
            return (
              <Animated.View key={mealType} entering={FadeInDown.duration(350).delay(80 * (index + 1))} style={styles.timelineRow}>
                <View style={styles.timelineColumn}>
                  <View style={[styles.timelineDot, { backgroundColor: theme.surface }]}>
                    <Icon name={MealColors[mealType].icon} size={16} color={theme.primary} />
                  </View>
                  {!isLast ? <View style={[styles.timelineLine, { backgroundColor: theme.border }]} /> : null}
                </View>
                <Card style={styles.mealCard}>
                  <View style={[styles.mealHeader, { borderBottomColor: theme.border }]}>
                    <View style={styles.mealTitleRow}>
                      <ThemedText type="h2">{MEAL_TYPE_LABELS[mealType]}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {mealEntries.reduce((sum, e) => sum + e.calories, 0)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={styles.mealBody}>
                    {mealEntries.map((entry) => (
                      <SwipeableRow
                        key={entry.id}
                        onEdit={() => setEditingEntry(toMealEntry(entry, detail.date))}
                        onDelete={() => handleDeleteEntry(toMealEntry(entry, detail.date))}
                      >
                        <EntryRow
                          entry={toMealEntry(entry, detail.date)}
                          onPress={() => setEditingEntry(toMealEntry(entry, detail.date))}
                        />
                      </SwipeableRow>
                    ))}
                  </View>
                </Card>
              </Animated.View>
            );
          })
        )}
      </ScrollView>

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

function DayMacroColumn({ label, valueG, goalG, color }: { label: string; valueG: number; goalG: number | null; color: string }) {
  const rounded = Math.round(valueG * 10) / 10;
  const display = Number.isInteger(rounded) ? rounded : rounded.toFixed(1);
  const progress = goalG ? Math.min(valueG / goalG, 1) : 0;

  return (
    <View style={styles.macroColumn}>
      <View style={styles.macroColumnHeader}>
        <ThemedText type="overline" style={{ color }}>
          {label}
        </ThemedText>
        <ThemedText type="bodyBold">{display}g</ThemedText>
      </View>
      <ProgressBar progress={progress} color={color} height={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  summaryLabelBlock: {
    flex: 1,
    marginRight: Spacing.two,
  },
  summaryLabel: {
    letterSpacing: 0.3,
  },
  summaryDate: {
    fontSize: 24,
    lineHeight: 32,
  },
  summaryTotals: {
    alignItems: 'flex-end',
  },
  summaryTotal: {
    fontSize: 40,
    lineHeight: 46,
  },
  macroCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: Spacing.three,
    padding: Spacing.threeAndHalf,
  },
  macroDivider: {
    width: StyleSheet.hairlineWidth,
  },
  macroColumn: {
    flex: 1,
    gap: 6,
  },
  macroColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  timelineColumn: {
    alignItems: 'center',
    width: 40,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  mealCard: {
    flex: 1,
    padding: 0,
    gap: 0,
    marginBottom: Spacing.three,
  },
  mealHeader: {
    paddingHorizontal: Spacing.threeAndHalf,
    paddingVertical: Spacing.twoAndHalf,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  mealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealBody: {
    padding: Spacing.threeAndHalf,
    gap: Spacing.two,
  },
});

