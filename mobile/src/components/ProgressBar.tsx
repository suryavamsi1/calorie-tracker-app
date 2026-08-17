import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export interface ProgressBarProps {
  /** 0-1 */
  progress: number;
  color?: string;
  trackColor?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color, trackColor, height = 10, style }: ProgressBarProps) {
  const theme = useTheme();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(Math.max(progress, 0), 1) * 100, {
      duration: 600,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, width]);

  const animatedStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      style={[
        styles.track,
        { height, borderRadius: height / 2, backgroundColor: trackColor ?? theme.backgroundElement },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.fill,
          { height, borderRadius: height / 2, backgroundColor: color ?? theme.primary },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    borderRadius: Radius.full,
  },
});
