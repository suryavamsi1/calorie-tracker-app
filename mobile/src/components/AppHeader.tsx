import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

export interface AppHeaderProps {
  title: string;
  /** 'main' (logo + avatar, top-level tabs) or 'detail' (back arrow, pushed screens). */
  variant?: 'main' | 'detail';
  onBack?: () => void;
}

/** Shared top bar used across BiteLog screens, matching the Stitch "Dashboard" header pattern. */
export function AppHeader({ title, variant = 'main', onBack }: AppHeaderProps) {
  const theme = useTheme();
  const { scheme } = useThemeMode();
  const { user } = useAuth();

  return (
    <View style={[styles.container, Shadow.card, { backgroundColor: theme.surface }]}>
      {variant === 'detail' ? (
        <Pressable onPress={onBack ?? (() => router.back())} hitSlop={8} style={styles.iconButton}>
          <Icon name="arrow-back" size={24} color={theme.text} />
        </Pressable>
      ) : (
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        <Image
          source={
            scheme === 'dark'
              ? require('../../assets/images/bitelog-icon-dark.png')
              : require('../../assets/images/bitelog-icon-light.png')
          }
          style={styles.logo}
          resizeMode="contain"
        />
      )}
      <ThemedText type="h2" style={styles.title} numberOfLines={1}>
        {title}
      </ThemedText>
      {variant === 'main' ? (
        <View style={[styles.avatar, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="bodyBold" themeColor="primary">
            {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    gap: Spacing.two + 4,
    paddingHorizontal: Spacing.three + 4,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
  },
  title: {
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
