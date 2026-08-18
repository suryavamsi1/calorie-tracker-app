import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MacroConsistencyCard, WeekStrip, WeightTrendCard } from '@/components/HistoryInsights';
import { Icon } from '@/components/Icon';
import { MacroLine } from '@/components/MacroLine';
import { OfflineBanner } from '@/components/OfflineBanner';
import { ProgressBar } from '@/components/ProgressBar';
import { SkeletonCard } from '@/components/Skeleton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { getCache, setCache } from '@/lib/cache';
import { formatDisplayDate } from '@/lib/date';
import type { HistoryDay } from '@/types';
export default function HistoryScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const [days, setDays] = useState<HistoryDay[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const load = useCallback(async () => {
    try {
      const { days: fetched } = await api.get<{ days: HistoryDay[] }>('/history');
      setDays(fetched);
      setIsOffline(false);
      setCache('history', fetched);
    } catch {
      const cached = await getCache<HistoryDay[]>('history');
      if (cached) {
        setDays(cached);
      }
      // Always surface the offline/error banner on failure, even without a
      // cache to fall back to - otherwise an empty `days` list renders the
      // "No days logged yet" empty state, which looks like a real (and
      // misleading) "you have no history" result rather than a fetch error.
      setIsOffline(true);
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
      <SafeAreaView edges={['top']} style={{ backgroundColor: theme.surface }}>
        <AppHeader title="History" />
      </SafeAreaView>

      {isOffline ? (
        <View style={styles.offlineBannerWrap}>
          <OfflineBanner />
        </View>
      ) : null}

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
          ListHeaderComponent={
            <View style={styles.insights}>
              <WeekStrip />
              <WeightTrendCard />
              <MacroConsistencyCard
                days={days}
                proteinGoalG={user?.dailyProteinGoal ?? null}
                carbsGoalG={user?.dailyCarbsGoal ?? null}
                fatGoalG={user?.dailyFatGoal ?? null}
              />
              <ThemedText type="h3">Daily History</ThemedText>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
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

  let trend: { label: string; color: string; icon: 'caret-up' | 'caret-down' } | null = null;
  if (previousDay) {
    const diff = day.totalCalories - previousDay.totalCalories;
    if (Math.abs(diff) >= 10) {
      trend =
        diff > 0
          ? { label: `${diff} vs prev. day`, color: theme.warning, icon: 'caret-up' }
          : { label: `${Math.abs(diff)} vs prev. day`, color: theme.success, icon: 'caret-down' };
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
                      <View style={styles.trendRow}>
                        <Icon name={trend.icon} size={12} color={trend.color} />
                        <ThemedText type="caption" style={{ color: trend.color }}>
                          {trend.label}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}
              <MacroLine
                proteinG={day.totalProteinG}
                carbsG={day.totalCarbsG}
                fatG={day.totalFatG}
                size="small"
              />
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  insights: {
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  heading: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  offlineBannerWrap: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.two,
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
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  progressBar: {
    marginVertical: Spacing.one,
  },
});
