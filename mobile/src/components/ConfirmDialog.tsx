import { View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { Button } from '@/components/Button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Cross-platform destructive-confirmation dialog. `Alert.alert` is a no-op
 * on react-native-web (no dialog, no fallback), so anything that needs to
 * confirm consistently on both web and native must use an in-app modal like
 * this instead.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <BottomSheet visible={visible} onClose={onCancel}>
      <View style={{ gap: Spacing.two }}>
        <ThemedText type="h2">{title}</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          {message}
        </ThemedText>
        <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} />
        <Button title={cancelLabel} variant="ghost" onPress={onCancel} />
      </View>
    </BottomSheet>
  );
}
