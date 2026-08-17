import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  /** 0-1 */
  progress: number;
  color?: string;
  trackColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  size = 160,
  strokeWidth = 14,
  progress,
  color,
  trackColor,
  children,
}: ProgressRingProps) {
  const theme = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = useSharedValue(0);

  useEffect(() => {
    clamped.value = withTiming(Math.min(Math.max(progress, 0), 1), {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, clamped]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - clamped.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor ?? theme.backgroundElement}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? theme.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}, ${circumference}`}
          animatedProps={animatedProps}
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={[styles.content, styles.contentPointerEvents]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentPointerEvents: {
    pointerEvents: 'box-none',
  },
});
