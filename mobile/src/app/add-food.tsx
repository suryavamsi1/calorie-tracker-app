import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/AppHeader';
import { BottomNavBar } from '@/components/BottomNavBar';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { EmptyState } from '@/components/EmptyState';
import { FoodCard } from '@/components/FoodCard';
import { FoodResultCard } from '@/components/FoodResultCard';
import { Icon, type IconName } from '@/components/Icon';
import { MacroBar } from '@/components/MacroBar';
import { QuantityStepper } from '@/components/QuantityStepper';
import { SyncBanner } from '@/components/SyncBanner';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MEAL_TYPES, MEAL_TYPE_LABELS } from '@/constants/options';
import { MealColors, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useSync } from '@/context/SyncContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { getCache, setCache } from '@/lib/cache';
import { round1 } from '@/lib/entryDisplay';
import type { Food, MealType } from '@/types';

type Mode = 'search' | 'quick' | 'custom';

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ mealType: MealType; date: string; entryId?: string }>();
  const [mealType, setMealType] = useState<MealType>(params.mealType ?? 'snacks');
  const date = params.date ?? new Date().toISOString().slice(0, 10);
  const entryId = params.entryId;

  const [mode, setMode] = useState<Mode>('search');

  return (
    <ThemedView style={styles.flex}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView edges={['top']}>
        <AppHeader title={entryId ? 'Change Food' : 'Food Search'} variant="main" />
      </SafeAreaView>

      <View style={styles.body}>
        <MealTypeSelector value={mealType} onChange={setMealType} />
        <SyncBanner />

        <View style={styles.tabs}>
          <Chip label="Search" selected={mode === 'search'} onPress={() => setMode('search')} size="sm" />
          <Chip label="Quick add" selected={mode === 'quick'} onPress={() => setMode('quick')} size="sm" />
          <Chip label="Custom food" selected={mode === 'custom'} onPress={() => setMode('custom')} size="sm" />
        </View>

        {mode === 'search' ? (
          <SearchTab mealType={mealType} onMealTypeChange={setMealType} date={date} entryId={entryId} />
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formScroll}>
              {mode === 'quick' && <QuickAddTab mealType={mealType} date={date} entryId={entryId} />}
              {mode === 'custom' && <CustomFoodTab mealType={mealType} date={date} entryId={entryId} />}
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </View>

      <BottomNavBar active="log" />
    </ThemedView>
  );
}

function MealTypeSelector({ value, onChange }: { value: MealType; onChange: (m: MealType) => void }) {
  return (
    <View style={styles.mealSelectorRow}>
      {MEAL_TYPES.map((type) => (
        <Chip
          key={type}
          label={MEAL_TYPE_LABELS[type]}
          selected={type === value}
          onPress={() => onChange(type)}
          size="sm"
        />
      ))}
    </View>
  );
}

function SearchBar({ value, onChangeText }: { value: string; onChangeText: (text: string) => void }) {
  return (
    <TextField
      icon="search"
      placeholder="Search for a food..."
      value={value}
      onChangeText={onChangeText}
      autoFocus
    />
  );
}

