import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: ButtonProps) {
  const theme = useTheme();
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = useCallback<NonNullable<PressableProps['onPressIn']>>(
    (e) => {
      scale.value = withTiming(0.96, { duration: 90 });
      onPressIn?.(e);
    },
    [onPressIn, scale]
  );

  const handlePressOut = useCallback<NonNullable<PressableProps['onPressOut']>>(
    (e) => {
      scale.value = withTiming(1, { duration: 120 });
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );

  const backgroundColor =
    variant === 'primary'
      ? theme.primary
      : variant === 'danger'
        ? theme.danger
        : variant === 'secondary'
          ? theme.backgroundElement
          : 'transparent';

  const textColor = variant === 'primary' || variant === 'danger' ? '#ffffff' : theme.text;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.button,
        size === 'sm' && styles.buttonSm,
        { backgroundColor, opacity: isDisabled ? 0.5 : 1 },
        animatedStyle,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <ThemedText type="bodyBold" style={{ color: textColor }}>
          {title}
        </ThemedText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: Radius.md,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSm: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.sm,
  },
});
