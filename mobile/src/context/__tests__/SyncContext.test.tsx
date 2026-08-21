import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { SyncProvider, useSync, type CreateEntryInput } from '@/context/SyncContext';
import { ApiError, api } from '@/lib/api';

jest.mock('@/lib/api', () => {
  const actual = jest.requireActual('@/lib/api');
  return {
    ...actual,
    api: { post: jest.fn(), put: jest.fn(), delete: jest.fn(), get: jest.fn() },
  };
});

function wrapper({ children }: { children: ReactNode }) {
  return <SyncProvider>{children}</SyncProvider>;
}

const baseCreateInput: CreateEntryInput = {
  mealType: 'lunch',
  quantity: 1,
  entryDate: '2026-01-15',
  foodId: 'food-1',
  display: {
    foodName: 'Chicken breast',
    servingSize: 100,
    servingUnit: 'g',
    calories: 165,
    proteinG: 31,
    carbsG: 0,
    fatG: 3.6,
  },
};

// SyncProvider registers a real setInterval as a safety-net sync poll - it
// must be unmounted after every test (which triggers its cleanup/
// clearInterval) or the leftover timer keeps the Jest process alive.
let currentUnmount: (() => void) | undefined;

beforeEach(async () => {
  await AsyncStorage.clear();
});

afterEach(() => {
  currentUnmount?.();
  currentUnmount = undefined;
  // Reset only the api mocks (not jest.resetAllMocks()) - that would also
  // wipe the NetInfo jest mock's one-time setup from jest.setup.js, which
  // is only initialized once at module load, not per test.
  (api.post as jest.Mock).mockReset();
  (api.put as jest.Mock).mockReset();
  (api.delete as jest.Mock).mockReset();
});

describe('SyncContext offline mutation queue', () => {
  it('creates an entry optimistically with a local id, and syncs it once the API call succeeds', async () => {
    (api.post as jest.Mock).mockResolvedValue({ entry: { id: 'server-1' } });

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    let localId = '';
    act(() => {
      localId = result.current.createEntry(baseCreateInput);
    });

    expect(localId.startsWith('local_')).toBe(true);
    expect(result.current.queue).toHaveLength(1);

    await waitFor(() => expect(result.current.queue).toHaveLength(0));
    expect(api.post).toHaveBeenCalledWith(
      '/entries',
      expect.objectContaining({ foodId: 'food-1', quantity: 1, mealType: 'lunch' })
    );
  });

  it('coalesces an update into a still-pending create instead of queuing a second mutation', async () => {
    let resolvePost: (value: unknown) => void = () => {};
    (api.post as jest.Mock).mockImplementation(() => new Promise((resolve) => (resolvePost = resolve)));

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    let localId = '';
    act(() => {
      localId = result.current.createEntry(baseCreateInput);
    });
    act(() => {
      result.current.updateEntry(localId, { quantity: 2 }, { calories: 330 });
    });

    expect(result.current.queue).toHaveLength(1);
    const mutation = result.current.queue[0];
    expect(mutation.type).toBe('create-entry');
    if (mutation.type === 'create-entry') {
      expect(mutation.payload.quantity).toBe(2);
      expect(mutation.payload.display.calories).toBe(330);
    }

    resolvePost({ entry: { id: 'server-1' } }); // let the in-flight call settle before unmounting
  });

  it('drops a still-pending create entirely when deleted before it ever syncs', async () => {
    let resolvePost: (value: unknown) => void = () => {};
    (api.post as jest.Mock).mockImplementation(() => new Promise((resolve) => (resolvePost = resolve)));

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    let localId = '';
    act(() => {
      localId = result.current.createEntry(baseCreateInput);
    });
    act(() => {
      result.current.deleteEntry(localId);
    });

    expect(result.current.queue).toHaveLength(0);
    resolvePost({ entry: { id: 'server-1' } });
  });

  it('marks a mutation failed (not stuck pending) on a genuine ApiError, and retryFailed() lets it succeed', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(new ApiError(404, 'Food not found'));

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    act(() => {
      result.current.createEntry(baseCreateInput);
    });

    await waitFor(() => expect(result.current.hasFailedMutations).toBe(true));
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('failed');

    (api.post as jest.Mock).mockResolvedValueOnce({ entry: { id: 'server-2' } });
    act(() => {
      result.current.retryFailed();
    });

    await waitFor(() => expect(result.current.queue).toHaveLength(0));
    expect(result.current.hasFailedMutations).toBe(false);
  });

  it('reverts to pending (not failed) and goes offline on a network-level (non-ApiError) failure', async () => {
    (api.post as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    act(() => {
      result.current.createEntry(baseCreateInput);
    });

    await waitFor(() => expect(result.current.isOnline).toBe(false));
    expect(result.current.queue).toHaveLength(1);
    expect(result.current.queue[0].status).toBe('pending');
    expect(result.current.hasFailedMutations).toBe(false);
  });

  it('exposes the pending status of a given entry via getEntryPendingStatus', async () => {
    let resolvePost: (value: unknown) => void = () => {};
    (api.post as jest.Mock).mockImplementation(() => new Promise((resolve) => (resolvePost = resolve)));

    const { result, unmount } = renderHook(() => useSync(), { wrapper });
    currentUnmount = unmount;

    let localId = '';
    act(() => {
      localId = result.current.createEntry(baseCreateInput);
    });

    expect(['pending', 'syncing']).toContain(result.current.getEntryPendingStatus(localId));
    expect(result.current.getEntryPendingStatus('some-unrelated-id')).toBeUndefined();

    resolvePost({ entry: { id: 'server-1' } });
  });
});
