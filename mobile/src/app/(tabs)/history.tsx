import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';

import { Card } from '@/components/Card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { api } from '@/lib/api';
import { formatDisplayDate } from '@/lib/date';
import type { HistoryDay } from '@/types';

export default function HistoryScreen() {
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { days: fetched } = await api.get<{ days: HistoryDay[] }>('/history');
      setDays(fetched);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ThemedView style={styles.flex}>
      <ThemedText type="title" style={styles.heading}>
        History
      </ThemedText>

      <FlatList
        data={days}
        keyExtractor={(item) => item.date}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No days logged yet. Add some food from the Today tab.
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/history/${item.date}`)}>
            <Card style={styles.dayCard}>
              <View style={styles.dayRow}>
                <ThemedText type="smallBold">{formatDisplayDate(item.date)}</ThemedText>
                <ThemedText
                  type="smallBold"
                  themeColor={item.overGoal ? 'danger' : 'success'}
                >
                  {item.totalCalories} cal
                </ThemedText>
              </View>
              {item.calorieGoal !== null ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {item.overGoal ? 'Over goal' : 'Within goal'} · Goal {item.calorieGoal}
                </ThemedText>
              ) : null}
            </Card>
          </Pressable>
        )}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: {
    fontSize: 28,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  dayCard: {
    marginBottom: Spacing.two,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
  },
});
