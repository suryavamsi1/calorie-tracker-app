import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'calorie_tracker_auth_token';

// expo-secure-store has no native implementation on web (its web build is an empty
// stub), so fall back to localStorage there. Native platforms (iOS/Android) use the
// encrypted SecureStore keychain/keystore as intended.
const isWeb = Platform.OS === 'web';

export async function getToken(): Promise<string | null> {
  if (isWeb) return window.localStorage.getItem(TOKEN_KEY);
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setToken(token: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
