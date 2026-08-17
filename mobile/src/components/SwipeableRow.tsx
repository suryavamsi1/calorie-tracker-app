import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface SwipeableRowProps {
  children: ReactNode;
  onDelete: () => void;
  onEdit?: () => void;
}

export function SwipeableRow({ children, onDelete, onEdit }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const theme = useTheme();

  function renderRightActions() {
    return (
      <View style={styles.actions}>
        {onEdit ? (
          <View
            style={[styles.action, { backgroundColor: theme.backgroundElement }]}
            onTouchEnd={() => {
              swipeableRef.current?.close();
              onEdit();
            }}
          >
            <ThemedText type="caption">Edit</ThemedText>
          </View>
        ) : null}
        <View
          style={[styles.action, { backgroundColor: theme.danger }]}
          onTouchEnd={() => {
            swipeableRef.current?.close();
            onDelete();
          }}
        >
          <ThemedText type="caption" style={styles.deleteLabel}>
            Delete
          </ThemedText>
        </View>
      </View>
    );
  }

  return (
    <Swipeable ref={swipeableRef} renderRightActions={renderRightActions} overshootRight={false} friction={2}>
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  action: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    marginVertical: Spacing.half,
    marginLeft: Spacing.one,
  },
  deleteLabel: {
    color: '#ffffff',
  },
});