function SearchTab({
  mealType,
  onMealTypeChange,
  date,
  entryId,
}: {
  mealType: MealType;
  onMealTypeChange: (m: MealType) => void;
  date: string;
  entryId?: string;
}) {
  const toast = useToast();
  const theme = useTheme();
  const sync = useSync();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [recentFoods, setRecentFoods] = useState<Food[]>([]);
  const [favoriteFoods, setFavoriteFoods] = useState<Food[]>([]);
  const [browseTab, setBrowseTab] = useState<'recent' | 'favorites'>('recent');
  const [browseError, setBrowseError] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [providerError, setProviderError] = useState(false);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');

  function loadRecentAndFavorites() {
    api
      .get<{ foods: Food[] }>('/foods/recent')
      .then(({ foods }) => {
        setRecentFoods(foods);
        setBrowseError(false);
        setCache('foods:recent', foods);
      })
      .catch(async () => {
        // Offline: fall back to the last cached list so users can still tap
        // a previously-seen food to log it (rather than a hard error state).
        const cached = await getCache<Food[]>('foods:recent');
        if (cached) {
          setRecentFoods(cached);
          setBrowseError(false);
        } else {
          setRecentFoods([]);
          setBrowseError(true);
        }
      });
    api
      .get<{ foods: Food[] }>('/foods/favorites')
      .then(({ foods }) => {
        setFavoriteFoods(foods);
        setBrowseError(false);
        setCache('foods:favorites', foods);
      })
      .catch(async () => {
        const cached = await getCache<Food[]>('foods:favorites');
        if (cached) {
          setFavoriteFoods(cached);
          setBrowseError(false);
        } else {
          setFavoriteFoods([]);
          setBrowseError(true);
        }
      });
  }

  useEffect(() => {
    loadRecentAndFavorites();
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setSearchError(false);
      setProviderError(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        const { foods, providerError: providerFailed } = await api.get<{ foods: Food[]; providerError?: boolean }>(
          `/foods/search?query=${encodeURIComponent(query)}`
        );
        setResults(foods);
        setSearchError(false);
        setProviderError(Boolean(providerFailed));
        track('search_performed', { resultCount: foods.length });
      } catch {
        setResults([]);
        setSearchError(true);
        setProviderError(false);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  // Provider-sourced foods (not-yet-imported search results) need their full
  // normalized snapshot sent along so the server can import it on first use
  // (see resolveProviderFood) - safe to always include when present, the
  // server dedupes by provider+externalId instead of creating duplicates.
  function providerFoodPayload(food: Food) {
    if (food.source !== 'provider' || !food.provider || !food.externalId) return undefined;
    return {
      provider: food.provider,
      externalId: food.externalId,
      name: food.name,
      brand: food.brand,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      proteinG: food.proteinG,
      carbsG: food.carbsG,
      fatG: food.fatG,
    };
  }

  function logFood(food: Food, qty: number) {
    if (!qty || qty <= 0) {
      toast.show('Enter a valid quantity', 'error');
      return;
    }
    const providerFood = providerFoodPayload(food);
    const display = {
      foodName: food.name,
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: Math.round(food.calories * qty),
      proteinG: round1(food.proteinG * qty),
      carbsG: round1(food.carbsG * qty),
      fatG: round1(food.fatG * qty),
    };
    if (entryId) {
      sync.updateEntry(
        entryId,
        { ...(providerFood ? { providerFood } : { foodId: food.id }), quantity: qty, mealType, entryDate: date },
        display
      );
      toast.show('Entry updated');
    } else {
      sync.createEntry({
        mealType,
        quantity: qty,
        entryDate: date,
        ...(providerFood ? { providerFood } : { foodId: food.id }),
        display,
      });
      toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      track('food_logged', { method: 'search', mealType });
    }
    router.back();
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
        const providerFood = providerFoodPayload(food);
        const { food: imported } = await api.post<{ food: Food }>(
          `/foods/${encodeURIComponent(food.id)}/favorite`,
          providerFood
        );
        // Provider results carry a synthetic id until first used - swap it
        // for the real imported id so a later unfavorite/log targets the
        // right row instead of a placeholder reference.
        if (imported.id !== food.id) {
          updateFoodInLists(food.id, { id: imported.id, isFavorite: true });
          setFavoriteFoods((list) => list.map((f) => (f.id === food.id ? { ...f, id: imported.id } : f)));
          setSelectedFood((current) => (current?.id === food.id ? { ...current, id: imported.id } : current));
        }
        toast.show('Added to favorites');
      }
    } catch {
      updateFoodInLists(food.id, { isFavorite: food.isFavorite });
      if (nowFavorite) setFavoriteFoods((list) => list.filter((f) => f.id !== food.id));
    }
  }

  if (selectedFood) {
    return (
      <FoodDetailView
        food={selectedFood}
        mealType={mealType}
        onMealTypeChange={onMealTypeChange}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onToggleFavorite={() => toggleFavorite(selectedFood)}
        onSave={() => logFood(selectedFood, Number(quantity) || 1)}
        onBack={() => setSelectedFood(null)}
        saving={false}
        isEditing={Boolean(entryId)}
      />
    );
  }

  const browsingList = browseTab === 'recent' ? recentFoods : favoriteFoods;
  const list = query ? results : browsingList;

  return (
    <View style={styles.searchTab}>
      <SearchBar value={query} onChangeText={setQuery} />

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
          <Chip label="Recent" selected={browseTab === 'recent'} onPress={() => setBrowseTab('recent')} size="sm" />
          <Chip
            label="Favorites"
            selected={browseTab === 'favorites'}
            onPress={() => setBrowseTab('favorites')}
            size="sm"
          />
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.sectionLabel}>
        {query ? `Results for "${query}"` : browseTab === 'recent' ? 'Recent' : 'Favorites'}
      </ThemedText>

      {query && providerError && !searching && results.length > 0 ? (
        <View style={[styles.providerErrorBanner, { backgroundColor: theme.warningSoft }]}>
          <ThemedText type="caption" themeColor="warning" style={styles.providerErrorText}>
            Live food search is unavailable right now — showing your saved foods.
          </ThemedText>
        </View>
      ) : null}

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item, index }) =>
          query ? (
            <FoodResultCard
              food={item}
              index={index}
              onPress={() => {
                setSelectedFood(item);
                setQuantity('1');
              }}
              onQuickAdd={() => logFood(item, 1)}
            />
          ) : (
            <FoodCard
              food={item}
              index={index}
              onPress={() => {
                setSelectedFood(item);
                setQuantity('1');
              }}
              onQuickAdd={() => logFood(item, 1)}
              onToggleFavorite={() => toggleFavorite(item)}
            />
          )
        }
        ListEmptyComponent={
          query && !searching && searchError ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't search right now"
              subtitle="Check your connection and try again."
            />
          ) : query && !searching && providerError ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Live search is unavailable"
              subtitle="We couldn't reach the food database. Try quick add or create a custom food instead."
            />
          ) : query && !searching ? (
            <EmptyState
              icon="search-outline"
              title="No matches"
              subtitle="Try quick add or create a custom food instead."
            />
          ) : !query && browseError ? (
            <EmptyState
              icon="alert-circle-outline"
              title="Couldn't load foods"
              subtitle="Check your connection and try again."
              actionLabel="Retry"
              onAction={loadRecentAndFavorites}
            />
          ) : !query && browseTab === 'recent' && recentFoods.length === 0 ? (
            <EmptyState
              icon="restaurant-outline"
              title="Search for a food"
              subtitle="Your recently logged foods will show up here too."
            />
          ) : !query && browseTab === 'favorites' && favoriteFoods.length === 0 ? (
            <EmptyState icon="star-outline" title="No favorites yet" subtitle="Tap the star on a food to save it here." />
          ) : null
        }
      />
    </View>
  );
}

