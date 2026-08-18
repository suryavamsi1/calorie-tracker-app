import { format } from 'date-fns';

import type { MealType } from '@/types';

export function todayDateString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDisplayDate(dateString: string): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return format(date, 'EEEE, MMM d');
}

export function formatMemberSince(dateString: string): string {
  return format(new Date(dateString), 'MMM yyyy');
}

/** Suggests a sensible default meal based on the time of day, for quick-add shortcuts. */
export function guessMealType(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snacks';
}
