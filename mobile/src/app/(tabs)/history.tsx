import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ProgressBar } from '@/components/ProgressBar';
import { SkeletonCard } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
      <ThemedText type="h1" style={styles.heading}>
        History
      </ThemedText>

      {loading ? (
        <View style={styles.list}>
          <Card>
            <SkeletonCard />
          </Card>
          <Card>
            <SkeletonCard />
          </Card>
        </View>
      ) : (
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
            <EmptyState
              icon="📅"
              title="No days logged yet"
              subtitle="Add some food from the Today tab to build your history."
            />
          }
          renderItem={({ item, index }) => (
            <HistoryDayCard day={item} previousDay={days[index + 1]} index={index} />
          )}
        />
      )}
    </ThemedView>
  );
}

function HistoryDayCard({
  day,
  previousDay,
  index,
}: {
  day: HistoryDay;
  previousDay?: HistoryDay;
  index: number;
}) {
  const theme = useTheme();
  const statusColor = day.overGoal ? theme.danger : theme.success;
  const progress = day.calorieGoal ? Math.min(day.totalCalories / day.calorieGoal, 1) : 0;

  let trend: { label: string; color: string } | null = null;
  if (previousDay) {
    const diff = day.totalCalories - previousDay.totalCalories;
    if (Math.abs(diff) >= 10) {
      trend = diff > 0 ? { label: `▲ ${diff} vs prev. day`, color: theme.warning } : { label: `▼ ${Math.abs(diff)} vs prev. day`, color: theme.success };
    }
  }

  return (
    <Animated.View entering={FadeInDown.duration(320).delay(Math.min(index, 8) * 40)}>
      <Pressable onPress={() => router.push(`/history/${day.date}`)}>
        <Card style={styles.dayCard}>
          <View style={styles.dayCardInner}>
            <View style={[styles.statusBar, { backgroundColor: statusColor }]} />
            <View style={styles.dayContent}>
              <View style={styles.dayRow}>
                <ThemedText type="bodyBold">{formatDisplayDate(day.date)}</ThemedText>
                <ThemedText type="bodyBold" style={{ color: statusColor }}>
                  {day.totalCalories} cal
                </ThemedText>
              </View>

              {day.calorieGoal !== null ? (
                <>
                  <ProgressBar progress={progress} color={statusColor} height={6} style={styles.progressBar} />
                  <View style={styles.dayRow}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {day.overGoal ? 'Over goal' : 'Within goal'} · Goal {day.calorieGoal}
                    </ThemedText>
                    {trend ? (
                      <ThemedText type="caption" style={{ color: trend.color }}>
                        {trend.label}
                      </ThemedText>
                    ) : null}
                  </View>
                </>
              ) : null}
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  heading: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  dayCard: {
    marginBottom: Spacing.two,
    padding: 0,
    overflow: 'hidden',
  },
  dayCardInner: {
    flexDirection: 'row',
  },
  statusBar: {
    width: 5,
  },
  dayContent: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressBar: {
    marginVertical: Spacing.one,
  },
});