const MEAL_TYPE_ICONS: Record<MealType, IconName> = {
  breakfast: MealColors.breakfast.icon,
  lunch: MealColors.lunch.icon,
  dinner: MealColors.dinner.icon,
  snacks: MealColors.snacks.icon,
};

/**
 * "Log Entry" confirmation screen shown after picking a food. Matches the
 * log_entry_detail mockup, except: no hero photo (foods have no image data)
 * and no serving-size dropdown (foods only have a single serving size/unit,
 * so a dropdown would have nothing real to switch between).
 */
function FoodDetailView({
  food,
  mealType,
  onMealTypeChange,
  quantity,
  onQuantityChange,
  onToggleFavorite,
  onSave,
  onBack,
  saving,
  isEditing,
}: {
  food: Food;
  mealType: MealType;
  onMealTypeChange: (m: MealType) => void;
  quantity: string;
  onQuantityChange: (text: string) => void;
  onToggleFavorite: () => void;
  onSave: () => void;
  onBack: () => void;
  saving: boolean;
  isEditing: boolean;
}) {
  const theme = useTheme();
  const qty = Number(quantity) || 0;

  function adjustQuantity(delta: number) {
    const next = Math.max(0.5, Math.round((qty + delta) * 2) / 2);
    onQuantityChange(String(next));
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.detailContainer} keyboardShouldPersistTaps="handled">
      <Card style={styles.detailHeaderCard}>
        <View style={[styles.detailIconTile, { backgroundColor: theme.backgroundElement }]}>
          <Icon name="restaurant-outline" size={28} color={theme.primary} />
        </View>
        <View style={styles.flexOne}>
          <ThemedText type="h2" numberOfLines={2}>
            {food.name}
          </ThemedText>
          {food.brand ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {food.brand}
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          onPress={onToggleFavorite}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={food.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Icon
            name={food.isFavorite ? 'star' : 'star-outline'}
            size={22}
            color={food.isFavorite ? theme.accent : theme.textTertiary}
          />
        </Pressable>
      </Card>

      <Card style={styles.detailNutritionCard}>
        <ThemedText type="overline" themeColor="textSecondary">
          Calories
        </ThemedText>
        <View style={styles.detailCalorieRow}>
          <ThemedText type="display" themeColor="primary">
            {Math.round(food.calories * qty)}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            kcal
          </ThemedText>
        </View>

        <ThemedText type="smallBold" style={styles.detailMacroLabel}>
          Macros Breakdown
        </ThemedText>
        <MacroBar
          proteinG={food.proteinG !== null ? food.proteinG * qty : null}
          carbsG={food.carbsG !== null ? food.carbsG * qty : null}
          fatG={food.fatG !== null ? food.fatG * qty : null}
        />
      </Card>

      <View style={styles.field}>
        <ThemedText type="caption" themeColor="textSecondary">
          Quantity ({food.servingSize} {food.servingUnit} per serving)
        </ThemedText>
        <QuantityStepper
          value={quantity}
          onChangeText={onQuantityChange}
          onDecrement={() => adjustQuantity(-0.5)}
          onIncrement={() => adjustQuantity(0.5)}
        />
      </View>

      <View style={styles.field}>
        <ThemedText type="caption" themeColor="textSecondary">
          Log to Meal
        </ThemedText>
        <View style={styles.mealGrid}>
          {MEAL_TYPES.map((type) => {
            const selected = type === mealType;
            return (
              <Pressable
                key={type}
                onPress={() => onMealTypeChange(type)}
                style={[
                  styles.mealGridTile,
                  { backgroundColor: selected ? theme.primary : theme.backgroundElement },
                ]}
              >
                <Icon name={MEAL_TYPE_ICONS[type]} size={20} color={selected ? theme.onPrimary : theme.textSecondary} />
                <ThemedText type="small" style={{ color: selected ? theme.onPrimary : theme.text }}>
                  {MEAL_TYPE_LABELS[type]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Button
        title={isEditing ? 'Save changes' : 'Add to meal'}
        onPress={onSave}
        loading={saving}
      />
      <Button title="Back to search" variant="ghost" onPress={onBack} />
    </ScrollView>
  );
}

function QuickAddTab({ mealType, date, entryId }: { mealType: MealType; date: string; entryId?: string }) {
  const toast = useToast();
  const sync = useSync();
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');

  function handleSave() {
    const cals = Number(calories);
    if (!cals || cals <= 0) {
      toast.show('Enter how many calories this is', 'error');
      return;
    }
    const foodName = name.trim() || 'Quick add';
    const display = { foodName, servingSize: 1, servingUnit: 'serving', calories: cals, proteinG: null, carbsG: null, fatG: null };
    if (entryId) {
      sync.updateEntry(
        entryId,
        { mealType, entryDate: date, customFoodName: foodName, customCalories: cals },
        display
      );
      toast.show('Entry updated');
    } else {
      sync.createEntry({ mealType, quantity: 1, entryDate: date, customFoodName: foodName, customCalories: cals, display });
      toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
      track('food_logged', { method: 'quick_add', mealType });
    }
    router.back();
  }

  return (
    <Card>
      <ThemedText type="caption" themeColor="textSecondary">
        Log calories without searching the food database.
      </ThemedText>
      <TextField label="Food name (optional)" value={name} onChangeText={setName} placeholder="Snack" />
      <TextField label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
      <Button title={entryId ? 'Save changes' : 'Add to meal'} onPress={handleSave} />
    </Card>
  );
}

function CustomFoodTab({ mealType, date, entryId }: { mealType: MealType; date: string; entryId?: string }) {
  const toast = useToast();
  const sync = useSync();
  const [name, setName] = useState('');
  const [servingSize, setServingSize] = useState('1');
  const [servingUnit, setServingUnit] = useState('serving');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);

  // Creating a brand-new custom food requires the network (it's out of scope
  // for the offline queue - see Offline Actions MVP). Logging an ENTRY
  // against the resulting foodId, though, goes through the queue like any
  // other entry, so it's consistent with the rest of the app.
  async function handleSave() {
    if (!name.trim()) {
      toast.show('Enter a food name', 'error');
      return;
    }
    if (!Number(calories) || Number(calories) <= 0) {
      toast.show('Enter calories per serving', 'error');
      return;
    }
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
      const display = {
        foodName: food.name,
        servingSize: food.servingSize,
        servingUnit: food.servingUnit,
        calories: food.calories,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
      };
      if (entryId) {
        sync.updateEntry(entryId, { foodId: food.id, mealType, entryDate: date }, display);
        toast.show('Entry updated');
      } else {
        sync.createEntry({ mealType, quantity: 1, entryDate: date, foodId: food.id, display });
        toast.show(`Added to ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`);
        track('food_logged', { method: 'custom', mealType });
      }
      router.back();
    } catch {
      toast.show("Couldn't save this food. Check your connection.", 'error');
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
  flex: { flex: 1 },
  body: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  searchTab: {
    flex: 1,
    gap: Spacing.three,
  },
  formScroll: {
    flexGrow: 1,
  },
  mealSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  tabs: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sectionLabel: {
    marginTop: Spacing.one,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  providerErrorBanner: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  providerErrorText: {
    textAlign: 'center',
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
  searchingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flexOne: { flex: 1 },
  field: {
    gap: Spacing.one,
  },
  detailContainer: {
    flexGrow: 1,
    gap: Spacing.three,
  },
  detailHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  detailIconTile: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailNutritionCard: {
    gap: Spacing.one,
  },
  detailCalorieRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: Spacing.two,
  },
  detailMacroLabel: {
    marginBottom: Spacing.one,
  },
  mealGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  mealGridTile: {
    flexBasis: '47%',
    flexGrow: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: Spacing.three,
    borderRadius: Radius.md,
  },
});

