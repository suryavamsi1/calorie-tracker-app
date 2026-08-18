import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useThemeMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/use-theme';

export interface InsightBannerProps {
  icon?: IconName;
  title: string;
  message: string;
  tone?: 'success' | 'warning' | 'danger';
}

/** Callout used for the dashboard's daily nudge (e.g. "Almost there!"). */
export function InsightBanner({ icon = 'flash', title, message, tone = 'success' }: InsightBannerProps) {
  const theme = useTheme();
  const { scheme } = useThemeMode();

  if (tone === 'success') {
    // Design: solid filled green in light mode, subtle tinted overlay in dark mode.
    const backgroundColor = scheme === 'dark' ? 'rgba(75, 226, 119, 0.1)' : theme.primary;
    const iconCircleBg = scheme === 'dark' ? 'rgba(75, 226, 119, 0.2)' : 'rgba(255, 255, 255, 0.2)';
    const foreground = scheme === 'dark' ? theme.text : '#ffffff';
    const iconColor = scheme === 'dark' ? theme.primary : '#ffffff';

    return (
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
          <Icon name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.text}>
          <ThemedText type="bodyBold" style={{ color: foreground }}>
            {title}
          </ThemedText>
          <ThemedText type="body" style={{ color: foreground }}>
            {message}
          </ThemedText>
        </View>
      </View>
    );
  }

  const backgroundColor = tone === 'danger' ? theme.dangerSoft : theme.warningSoft;
  const accent = tone === 'danger' ? theme.danger : theme.warning;

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={[styles.iconCircle, { backgroundColor: theme.surface }]}>
        <Icon name={icon} size={20} color={accent} />
      </View>
      <View style={styles.text}>
        <ThemedText type="bodyBold">{title}</ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {message}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
