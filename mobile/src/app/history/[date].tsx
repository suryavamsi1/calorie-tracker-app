import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { EditEntryModal, type EntryUpdates } from '@/components/EditEntryModal';
import { EmptyState } from '@/components/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { ProgressBar } from '@/components/ProgressBar';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SkeletonCard } from '@/components/Skeleton';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ThemedText } from '@/components/themed-text';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { MealColors, Spacing } from '@/constants/theme';
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
  const toast = useToast();
  const [detail, setDetail] = useState<HistoryDayDetail | null>(null);
  const [editingEntry, setEditingEntry] = useState<MealEntry | null>(null);

  const load = useCallback(async () => {
    if (!date) return;
    const data = await api.get<HistoryDayDetail>(`/history/${date}`);
    setDetail(data);
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
      <ScreenContainer>
        <Card>
          <SkeletonCard />
        </Card>
      </ScreenContainer>
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
  const progress = detail.calorieGoal ? Math.min(detail.totalCalories / detail.calorieGoal, 1) : 0;

  return (
    <ScreenContainer>
      <ThemedText type="h1">{formatDisplayDate(detail.date)}</ThemedText>

      <Animated.View entering={FadeInDown.duration(350)}>
        <Card>
          <View style={styles.row}>
            <ThemedText type="caption" themeColor="textSecondary">
              Total calories
            </ThemedText>
            <ThemedText type="h3">{detail.totalCalories}</ThemedText>
          </View>

          {detail.calorieGoal !== null ? (
            <>
              <ProgressBar
                progress={progress}
                color={overGoal ? theme.danger : theme.success}
                height={8}
                style={styles.progressBar}
              />
              <View style={styles.row}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Goal
                </ThemedText>
                <ThemedText type="bodyBold">{detail.calorieGoal}</ThemedText>
              </View>
              <View style={styles.row}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Remaining
                </ThemedText>
                <ThemedText type="bodyBold" themeColor={overGoal ? 'danger' : 'success'}>
                  {detail.remainingCalories}
                </ThemedText>
              </View>
            </>
          ) : null}

          <View style={[styles.macroSummaryRow, { borderTopColor: theme.border }]}>
            <MacroStat label="Protein" value={detail.totalProteinG} />
            <MacroStat label="Carbs" value={detail.totalCarbsG} />
            <MacroStat label="Fat" value={detail.totalFatG} />
          </View>
        </Card>
      </Animated.View>

      {detail.entries.length === 0 ? (
        <Card>
          <EmptyState icon="📭" title="No foods logged" subtitle="This day doesn't have any entries." />
        </Card>
      ) : (
        MEAL_TYPES.map((mealType, index) => {
          const mealEntries = entriesByMeal[mealType];
          if (mealEntries.length === 0) return null;
          return (
            <Animated.View key={mealType} entering={FadeInDown.duration(350).delay(80 * (index + 1))}>
              <Card>
                <View style={styles.mealTitleRow}>
                  <ThemedText>{MealColors[mealType].icon}</ThemedText>
                  <ThemedText type="h3">{MEAL_TYPE_LABELS[mealType]}</ThemedText>
                </View>
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
              </Card>
            </Animated.View>
          );
        })
      )}

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntry}
        onDelete={() => handleDeleteEntry()}
        onReplaceFood={handleReplaceFood}
      />
    </ScreenContainer>
  );
}

function MacroStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroStat}>
      <ThemedText type="bodyBold">{Number.isInteger(value) ? value : value.toFixed(1)}g</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    marginVertical: Spacing.one,
  },
  macroSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: Spacing.two,
    paddingTop: Spacing.two,
  },
  macroStat: {
    alignItems: 'center',
    gap: 2,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
});
