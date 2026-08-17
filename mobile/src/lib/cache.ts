import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'calorie_tracker_cache:';

/**
 * Lightweight local cache used for basic offline tolerance: the last
 * successful response for a given key is persisted, so screens can fall back
 * to "last known good" data when a network request fails instead of showing
 * a blank/broken screen. This does not queue or retry mutations - it only
 * covers read fallback for GET requests.
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable - caching is best-effort, ignore.
  }
}
