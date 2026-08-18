import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const AUTO_DISMISS_MS = 2200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    idRef.current += 1;
    const id = idRef.current;
    setToast({ id, message, variant });

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, AUTO_DISMISS_MS);
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? <ToastBanner key={toast.id} message={toast.message} variant={toast.variant} /> : null}
    </ToastContext.Provider>
  );
}

function ToastBanner({ message, variant }: { message: string; variant: ToastVariant }) {
  const theme = useTheme();

  const backgroundColor =
    variant === 'success' ? theme.success : variant === 'error' ? theme.danger : theme.text;
  // 'success' can render as a bright light-green in dark mode (same swatch as
  // `primary`), so it needs the same dark-on-bright treatment as onPrimary.
  // 'info' uses theme.text as its background, so theme.background (its
  // designed contrast partner) is guaranteed to read clearly on top of it.
  const textColor = variant === 'success' ? theme.onPrimary : variant === 'error' ? '#ffffff' : theme.background;
  const icon = variant === 'success' ? '✓' : variant === 'error' ? '!' : 'i';

  return (
    <SafeAreaView style={[styles.wrapper, styles.wrapperPointerEvents]}>
      <Animated.View
        entering={FadeInDown.duration(220)}
        exiting={FadeOutUp.duration(180)}
        style={[styles.toast, Shadow.raised, { backgroundColor }]}
      >
        <ThemedText style={[styles.icon, { color: textColor }]}>{icon}</ThemedText>
        <ThemedText type="bodyBold" style={[styles.message, { color: textColor }]}>
          {message}
        </ThemedText>
      </Animated.View>
    </SafeAreaView>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  wrapperPointerEvents: {
    pointerEvents: 'none',
  },
  toast: {
    marginTop: Spacing.two,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.md,
    maxWidth: '92%',
  },
  icon: {
    fontWeight: '800',
  },
  message: {
  },
});
