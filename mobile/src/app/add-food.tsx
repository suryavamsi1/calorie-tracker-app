import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { MacroLine } from '@/components/MacroLine';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { Radius, Spacing } from '@/constants/theme';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import type { Food, MealType } from '@/types';

type Mode = 'search' | 'quick' | 'custom';

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ mealType: MealType; date: string; entryId?: string }>();
  const [mealType, setMealType] = useState<MealType>(params.mealType ?? 'snacks');
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const entryId = params.entryId;

  const [mode, setMode] = useState<Mode>('search');

  return (
    <ScreenContainer scroll={false}>
      <Stack.Screen options={{ title: entryId ? 'Change food' : 'Add food' }} />
      <MealTypeSelector value={mealType} onChange={setMealType} />

      <View style={styles.tabs}>
        <ModeTab label="Search" active={mode === 'search'} onPress={() => setMode('search')} />
        <ModeTab label="Quick add" active={mode === 'quick'} onPress={() => setMode('quick')} />
        <ModeTab label="Custom food" active={mode === 'custom'} onPress={() => setMode('custom')} />
      </View>

      {mode === 'search' && <SearchTab mealType={mealType} date={date} entryId={entryId} />}
      {mode === 'quick' && <QuickAddTab mealType={mealType} date={date} entryId={entryId} />}
      {mode === 'custom' && <CustomFoodTab mealType={mealType} date={date} entryId={entryId} />}
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
  onToggleFavorite,
  index,
}: {
  food: Food;
  onPress: () => void;
  onQuickAdd: () => void;
  onToggleFavorite: () => void;
  index: number;
}) {
  const theme = useTheme();
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
            <MacroLine proteinG={food.proteinG} carbsG={food.carbsG} fatG={food.fatG} />
          </View>
          <Pressable onPress={onToggleFavorite} hitSlop={8}>
            <ThemedText style={styles.favoriteStar} themeColor={food.isFavorite ? 'accent' : 'textTertiary'}>
              {food.isFavorite ? '★' : '☆'}
            </ThemedText>
          </Pressable>
          <Pressable onPress={onQuickAdd} hitSlop={8}>
            <View style={styles.quickAddButton}>
              <ThemedText type="h3" style={[styles.quickAddPlus, { color: theme.primary }]}>
                +
              </ThemedText>
            </View>
          </Pressable>
        </Card>
      </Pressable>
    </Animated.View>
  );
}

