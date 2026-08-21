jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    border: '#ccc',
    danger: '#f00',
    textTertiary: '#999',
    text: '#000',
  }),
}));

import { render } from '@testing-library/react-native';
import { EntryRow } from '@/components/EntryRow';
import type { MealEntry } from '@/types';

function makeEntry(overrides: Partial<MealEntry> = {}): MealEntry {
  return {
    id: 'entry-1',
    foodId: 'food-1',
    foodName: 'Chicken breast',
    servingSize: 100,
    servingUnit: 'g',
    quantity: 1,
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
    mealType: 'lunch',
    entryDate: '2026-01-15',
    createdAt: '2026-01-15T12:00:00.000Z',
    ...overrides,
  };
}

describe('EntryRow pending/failed badges', () => {
  it('shows no badge for a normal synced entry', () => {
    const { queryByText } = render(<EntryRow entry={makeEntry()} onPress={() => {}} />);
    expect(queryByText('Pending sync')).toBeNull();
    expect(queryByText('Syncing…')).toBeNull();
  });

  it('shows "Pending sync" for a pending create/update', () => {
    const { getByText } = render(
      <EntryRow entry={makeEntry({ pendingStatus: 'pending', pendingAction: 'create' })} onPress={() => {}} />
    );
    expect(getByText('Pending sync')).toBeTruthy();
  });

  it('shows "Syncing…" while a mutation is in flight', () => {
    const { getByText } = render(
      <EntryRow entry={makeEntry({ pendingStatus: 'syncing', pendingAction: 'update' })} onPress={() => {}} />
    );
    expect(getByText('Syncing…')).toBeTruthy();
  });

  it('shows "Sync failed" for a failed create/update', () => {
    const { getByText } = render(
      <EntryRow entry={makeEntry({ pendingStatus: 'failed', pendingAction: 'update' })} onPress={() => {}} />
    );
    expect(getByText('Sync failed — tap to retry')).toBeTruthy();
  });

  it('shows "Delete failed" specifically for a failed delete', () => {
    const { getByText } = render(
      <EntryRow entry={makeEntry({ pendingStatus: 'failed', pendingAction: 'delete' })} onPress={() => {}} />
    );
    expect(getByText('Delete failed — tap to retry')).toBeTruthy();
  });
});
