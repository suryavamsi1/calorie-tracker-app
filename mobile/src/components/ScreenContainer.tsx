import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export interface ScreenContainerProps extends ViewProps {
  scroll?: boolean;
}

export function ScreenContainer({ children, style, scroll = true, ...rest }: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView contentContainerStyle={[styles.content, style]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  ) : (
    <ThemedView style={[styles.content, { flex: 1 }, style]} {...rest}>
      {children}
    </ThemedView>
  );

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
});
