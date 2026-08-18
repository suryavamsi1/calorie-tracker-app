import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { MacroLine } from '@/components/MacroLine';
import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Food } from '@/types';

export interface FoodCardProps {
  food: Food;
  onPress: () => void;
  onQuickAdd: () => void;
  onToggleFavorite: () => void;
  /** Stagger index for the entrance animation. */
  index?: number;
}

/** Reusable row for a food catalog result (search, recent, favorites). */
export function FoodCard({ food, onPress, onQuickAdd, onToggleFavorite, index = 0 }: FoodCardProps) {
  const theme = useTheme();
  return (
    <Animated.View entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 30)}>
      <Pressable onPress={onPress}>
        <Card style={styles.card}>
          <View style={[styles.iconTile, { backgroundColor: theme.backgroundElement }]}>
            <Icon name="restaurant-outline" size={22} color={theme.primary} />
          </View>
          <View style={styles.info}>
            <ThemedText type="small" style={styles.name} numberOfLines={1}>
              {food.name}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary" style={styles.metadata}>
              {food.brand ? `${food.brand} · ` : ''}
              {food.calories} cal · {food.servingSize} {food.servingUnit}
            </ThemedText>
            <MacroLine proteinG={food.proteinG} carbsG={food.carbsG} fatG={food.fatG} />
          </View>
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <Icon
              name={food.isFavorite ? 'star' : 'star-outline'}
              size={20}
              color={food.isFavorite ? theme.accent : theme.textTertiary}
            />
          </Pressable>
          <Pressable onPress={onQuickAdd} hitSlop={8}>
            <View style={[styles.quickAddButton, { backgroundColor: theme.backgroundSelected }]}>
              <Icon name="add" size={20} color={theme.primary} />
            </View>
          </Pressable>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    lineHeight: 24,
  },
  metadata: {
    fontSize: 16,
    lineHeight: 22,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
