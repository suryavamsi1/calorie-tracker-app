import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/Icon';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

export type BottomNavTab = 'home' | 'log' | 'history' | 'profile';

const TABS: Array<{ key: BottomNavTab; label: string; icon: IconName; activeIcon: IconName; path: string }> = [
  { key: 'home', label: 'Home', icon: 'home-outline', activeIcon: 'home', path: '/(tabs)' },
  { key: 'log', label: 'Log', icon: 'add-circle', activeIcon: 'add-circle', path: '' },
  { key: 'history', label: 'History', icon: 'calendar-outline', activeIcon: 'calendar', path: '/history' },
  { key: 'profile', label: 'Profile', icon: 'person-outline', activeIcon: 'person', path: '/profile' },
];

/**
 * Visual re-creation of the (tabs) bottom bar, for stack screens (like
 * add-food) that the Stitch mockups still show the nav bar on even though
 * they live outside the Tabs navigator.
 */
export function BottomNavBar({ active }: { active: BottomNavTab }) {
  const theme = useTheme();

  return (
    <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const focused = tab.key === active;
          const color = focused ? theme.primary : theme.textSecondary;
          return (
            <Pressable
              key={tab.key}
              style={styles.item}
              disabled={focused}
              onPress={() => {
                if (tab.path) router.replace(tab.path as never);
              }}
            >
              <Icon name={focused ? tab.activeIcon : tab.icon} size={22} color={color} />
              <ThemedText type="overline" style={[styles.label, { color }]}>
                {tab.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    height: 56,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0,
    textTransform: 'none',
  },
});
