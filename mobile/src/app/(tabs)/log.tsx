import { router } from 'expo-router';
import { useEffect } from 'react';

/** Fallback route if the "Log" tab is ever deep-linked directly; the tab press is normally intercepted. */
export default function LogRedirect() {
  useEffect(() => {
    router.replace('/add-food');
  }, []);
  return null;
}
