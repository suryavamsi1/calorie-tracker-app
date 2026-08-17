import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { Food, MealType } from '@/types';

type Mode = 'search' | 'quick' | 'custom';

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ mealType: MealType; date: string }>();
  const [mealType, setMealType] = useState<MealType>(params.mealType ?? 'snacks');
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<Mode>('search');

  return (
    <ScreenContainer scroll={false}>
      <MealTypeSelector value={mealType} onChange={setMealType} />

      <View style={styles.tabs}>
        <ModeTab label="Search" active={mode === 'search'} onPress={() => setMode('search')} />
        <ModeTab label="Quick add" active={mode === 'quick'} onPress={() => setMode('quick')} />
        <ModeTab label="Custom food" active={mode === 'custom'} onPress={() => setMode('custom')} />
      </View>

      {mode === 'search' && <SearchTab mealType={mealType} date={date} />}
      {mode === 'quick' && <QuickAddTab mealType={mealType} date={date} />}
      {mode === 'custom' && <CustomFoodTab mealType={mealType} date={date} />}
    </ScreenContainer>
  );
}

function MealTypeSelector({ value, onChange }: { value: MealType; onChange: (m: MealType) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.mealSelectorRow}>
      {MEAL_TYPES.map((type) => {
        const active = type === value;
        return (
          <Pressable
            key={type}
            onPress={() => onChange(type)}
            style={[
              styles.mealChip,
              { backgroundColor: active ? theme.primary : theme.backgroundElement },
            ]}
          >
            <ThemedText type="caption" style={{ color: active ? '#ffffff' : theme.text }}>
              {MEAL_TYPE_LABELS[type]}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
    >
      <ThemedText type="bodyBold" themeColor={active ? 'primary' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function FoodResultCard({
  food,
  onPress,
  onQuickAdd,
  index,
}: {
  food: Food;
  onPress: () => void;
  onQuickAdd: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeInDown.duration(250).delay(Math.min(index, 6) * 30)}>
      <Pressable onPress={onPress}>
        <Card style={styles.resultCard}>
          <View style={styles.resultInfo}>
            <ThemedText type="bodyBold" numberOfLines={1}>
              {food.name}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {food.brand ? `${food.brand} · ` : ''}
              {food.calories} cal · {food.servingSize} {food.servingUnit}
            </ThemedText>
          </View>
          <Pressable onPress={onQuickAdd} hitSlop={8}>
            <View style={styles.quickAddButton}>
              <ThemedText type="h3" style={styles.quickAddPlus}>
                +
              </ThemedText>
            </View>
          </Pressable>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

function SearchTab({ mealType, date }: { mealType: MealType; date: string }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ foods: Food[] }>('/foods/recent')
      .then(({ foods }) => setRecentFoods(foods))
      .catch(() => setRecentFoods([]));
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const { foods } = await api.get<{ foods: Food[] }>(`/foods?query=${encodeURIComponent(query)}`);
        setResults(foods);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function logFood(food: Food, qty: number) {
    setSaving(true);
    try {
      await api.post('/entries', { date, mealType, foodId: food.id, quantity: qty });
      toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (selectedFood) {
    return (
      <Card>
        <ThemedText type="h2">{selectedFood.name}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {selectedFood.calories} cal per {selectedFood.servingSize} {selectedFood.servingUnit}
        </ThemedText>
        <TextField
          label="Quantity (servings)"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Button
          title="Add to meal"
          onPress={() => logFood(selectedFood, Number(quantity) || 1)}
          loading={saving}
        />
        <Button title="Back to search" variant="ghost" onPress={() => setSelectedFood(null)} />
      </Card>
    );
  }

  const showRecent = !query && recentFoods.length > 0;
  const list = showRecent ? recentFoods : results;

  return (
    <View style={styles.flex}>
      <TextField placeholder="Search foods, e.g. chicken" value={query} onChangeText={setQuery} autoFocus />

      {searching ? (
        <View style={styles.searchingRow}>
          <ActivityIndicator size="small" />
          <ThemedText type="caption" themeColor="textSecondary">
            Searching…
          </ThemedText>
        </View>
      ) : null}

      {showRecent ? (
        <ThemedText type="overline" themeColor="textSecondary" style={styles.sectionLabel}>
          Recent foods
        </ThemedText>
      ) : null}

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) => (
          <FoodResultCard
            food={item}
            index={index}
            onPress={() => {
              setSelectedFood(item);
              setQuantity('1');
            }}
            onQuickAdd={() => logFood(item, 1)}
          />
        )}
        ListEmptyComponent={
          query && !searching ? (
            <EmptyState
              icon="🔍"
              title="No matches"
              subtitle="Try quick add or create a custom food instead."
            />
          ) : !query && recentFoods.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="Search for a food"
              subtitle="Your recently logged foods will show up here too."
            />
          ) : null
        }
      />
    </View>
  );
}

function QuickAddTab({ mealType, date }: { mealType: MealType; date: string }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const cals = Number(calories);
    if (!cals) return;
    setSaving(true);
    try {
      await api.post('/entries', {
        date,
        mealType,
        quantity: 1,
        customFoodName: name.trim() || 'Quick add',
        customCalories: cals,
      });
      toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        Log calories without searching the food database.
      </ThemedText>
      <TextField label="Food name (optional)" value={name} onChangeText={setName} placeholder="Snack" />
      <TextField label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
      <Button title="Add to meal" onPress={handleSave} loading={saving} />
    </Card>
  );
}

function CustomFoodTab({ mealType, date }: { mealType: MealType; date: string }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim() || !Number(calories)) return;
    setSaving(true);
    try {
      const { food } = await api.post<{ food: Food }>('/foods/custom', {
        name: name.trim(),
        servingSize: Number(servingSize) || 1,
        servingUnit: servingUnit.trim() || 'serving',
        calories: Number(calories),
      });
      await api.post('/entries', { date, mealType, foodId: food.id, quantity: 1 });
      toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        Create a reusable food to log now and find again later.
      </ThemedText>
      <TextField label="Food name" value={name} onChangeText={setName} placeholder="Homemade smoothie" />
      <TextField label="Serving size" keyboardType="decimal-pad" value={servingSize} onChangeText={setServingSize} />
      <TextField label="Serving unit" value={servingUnit} onChangeText={setServingUnit} placeholder="cup" />
      <TextField label="Calories per serving" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
      <Button title="Save and add to meal" onPress={handleSave} loading={saving} />
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, gap: Spacing.three },
  mealSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  mealChip: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.full,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tab: {
    paddingBottom: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.one,
  },
  resultsList: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.one,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
  },
  quickAddButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(61,126,255,0.12)',
  },
  quickAddPlus: {
    color: '#3D7EFF',
    marginTop: -2,
  },
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
});

