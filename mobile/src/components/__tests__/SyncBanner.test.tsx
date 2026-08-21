const mockRetryFailed = jest.fn();
let mockSyncState: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  hasFailedMutations: boolean;
  retryFailed: () => void;
};

jest.mock('@/context/SyncContext', () => ({
  useSync: () => mockSyncState,
}));

jest.mock('@/hooks/use-theme', () => ({
  useTheme: () => ({
    dangerSoft: '#fdd',
    danger: '#f00',
    warningSoft: '#ffd',
    warning: '#a80',
    successSoft: '#dfd',
    success: '#080',
  }),
}));

import { fireEvent, render } from '@testing-library/react-native';
import { SyncBanner } from '@/components/SyncBanner';

function setSyncState(overrides: Partial<typeof mockSyncState>) {
  mockSyncState = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    hasFailedMutations: false,
    retryFailed: mockRetryFailed,
    ...overrides,
  };
}

describe('SyncBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when online, idle, and nothing pending', () => {
    setSyncState({});
    const { toJSON } = render(<SyncBanner />);
    expect(toJSON()).toBeNull();
  });

  it('shows a failed-mutations banner (highest priority) and retries on tap', () => {
    setSyncState({ hasFailedMutations: true, isOnline: false, pendingCount: 2 });
    const { getByText } = render(<SyncBanner />);

    const banner = getByText('Some changes failed to sync — tap to retry');
    fireEvent.press(banner);
    expect(mockRetryFailed).toHaveBeenCalled();
  });

  it('shows an offline banner mentioning the pending count', () => {
    setSyncState({ isOnline: false, pendingCount: 3 });
    const { getByText } = render(<SyncBanner />);
    expect(getByText("Offline — 3 changes will sync when you're back online")).toBeTruthy();
  });

  it('uses singular wording for exactly one pending change while offline', () => {
    setSyncState({ isOnline: false, pendingCount: 1 });
    const { getByText } = render(<SyncBanner />);
    expect(getByText("Offline — 1 change will sync when you're back online")).toBeTruthy();
  });

  it('shows a generic offline message when nothing is pending yet', () => {
    setSyncState({ isOnline: false, pendingCount: 0 });
    const { getByText } = render(<SyncBanner />);
    expect(getByText("Offline — changes will sync when you're back online")).toBeTruthy();
  });

  it('shows a syncing banner when online with pending/in-flight mutations', () => {
    setSyncState({ isOnline: true, isSyncing: true, pendingCount: 1 });
    const { getByText } = render(<SyncBanner />);
    expect(getByText('Syncing…')).toBeTruthy();
  });
});
