import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import type { MealEntry } from '@/types';

export interface EditEntryModalProps {
  entry: MealEntry | null;
  onClose: () => void;
  onSave: (quantity: number) => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}

export function EditEntryModal({ entry, onClose, onSave, onDelete }: EditEntryModalProps) {
  const [quantity, setQuantity] = useState('1');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (entry) setQuantity(String(entry.quantity));
  }, [entry]);

  if (!entry) return null;

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
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()}>
          <ThemedView type="background" style={styles.sheet}>
            <ThemedText type="subtitle">{entry.foodName}</ThemedText>
            <ThemedText themeColor="textSecondary" type="small">
              {entry.servingSize} {entry.servingUnit} per serving
            </ThemedText>

            <View style={styles.field}>
              <TextField
                label="Quantity (servings)"
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
              />
            </View>

            <Button title="Save changes" onPress={handleSave} loading={busy} />
            <Button title="Delete entry" variant="danger" onPress={handleDelete} loading={busy} />
            <Button title="Cancel" variant="ghost" onPress={onClose} />
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  field: {
    marginVertical: Spacing.two,
  },
});
