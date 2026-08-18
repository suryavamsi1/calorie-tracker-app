import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { MacroBar } from '@/components/MacroBar';
import { QuantityStepper } from '@/components/QuantityStepper';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import type { MealEntry } from '@/types';

export interface EntryUpdates {
  quantity: number;
  customFoodName?: string;
  customCalories?: number;
}

export interface EditEntryModalProps {
  entry: MealEntry | null;
  onClose: () => void;
  onSave: (updates: EntryUpdates) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  /** Only offered for entries linked to a catalog food (wrong food logged). */
  onReplaceFood?: () => void;
}

export function EditEntryModal({ entry, onClose, onSave, onDelete, onReplaceFood }: EditEntryModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [customName, setCustomName] = useState('');
  const [customCalories, setCustomCalories] = useState('');
  const [busy, setBusy] = useState(false);

  const isCustom = entry ? !entry.foodId : false;

  useEffect(() => {
    if (!entry) return;
    setQuantity(String(entry.quantity));
    if (!entry.foodId) {
      setCustomName(entry.foodName);
      // calories on the entry are already multiplied by quantity; show the
      // per-serving amount for editing.
      setCustomCalories(String(Math.round(entry.calories / entry.quantity)));
    }
  }, [entry]);

  if (!entry) return null;

  function adjustQuantity(delta: number) {
    const current = Number(quantity) || 0;
    const next = Math.max(0.5, Math.round((current + delta) * 2) / 2);
    setQuantity(String(next));
  }

  async function handleSave() {
    const parsed = Number(quantity);
    if (!parsed || parsed <= 0) return;
    if (isCustom && (!customName.trim() || !Number(customCalories))) return;

    setBusy(true);
    try {
      await onSave({
        quantity: parsed,
        ...(isCustom
          ? { customFoodName: customName.trim(), customCalories: Number(customCalories) }
          : {}),
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
    }
  }

  return (
    <BottomSheet visible onClose={onClose}>
            {isCustom ? (
              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Food name
                </ThemedText>
                <TextField value={customName} onChangeText={setCustomName} />
              </View>
            ) : (
              <>
                <ThemedText type="h2">{entry.foodName}</ThemedText>
                <ThemedText themeColor="textSecondary" type="caption">
                  {entry.servingSize} {entry.servingUnit} per serving
                </ThemedText>
                <MacroBar proteinG={entry.proteinG} carbsG={entry.carbsG} fatG={entry.fatG} />
              </>
            )}

            {isCustom ? (
              <View style={styles.field}>
                <ThemedText type="caption" themeColor="textSecondary">
                  Calories per serving
                </ThemedText>
                <TextField
                  keyboardType="number-pad"
                  value={customCalories}
                  onChangeText={setCustomCalories}
                />
              </View>
            ) : null}

            <View style={styles.field}>
              <ThemedText type="caption" themeColor="textSecondary">
                Quantity (servings)
              </ThemedText>
              <QuantityStepper
                value={quantity}
                onChangeText={setQuantity}
                onDecrement={() => adjustQuantity(-0.5)}
                onIncrement={() => adjustQuantity(0.5)}
              />
            </View>

            {!isCustom && onReplaceFood ? (
              <Button title="Logged the wrong food? Change it" variant="secondary" size="sm" onPress={onReplaceFood} />
            ) : null}

            <Button title="Save changes" onPress={handleSave} loading={busy} />
            <Button title="Delete entry" variant="danger" onPress={handleDelete} loading={busy} />
            <Button title="Cancel" variant="ghost" onPress={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  field: {
    marginVertical: Spacing.two,
    gap: Spacing.one,
  },
});
