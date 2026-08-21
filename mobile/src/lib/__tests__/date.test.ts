import { formatDisplayDate, formatMemberSince, guessMealType, todayDateString } from '@/lib/date';

describe('todayDateString', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('formats the current date as yyyy-MM-dd', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 5, 10, 0, 0)); // Jan 5 2026
    expect(todayDateString()).toBe('2026-01-05');
  });
});

describe('formatDisplayDate', () => {
  it('formats a yyyy-MM-dd string as a full weekday/month/day', () => {
    expect(formatDisplayDate('2026-08-19')).toBe('Wednesday, Aug 19');
  });
});

describe('formatMemberSince', () => {
  it('formats an ISO date string as month/year', () => {
    expect(formatMemberSince('2025-03-14T00:00:00.000Z')).toMatch(/Mar 2025/);
  });
});

describe('guessMealType', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it.each([
    [6, 'breakfast'],
    [10, 'breakfast'],
    [11, 'lunch'],
    [15, 'lunch'],
    [16, 'dinner'],
    [20, 'dinner'],
    [21, 'snacks'],
    [23, 'snacks'],
  ] as const)('returns %s at hour %i -> %s', (hour, expected) => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 0, 1, hour, 0, 0));
    expect(guessMealType()).toBe(expected);
  });
});
