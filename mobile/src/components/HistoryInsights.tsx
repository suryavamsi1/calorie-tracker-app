import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { MacroColors, Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { todayDateString } from '@/lib/date';
import type { HistoryDay, WeightLog } from '@/types';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Horizontal Sun-Sat strip for the current week, matching the insights_history mockup. */
export function WeekStrip() {
  const theme = useTheme();
  const today = todayDateString();
  const weekStart = startOfWeek(new Date());

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <View style={styles.weekRow}>
      {days.map((d, i) => {
        const dateString = toDateString(d);
        const isToday = dateString === today;
        const isFuture = dateString > today;
        return (
          <Pressable
            key={dateString}
            disabled={isFuture}
            onPress={() => router.push(`/history/${dateString}`)}
            accessibilityRole="button"
            accessibilityLabel={`View ${dateString}`}
            style={[styles.weekDay, isToday && { backgroundColor: theme.primary }]}
          >
            <ThemedText
              type="overline"
              themeColor={isToday ? undefined : 'textSecondary'}
              style={[styles.weekLetter, isToday && { color: theme.onPrimary }]}
            >
              {DAY_LETTERS[i]}
            </ThemedText>
            <ThemedText
              type="smallBold"
              themeColor={isFuture ? 'textTertiary' : 'text'}
              style={isToday ? { color: theme.onPrimary } : undefined}
            >
              {d.getDate()}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

export function WeightTrendCard() {
  const theme = useTheme();
  const toast = useToast();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    api
      .get<{ logs: WeightLog[] }>('/weight-logs?limit=7')
      .then(({ logs: fetched }) => {
        setLogs(fetched);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return null;

  if (error) {
    return (
      <Card style={styles.weightEmptyCard}>
        <View style={styles.weightEmptyRow}>
          <View style={[styles.weightIconWrap, { backgroundColor: theme.dangerSoft }]}>
            <Icon name="alert-circle-outline" size={20} color={theme.onDangerSoft} />
          </View>
          <View style={styles.flexOne}>
            <ThemedText type="h3">Weight Trend</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Couldn&apos;t load your weight trend. Check your connection.
            </ThemedText>
          </View>
        </View>
        <Button title="Retry" size="sm" variant="secondary" onPress={load} />
      </Card>
    );
  }

  if (logs.length < 2) {
    return (
      <Card style={styles.weightEmptyCard}>
        <View style={styles.weightEmptyRow}>
          <View style={[styles.weightIconWrap, { backgroundColor: theme.backgroundSelected }]}>
            <Icon name="trending-up-outline" size={20} color={theme.primary} />
          </View>
          <View style={styles.flexOne}>
            <ThemedText type="h3">Weight Trend</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              Log your weight to start tracking your trend.
            </ThemedText>
          </View>
        </View>
        <Button title="Log weight" size="sm" variant="secondary" onPress={() => setModalVisible(true)} />
        <LogWeightModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSaved={() => {
            setModalVisible(false);
            load();
          }}
        />
      </Card>
    );
  }

  const first = logs[0].weightKg;
  const last = logs[logs.length - 1].weightKg;
  const diff = Math.round((last - first) * 10) / 10;
  const trendLabel =
    diff < 0 ? `Down ${Math.abs(diff)} kg this week` : diff > 0 ? `Up ${diff} kg this week` : 'No change this week';
  const trendIcon = diff < 0 ? 'trending-down-outline' : diff > 0 ? 'trending-up-outline' : 'remove-outline';

  const values = logs.map((l) => l.weightKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return (
    <Card style={styles.weightCard}>
      <View style={styles.weightHeaderRow}>
        <View>
          <ThemedText type="h3">Weight Trend</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {trendLabel}
          </ThemedText>
        </View>
        <Pressable onPress={() => setModalVisible(true)}>
          <View style={[styles.weightIconWrap, { backgroundColor: theme.backgroundSelected }]}>
            <Icon name={trendIcon} size={20} color={theme.primary} />
          </View>
        </Pressable>
      </View>
      <View style={styles.weightBarsRow}>
        {logs.map((log, i) => {
          const pct = 0.2 + 0.8 * ((log.weightKg - min) / range);
          const isLast = i === logs.length - 1;
          return (
            <View key={log.id} style={styles.weightBarTrack}>
              <View
                style={[
                  styles.weightBarFill,
                  {
                    height: `${pct * 100}%`,
                    backgroundColor: isLast ? theme.primary : theme.backgroundSelected,
                    opacity: isLast ? 1 : 0.3 + (0.6 * i) / Math.max(1, logs.length - 2),
                  },
                ]}
              />
            </View>
          );
        })}
      </View>
      <LogWeightModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSaved={() => {
          setModalVisible(false);
          load();
        }}
      />
    </Card>
  );
}

export function MacroConsistencyCard({
  days,
  proteinGoalG,
  carbsGoalG,
  fatGoalG,
}: {
  days: HistoryDay[];
  proteinGoalG: number | null;
  carbsGoalG: number | null;
  fatGoalG: number | null;
}) {
  const theme = useTheme();
  const recent = days.slice(0, 7);
  if (recent.length === 0) return null;

  const proteinHits = countHits(recent, (d) => d.totalProteinG, proteinGoalG);
  const carbsHits = countHits(recent, (d) => d.totalCarbsG, carbsGoalG);
  const fatHits = countHits(recent, (d) => d.totalFatG, fatGoalG);

  return (
    <Card style={styles.consistencyCard}>
      <ThemedText type="h3">Macro Consistency</ThemedText>
      <ConsistencyRow label="Protein" hits={proteinHits} total={recent.length} goal={proteinGoalG} color={MacroColors.protein} theme={theme} />
      <ConsistencyRow label="Carbs" hits={carbsHits} total={recent.length} goal={carbsGoalG} color={MacroColors.carbs} theme={theme} />
      <ConsistencyRow label="Fats" hits={fatHits} total={recent.length} goal={fatGoalG} color={MacroColors.fat} theme={theme} />
    </Card>
  );
}

// A day "hits" a macro goal when it's logged food that day and reached at
// least 90% of that macro's daily goal (a small buffer since hitting a gram
// target exactly every day isn't realistic). Returns null (not a count) when
// no goal is set for that macro, so the UI can show "Not set" instead of a
// misleading 0/7.
function countHits(days: HistoryDay[], getValue: (d: HistoryDay) => number, goal: number | null): number | null {
  if (goal === null || goal <= 0) return null;
  return days.filter((d) => d.totalCalories > 0 && getValue(d) >= goal * 0.9).length;
}

function ConsistencyRow({
  label,
  hits,
  total,
  goal,
  color,
  theme,
}: {
  label: string;
  hits: number | null;
  total: number;
  goal: number | null;
  color: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.consistencyRow}>
      <View style={styles.consistencyLabelRow}>
        <ThemedText type="small" themeColor="textSecondary">
          {label}
        </ThemedText>
        <ThemedText type="overline" style={{ color: goal === null ? theme.textTertiary : color }}>
          {goal === null || hits === null ? 'Not set' : `${hits}/${total} Days`}
        </ThemedText>
      </View>
      <View style={[styles.consistencyTrack, { backgroundColor: theme.backgroundSelected }]}>
        <View
          style={[
            styles.consistencyFill,
            { width: `${goal === null || hits === null ? 0 : (hits / total) * 100}%`, backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

function LogWeightModal({
  visible,
  onClose,
  onSaved,
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [weight, setWeight] = useState('');
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  async function handleSave() {
    const value = Number(weight);
    if (!value || value <= 0) return;
    setSaving(true);
    try {
      await api.post('/weight-logs', { weightKg: value });
      toast.show('Weight logged');
      onSaved();
    } catch {
      toast.show('Unable to log weight', 'info');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <ThemedText type="h2">Log today&apos;s weight</ThemedText>
      <TextField
        label="Weight (kg)"
        keyboardType="decimal-pad"
        value={weight}
        onChangeText={setWeight}
        placeholder="75"
        autoFocus
      />
      <Button title="Save" onPress={handleSave} loading={saving} />
      <Button title="Cancel" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.full,
    gap: 2,
  },
  weekLetter: {
    opacity: 0.7,
  },
  weightEmptyCard: {
    gap: Spacing.two,
  },
  weightEmptyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  weightCard: {
    gap: Spacing.two,
  },
  weightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  weightIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightBarsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 96,
    gap: 14,
    paddingTop: Spacing.three,
  },
  weightBarTrack: {
    width: 10,
    height: '100%',
    justifyContent: 'flex-end',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  weightBarFill: {
    width: '100%',
    borderRadius: Radius.full,
    minHeight: 10,
  },
  consistencyCard: {
    gap: Spacing.three,
  },
  consistencyRow: {
    gap: 6,
  },
  consistencyLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  consistencyTrack: {
    height: 10,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  consistencyFill: {
    height: '100%',
    borderRadius: Radius.full,
  },
});