function SearchTab({ mealType, date, entryId }: { mealType: MealType; date: string; entryId?: string }) {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [browseTab, setBrowseTab] = useState<'recent' | 'favorites'>('recent');
  const [searching, setSearching] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  function loadRecentAndFavorites() {
    api
      .get<{ foods: Food[] }>('/foods/recent')
      .then(({ foods }) => setRecentFoods(foods))
      .catch(() => setRecentFoods([]));
    api
      .get<{ foods: Food[] }>('/foods/favorites')
      .then(({ foods }) => setFavoriteFoods(foods))
      .catch(() => setFavoriteFoods([]));
  }

  useEffect(() => {
    loadRecentAndFavorites();
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
        track('search_performed', { resultCount: foods.length });
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function logFood(food: Food, qty: number) {
    setSaving(true);
    try {
      if (entryId) {
        await api.put(`/entries/${entryId}`, { foodId: food.id, quantity: qty, mealType, entryDate: date });
        toast.show('Entry updated');
      } else {
        await api.post('/entries', { date, mealType, foodId: food.id, quantity: qty });
        toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
        track('food_logged', { method: 'search', mealType });
      }
      router.back();
    } finally {
      setSaving(false);
    }
  }

  function updateFoodInLists(foodId: string, patch: Partial<Food>) {
    const apply = (list: Food[]) => list.map((f) => (f.id === foodId ? { ...f, ...patch } : f));
    setResults(apply);
    setRecentFoods(apply);
    setFavoriteFoods(apply);
  }

  async function toggleFavorite(food: Food) {
    const nowFavorite = !food.isFavorite;
    updateFoodInLists(food.id, { isFavorite: nowFavorite });
    if (nowFavorite) {
      // Newly favorited foods may not already be in the favorites list
      // (e.g. favorited from search/recent) - add them so the Favorites
      // tab reflects the change immediately.
      setFavoriteFoods((list) =>
        list.some((f) => f.id === food.id) ? list : [{ ...food, isFavorite: true }, ...list]
      );
    }
    try {
      if (food.isFavorite) {
        await api.delete(`/foods/${food.id}/favorite`);
        setFavoriteFoods((list) => list.filter((f) => f.id !== food.id));
      } else {
        await api.post(`/foods/${food.id}/favorite`);
        toast.show('Added to favorites');
      }
    } catch {
      updateFoodInLists(food.id, { isFavorite: food.isFavorite });
      if (nowFavorite) setFavoriteFoods((list) => list.filter((f) => f.id !== food.id));
    }
  }

  if (selectedFood) {
    return (
      <Card>
        <ThemedText type="h2">{selectedFood.name}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {selectedFood.calories} cal per {selectedFood.servingSize} {selectedFood.servingUnit}
        </ThemedText>
        <MacroLine proteinG={selectedFood.proteinG} carbsG={selectedFood.carbsG} fatG={selectedFood.fatG} />
        <TextField
          label="Quantity (servings)"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Button
          title={entryId ? 'Save changes' : 'Add to meal'}
          onPress={() => logFood(selectedFood, Number(quantity) || 1)}
          loading={saving}
        />
        <Button title="Back to search" variant="ghost" onPress={() => setSelectedFood(null)} />
      </Card>
    );
  }

  const browsingList = browseTab === 'recent' ? recentFoods : favoriteFoods;
  const list = query ? results : browsingList;

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

      {!query ? (
        <View style={styles.browseTabsRow}>
          <ModeTab label="Recent" active={browseTab === 'recent'} onPress={() => setBrowseTab('recent')} />
          <ModeTab
            label="Favorites"
            active={browseTab === 'favorites'}
            onPress={() => setBrowseTab('favorites')}
          />
        </View>
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
            onToggleFavorite={() => toggleFavorite(item)}
          />
        )}
        ListEmptyComponent={
          query && !searching ? (
            <EmptyState
              icon="🔍"
              title="No matches"
              subtitle="Try quick add or create a custom food instead."
            />
          ) : !query && browseTab === 'recent' && recentFoods.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="Search for a food"
              subtitle="Your recently logged foods will show up here too."
            />
          ) : !query && browseTab === 'favorites' && favoriteFoods.length === 0 ? (
            <EmptyState icon="★" title="No favorites yet" subtitle="Tap the star on a food to save it here." />
          ) : null
        }
      />
    </View>
  );
}

function QuickAddTab({ mealType, date, entryId }: { mealType: MealType; date: string; entryId?: string }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const cals = Number(calories);
    if (!cals) return;
    setSaving(true);
    try {
      if (entryId) {
        await api.put(`/entries/${entryId}`, {
          mealType,
          entryDate: date,
          customFoodName: name.trim() || 'Quick add',
          customCalories: cals,
        });
        toast.show('Entry updated');
      } else {
        await api.post('/entries', {
          date,
          mealType,
          quantity: 1,
          customFoodName: name.trim() || 'Quick add',
          customCalories: cals,
        });
        toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
        track('food_logged', { method: 'quick_add', mealType });
      }
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
      <Button title={entryId ? 'Save changes' : 'Add to meal'} onPress={handleSave} loading={saving} />
    </Card>
  );
}

function CustomFoodTab({ mealType, date, entryId }: { mealType: MealType; date: string; entryId?: string }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
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
        proteinG: Number(protein) || 0,
        carbsG: Number(carbs) || 0,
        fatG: Number(fat) || 0,
      });
      if (entryId) {
        await api.put(`/entries/${entryId}`, { foodId: food.id, mealType, entryDate: date });
        toast.show('Entry updated');
      } else {
        await api.post('/entries', { date, mealType, foodId: food.id, quantity: 1 });
        toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
        track('food_logged', { method: 'custom', mealType });
      }
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
      <View style={styles.macroInputRow}>
        <View style={styles.macroInput}>
          <TextField label="Protein (g)" keyboardType="decimal-pad" value={protein} onChangeText={setProtein} placeholder="0" />
        </View>
        <View style={styles.macroInput}>
          <TextField label="Carbs (g)" keyboardType="decimal-pad" value={carbs} onChangeText={setCarbs} placeholder="0" />
        </View>
        <View style={styles.macroInput}>
          <TextField label="Fat (g)" keyboardType="decimal-pad" value={fat} onChangeText={setFat} placeholder="0" />
        </View>
      </View>
      <Button title={entryId ? 'Save changes' : 'Save and add to meal'} onPress={handleSave} loading={saving} />
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
  browseTabsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  macroInput: {
    flex: 1,
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
    gap: Spacing.two,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
    paddingRight: Spacing.two,
  },
  favoriteStar: {
    fontSize: 20,
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

