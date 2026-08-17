import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryRow } from '@/components/EntryRow';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ThemedText } from '@/components/themed-text';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import type { HistoryDayDetail, MealEntry, MealType } from '@/types';

export default function HistoryDayScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
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

  async function handleSaveEntry(quantity: number) {
    if (!editingEntry) return;
    await api.put(`/entries/${editingEntry.id}`, { quantity });
    setEditingEntry(null);
    await load();
  }

  async function handleDeleteEntry() {
    if (!editingEntry) return;
    await api.delete(`/entries/${editingEntry.id}`);
    setEditingEntry(null);
    await load();
  }

  if (!detail) {
    return (
      <ScreenContainer>
        <ThemedText>Loading…</ThemedText>
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

  return (
    <ScreenContainer>
      <ThemedText type="title" style={styles.title}>
        {formatDisplayDate(detail.date)}
      </ThemedText>

      <Card>
        <View style={styles.row}>
          <ThemedText type="small" themeColor="textSecondary">
            Total calories
          </ThemedText>
          <ThemedText type="smallBold">{detail.totalCalories}</ThemedText>
        </View>
        {detail.calorieGoal !== null ? (
          <View style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Goal
            </ThemedText>
            <ThemedText type="smallBold">{detail.calorieGoal}</ThemedText>
          </View>
        ) : null}
        {detail.remainingCalories !== null ? (
          <View style={styles.row}>
            <ThemedText type="small" themeColor="textSecondary">
              Remaining
            </ThemedText>
            <ThemedText
              type="smallBold"
              themeColor={detail.remainingCalories < 0 ? 'danger' : 'success'}
            >
              {detail.remainingCalories}
            </ThemedText>
          </View>
        ) : null}
      </Card>

      {MEAL_TYPES.map((mealType) => {
        const mealEntries = entriesByMeal[mealType];
        if (mealEntries.length === 0) return null;
        return (
          <Card key={mealType}>
            <ThemedText type="smallBold">{MEAL_TYPE_LABELS[mealType]}</ThemedText>
            {mealEntries.map((entry) => (
              <EntryRow
                key={entry.id}
                entry={{
                  id: entry.id,
                  foodId: null,
                  foodName: entry.foodName,
                  servingSize: 1,
                  servingUnit: entry.servingUnit,
                  quantity: entry.quantity,
                  calories: entry.calories,
                  mealType: entry.mealType,
                  entryDate: detail.date,
                  createdAt: '',
                }}
                onPress={() =>
                  setEditingEntry({
                    id: entry.id,
                    foodId: null,
                    foodName: entry.foodName,
                    servingSize: 1,
                    servingUnit: entry.servingUnit,
                    quantity: entry.quantity,
                    calories: entry.calories,
                    mealType: entry.mealType,
                    entryDate: detail.date,
                    createdAt: '',
                  })
                }
              />
            ))}
          </Card>
        );
      })}

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
