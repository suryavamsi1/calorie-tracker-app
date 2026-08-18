import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SocialButtonProps {
  provider: 'google' | 'apple';
  title: string;
  onPress: () => void;
  style?: object;
}

/** "Continue with Google/Apple" button matching the auth screen mockups. Same neutral treatment for both providers, consistent across sign-in/sign-up. */
export function SocialButton({ provider, title, onPress, style }: SocialButtonProps) {
  const theme = useTheme();
  const isApple = provider === 'apple';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: theme.border,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      <Icon name={isApple ? 'logo-apple' : 'logo-google'} size={20} color={theme.text} />
      <ThemedText type="bodyBold" style={{ color: theme.text }}>
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    gap: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
});
