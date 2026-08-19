import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { MacroColors, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Food } from '@/types';

export interface FoodResultCardProps {
  food: Food;
  onPress: () => void;
  onQuickAdd: () => void;
  /** Stagger index for the entrance animation. */
  index?: number;
}

/**
 * Search-result row matching the food_search mockup: name/serving + big bold
 * kcal number up top, macro-dot row + add button below - no icon tile, unlike
 * the Recent/Favorites FoodCard layout.
 */
export function FoodResultCard({ food, onPress, onQuickAdd, index = 0 }: FoodResultCardProps) {
  const theme = useTheme();
  const hasMacros = food.proteinG !== null && food.carbsG !== null && food.fatG !== null;

  return (
    <Animated.View entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 30)}>
      <Pressable onPress={onPress}>
        <Card style={styles.card}>
          <View style={styles.topRow}>
            <View style={styles.info}>
              <ThemedText type="small" style={styles.name} numberOfLines={1}>
                {food.name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                {food.brand ? `Brand: ${food.brand} \u2022 ` : ''}
                {food.servingSize} {food.servingUnit}
              </ThemedText>
            </View>
            <View style={styles.kcalWrap}>
              <ThemedText type="h3">{food.calories}</ThemedText>
              <ThemedText type="overline" themeColor="textSecondary">
                kcal
              </ThemedText>
            </View>
          </View>
          <View style={styles.bottomRow}>
            {hasMacros ? (
              <View style={styles.macroDots}>
                <MacroDot color={MacroColors.protein} value={food.proteinG} />
                <MacroDot color={MacroColors.carbs} value={food.carbsG} />
                <MacroDot color={MacroColors.fat} value={food.fatG} />
              </View>
            ) : (
              <View />
            )}
            <Pressable onPress={onQuickAdd} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Add ${food.name} to meal`}>
              <View style={[styles.addButton, { backgroundColor: theme.backgroundSelected }]}>
                <Icon name="add" size={20} color={theme.primary} />
              </View>
            </Pressable>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

function MacroDot({ color, value }: { color: string; value: number | null }) {
  return (
    <View style={styles.macroDotItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText type="smallBold">{value ?? 0}g</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  info: {
    flex: 1,
    gap: 2,
    paddingRight: 8,
  },
  name: {
    fontSize: 18,
    lineHeight: 24,
  },
  kcalWrap: {
    alignItems: 'flex-end',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  macroDots: {
    flexDirection: 'row',
    gap: 12,
  },
  macroDotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
