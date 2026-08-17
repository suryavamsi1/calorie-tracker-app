import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { api } from '@/lib/api';
import type { Food, MealType } from '@/types';

type Mode = 'search' | 'quick' | 'custom';

export default function AddFoodScreen() {
  const params = useLocalSearchParams<{ mealType: MealType; date: string }>();
  const mealType = params.mealType ?? 'snacks';
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const [mode, setMode] = useState<Mode>('search');

  return (
    <ScreenContainer scroll={false}>
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

function ModeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
    >
      <ThemedText type="smallBold" themeColor={active ? 'primary' : 'textSecondary'}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function SearchTab({ mealType, date }: { mealType: MealType; date: string }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Food[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handle = setTimeout(async () => {
      const { foods } = await api.get<{ foods: Food[] }>(`/foods?query=${encodeURIComponent(query)}`);
      setResults(foods);
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  async function handleLog() {
    if (!selectedFood) return;
    const qty = Number(quantity) || 1;
    setSaving(true);
    try {
      await api.post('/entries', { date, mealType, foodId: selectedFood.id, quantity: qty });
      router.back();
    } finally {
      setSaving(false);
    }
  }

  if (selectedFood) {
    return (
      <Card>
        <ThemedText type="subtitle">{selectedFood.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {selectedFood.calories} cal per {selectedFood.servingSize} {selectedFood.servingUnit}
        </ThemedText>
        <TextField
          label="Quantity (servings)"
          keyboardType="decimal-pad"
          value={quantity}
          onChangeText={setQuantity}
        />
        <Button title="Add to meal" onPress={handleLog} loading={saving} />
        <Button title="Back to search" variant="ghost" onPress={() => setSelectedFood(null)} />
      </Card>
    );
  }

  return (
    <View style={styles.flex}>
      <TextField placeholder="Search foods, e.g. chicken" value={query} onChangeText={setQuery} autoFocus />
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.resultsList}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedFood(item)}>
            <Card style={styles.resultCard}>
              <ThemedText type="smallBold">{item.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {item.calories} cal · {item.servingSize} {item.servingUnit}
              </ThemedText>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={
          query ? (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              No matches. Try quick add or create a custom food.
            </ThemedText>
          ) : null
        }
      />
    </View>
  );
}

function QuickAddTab({ mealType, date }: { mealType: MealType; date: string }) {
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
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        Log calories without searching the food database.
      </ThemedText>
      <TextField label="Food name (optional)" value={name} onChangeText={setName} placeholder="Snack" />
      <TextField label="Calories" keyboardType="number-pad" value={calories} onChangeText={setCalories} />
      <Button title="Add to meal" onPress={handleSave} loading={saving} />
    </Card>
  );
}

function CustomFoodTab({ mealType, date }: { mealType: MealType; date: string }) {
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
      router.back();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
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
  tabs: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  tab: {
    paddingBottom: Spacing.two,
  },
  resultsList: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  resultCard: {
    marginBottom: Spacing.one,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.four,
  },
});
