import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EditEntryModal } from '@/components/EditEntryModal';
import { EntryRow } from '@/components/EntryRow';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { todayDateString } from '@/lib/date';
import type { MealEntry, MealType } from '@/types';

export default function DashboardScreen() {
  const { user } = useAuth();
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
  }

  async function handleDeleteEntry() {
    if (!editingEntry) return;
    await api.delete(`/entries/${editingEntry.id}`);
    setEditingEntry(null);
    await load();
  }

  const goal = user?.dailyCalorieGoal ?? null;
  const consumed = entries.reduce((sum, e) => sum + e.calories, 0);
  const remaining = goal !== null ? goal - consumed : null;

  const entriesByMeal: Record<MealType, MealEntry[]> = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: [],
  };
  for (const entry of entries) {
    entriesByMeal[entry.mealType]?.push(entry);
  }

  return (
    <ThemedView style={styles.flex}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <ThemedText type="title" style={styles.heading}>
          Today
        </ThemedText>

        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Eaten
              </ThemedText>
              <ThemedText type="subtitle">{consumed}</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Goal
              </ThemedText>
              <ThemedText type="subtitle">{goal ?? '—'}</ThemedText>
            </View>
            <View style={styles.summaryItem}>
              <ThemedText type="small" themeColor="textSecondary">
                Remaining
              </ThemedText>
              <ThemedText
                type="subtitle"
                themeColor={remaining !== null && remaining < 0 ? 'danger' : 'success'}
              >
                {remaining ?? '—'}
              </ThemedText>
            </View>
          </View>
        </Card>

        {MEAL_TYPES.map((mealType) => {
          const mealEntries = entriesByMeal[mealType];
          const mealTotal = mealEntries.reduce((sum, e) => sum + e.calories, 0);
          return (
            <Card key={mealType}>
              <View style={styles.mealHeader}>
                <ThemedText type="smallBold">{MEAL_TYPE_LABELS[mealType]}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {mealTotal} cal
                </ThemedText>
              </View>

              {mealEntries.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No foods logged yet.
                </ThemedText>
              ) : (
                mealEntries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} onPress={() => setEditingEntry(entry)} />
                ))
              )}

              <Button
                title={`+ Add to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`}
                variant="secondary"
                onPress={() => router.push({ pathname: '/add-food', params: { mealType, date } })}
              />
            </Card>
          );
        })}
      </ScrollView>

      <EditEntryModal
        entry={editingEntry}
        onClose={() => setEditingEntry(null)}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
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
  heading: {
    fontSize: 28,
  },
  summaryCard: {},
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    gap: Spacing.half,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
