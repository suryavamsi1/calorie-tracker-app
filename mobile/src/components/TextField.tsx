import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  /** Optional leading icon, e.g. for auth screens (mail, lock, person). */
  icon?: IconName;
  /** Optional trailing element, e.g. a password visibility toggle. */
  rightAccessory?: ReactNode;
  /** Style applied to the outer wrapper (e.g. to let it grow inside a row, like QuantityStepper). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Strips the input's own background/border so it blends into a parent surface (e.g. QuantityStepper's pill). */
  bare?: boolean;
}

export function TextField({ label, error, icon, rightAccessory, containerStyle, bare, style, ...rest }: TextFieldProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <ThemedText type="smallBold">{label}</ThemedText> : null}
      <View
        style={[
          styles.inputWrapper,
          bare
            ? styles.bareWrapper
            : {
                backgroundColor: theme.backgroundElement,
                borderColor: error ? theme.danger : 'transparent',
              },
        ]}
      >
        {icon ? <Icon name={icon} size={20} color={theme.textSecondary} /> : null}
        <TextInput
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text }, style]}
          {...rest}
        />
        {rightAccessory}
      </View>
      {error ? (
        <ThemedText type="small" themeColor="danger">
          {error}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.one,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    minHeight: 48,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  bareWrapper: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.twoAndHalf,
    fontSize: 16,
  },
});
