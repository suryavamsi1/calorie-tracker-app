import { Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { TextField } from '@/components/TextField';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface QuantityStepperProps {
  value: string;
  onChangeText: (text: string) => void;
  onDecrement: () => void;
  onIncrement: () => void;
}

/** Integrated pill quantity control (minus/value/plus) shared by the edit-entry and add-food flows. */
export function QuantityStepper({ value, onChangeText, onDecrement, onIncrement }: QuantityStepperProps) {
  const theme = useTheme();
  return (
    <View style={[styles.stepper, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        onPress={onDecrement}
        style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}
        hitSlop={8}
      >
        <Icon name="remove" size={18} color={theme.text} />
      </Pressable>
      <TextField
        keyboardType="decimal-pad"
        value={value}
        onChangeText={onChangeText}
        style={styles.stepperInput}
        textAlign="center"
      />
      <Pressable
        onPress={onIncrement}
        style={({ pressed }) => [styles.stepperButton, { opacity: pressed ? 0.6 : 1 }]}
        hitSlop={8}
      >
        <Icon name="add" size={18} color={theme.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  stepperButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperInput: {
    flex: 1,
    marginVertical: 0,
    textAlign: 'center',
  },
});
