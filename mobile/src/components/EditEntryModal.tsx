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

export interface EditEntryModalProps {
  entry: MealEntry | null;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function EditEntryModal({ entry, onClose, onSave, onDelete }: EditEntryModalProps) {
  const theme = useTheme();
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (entry) setQuantity(String(entry.quantity));
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
    setBusy(true);
    try {
      await onSave(parsed);
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
            <ThemedText type="h2">{entry.foodName}</ThemedText>
            <ThemedText themeColor="textSecondary" type="caption">
              {entry.servingSize} {entry.servingUnit} per serving
            </ThemedText>

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
