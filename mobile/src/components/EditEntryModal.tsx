import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
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
  const theme = useTheme();
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
    <Modal transparent animationType="none" visible onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(200)}>
          <ThemedView type="surface" style={[styles.sheet, Shadow.raised]}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

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
              <View style={styles.stepperRow}>
                <Button title="−" variant="secondary" size="sm" onPress={() => adjustQuantity(-0.5)} />
                <TextField
                  keyboardType="decimal-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  style={styles.stepperInput}
                  textAlign="center"
                />
                <Button title="+" variant="secondary" size="sm" onPress={() => adjustQuantity(0.5)} />
              </View>
            </View>

            {!isCustom && onReplaceFood ? (
              <Button title="Logged the wrong food? Change it" variant="secondary" size="sm" onPress={onReplaceFood} />
            ) : null}

            <Button title="Save changes" onPress={handleSave} loading={busy} />
            <Button title="Delete entry" variant="danger" onPress={handleDelete} loading={busy} />
            <Button title="Cancel" variant="ghost" onPress={onClose} />
          </ThemedView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(11,18,32,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.two,
  },
  field: {
    marginVertical: Spacing.two,
    gap: Spacing.one,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  stepperInput: {
    flex: 1,
  },
});
