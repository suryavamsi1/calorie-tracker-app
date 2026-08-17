import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <ToastProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: 'fade_from_bottom',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="welcome" />
              <Stack.Screen name="login" />
              <Stack.Screen name="signup" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="add-food"
                options={{ presentation: 'modal', headerShown: true, title: 'Add food' }}
              />
              <Stack.Screen
                name="history/[date]"
                options={{ headerShown: true, title: 'Day summary', animation: 'slide_from_right' }}
              />
            </Stack>
          </ToastProvider>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
