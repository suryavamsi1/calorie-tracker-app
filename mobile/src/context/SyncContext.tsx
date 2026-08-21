import NetInfo from '@react-native-community/netinfo';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { api, ApiError } from '@/lib/api';
import {
  generateLocalId,
  isLocalId,
  loadQueue,
  saveQueue,
  type CreateEntryPayload,
  type DeleteEntryMutation,
  type MutationStatus,
  type PendingMutation,
  type UpdateEntryPayload,
} from '@/lib/entryQueue';
import type { MealEntry } from '@/types';

export interface CreateEntryInput extends Omit<CreateEntryPayload, 'localEntryId'> {}

interface SyncContextValue {
  queue: PendingMutation[];
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  hasFailedMutations: boolean;
  createEntry: (input: CreateEntryInput) => string;
  updateEntry: (entryId: string, updates: UpdateEntryPayload['updates'], display: UpdateEntryPayload['display']) => void;
  deleteEntry: (entryId: string) => void;
  retryFailed: () => void;
  syncNow: () => void;
  getEntryPendingStatus: (entryId: string) => MutationStatus | undefined;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

export function SyncProvider({ children }: { children: ReactNode }) {
  const [queue, setQueue] = useState<PendingMutation[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const queueRef = useRef<PendingMutation[]>([]);
  const syncingRef = useRef(false);

  const setQueueAndPersist = useCallback((next: PendingMutation[]) => {
    queueRef.current = next;
    setQueue(next);
    saveQueue(next);
  }, []);

  const markStatus = useCallback(
    (id: string, status: MutationStatus, lastError?: string) => {
      setQueueAndPersist(
        queueRef.current.map((m) => (m.id === id ? { ...m, status, lastError } : m))
      );
    },
    [setQueueAndPersist]
  );

  const removeMutation = useCallback(
    (id: string) => {
      setQueueAndPersist(queueRef.current.filter((m) => m.id !== id));
    },
    [setQueueAndPersist]
  );

  // Once an offline-created entry's real server id is known, patch any
  // still-queued update/delete mutations that were targeting its temporary
  // local id, so they can sync correctly in turn.
  const remapEntryId = useCallback(
    (localId: string, serverId: string) => {
      setQueueAndPersist(
        queueRef.current.map((m) => {
          if (m.type === 'update-entry' && m.payload.entryId === localId) {
            return { ...m, payload: { ...m.payload, entryId: serverId } };
          }
          if (m.type === 'delete-entry' && m.payload.entryId === localId) {
            return { ...m, payload: { ...m.payload, entryId: serverId } };
          }
          return m;
        })
      );
    },
    [setQueueAndPersist]
  );

  const processMutation = useCallback(
    async (mutation: PendingMutation): Promise<boolean> => {
      markStatus(mutation.id, 'syncing');
      try {
        if (mutation.type === 'create-entry') {
          const { localEntryId, mealType, quantity, entryDate, foodId, providerFood, customFoodName, customCalories } =
            mutation.payload;
          const { entry } = await api.post<{ entry: MealEntry }>('/entries', {
            date: entryDate,
            mealType,
            quantity,
            foodId,
            providerFood,
            customFoodName,
            customCalories,
          });
          remapEntryId(localEntryId, entry.id);
          removeMutation(mutation.id);
        } else if (mutation.type === 'update-entry') {
          await api.put(`/entries/${mutation.payload.entryId}`, mutation.payload.updates);
          removeMutation(mutation.id);
        } else {
          await api.delete(`/entries/${mutation.payload.entryId}`);
          removeMutation(mutation.id);
        }
        return true;
      } catch (err) {
        if (err instanceof ApiError) {
          // A real rejection from the server (e.g. the entry/food no longer
          // exists) - not a connectivity problem. Surface it and keep going
          // so one bad mutation doesn't block independent ones.
          markStatus(mutation.id, 'failed', err.message);
          return true;
        }
        // Network-level failure - revert to pending and stop; we'll retry
        // once connectivity is detected again.
        markStatus(mutation.id, 'pending');
        setIsOnline(false);
        return false;
      }
    },
    [markStatus, remapEntryId, removeMutation]
  );

  const runSync = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setIsSyncing(true);
    try {
      for (;;) {
        const state = await NetInfo.fetch();
        const online = Boolean(state.isConnected && state.isInternetReachable !== false);
        setIsOnline(online);
        if (!online) break;
        const next = queueRef.current.find((m) => m.status === 'pending');
        if (!next) break;
        const keepGoing = await processMutation(next);
        if (!keepGoing) break;
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [processMutation]);

  useEffect(() => {
    loadQueue().then((persisted) => {
      // Merge rather than overwrite - a mutation can already have been
      // queued (e.g. an action fired immediately after mount) before this
      // initial disk read resolves; overwriting would silently drop it.
      const merged = [...persisted, ...queueRef.current];
      queueRef.current = merged;
      setQueue(merged);
      void runSync();
    });

    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      setIsOnline(online);
      if (online) void runSync();
    });

    // NetInfo only fires when OS-level connectivity actually changes, which
    // won't happen if e.g. the server itself is briefly unreachable while
    // wifi stays connected - so also poll periodically as a safety net
    // whenever there's something left to sync.
    const interval = setInterval(() => {
      if (queueRef.current.some((m) => m.status === 'pending')) void runSync();
    }, 20000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createEntry = useCallback(
    (input: CreateEntryInput): string => {
      const localEntryId = generateLocalId();
      const mutation: PendingMutation = {
        id: generateLocalId(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'create-entry',
        payload: { ...input, localEntryId },
      };
      setQueueAndPersist([...queueRef.current, mutation]);
      void runSync();
      return localEntryId;
    },
    [runSync, setQueueAndPersist]
  );

  const updateEntry = useCallback(
    (entryId: string, updates: UpdateEntryPayload['updates'], display: UpdateEntryPayload['display']) => {
      if (isLocalId(entryId)) {
        const idx = queueRef.current.findIndex(
          (m) => m.type === 'create-entry' && m.payload.localEntryId === entryId && m.status !== 'syncing'
        );
        if (idx !== -1) {
          const next = [...queueRef.current];
          const create = next[idx];
          if (create.type === 'create-entry') {
            next[idx] = {
              ...create,
              payload: {
                ...create.payload,
                mealType: updates.mealType ?? create.payload.mealType,
                quantity: updates.quantity ?? create.payload.quantity,
                entryDate: updates.entryDate ?? create.payload.entryDate,
                foodId: updates.foodId ?? create.payload.foodId,
                providerFood: updates.providerFood ?? create.payload.providerFood,
                customFoodName: updates.customFoodName ?? create.payload.customFoodName,
                customCalories: updates.customCalories ?? create.payload.customCalories,
                display: { ...create.payload.display, ...display },
              },
            };
            setQueueAndPersist(next);
            void runSync();
            return;
          }
        }
      }

      const mutation: PendingMutation = {
        id: generateLocalId(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'update-entry',
        payload: { entryId, updates, display },
      };
      setQueueAndPersist([...queueRef.current, mutation]);
      void runSync();
    },
    [runSync, setQueueAndPersist]
  );

  const deleteEntry = useCallback(
    (entryId: string) => {
      if (isLocalId(entryId)) {
        const idx = queueRef.current.findIndex(
          (m) => m.type === 'create-entry' && m.payload.localEntryId === entryId && m.status !== 'syncing'
        );
        if (idx !== -1) {
          // Never made it to the server - just drop the create (and any
          // updates queued against it) instead of queuing a delete.
          setQueueAndPersist(
            queueRef.current.filter((m, i) => {
              if (i === idx) return false;
              if (m.type === 'update-entry' && m.payload.entryId === entryId) return false;
              return true;
            })
          );
          return;
        }
      }

      const withoutUpdates = queueRef.current.filter(
        (m) => !(m.type === 'update-entry' && m.payload.entryId === entryId)
      );
      const mutation: DeleteEntryMutation = {
        id: generateLocalId(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'delete-entry',
        payload: { entryId },
      };
      setQueueAndPersist([...withoutUpdates, mutation]);
      void runSync();
    },
    [runSync, setQueueAndPersist]
  );

  const retryFailed = useCallback(() => {
    setQueueAndPersist(
      queueRef.current.map((m) => (m.status === 'failed' ? { ...m, status: 'pending', lastError: undefined } : m))
    );
    void runSync();
  }, [runSync, setQueueAndPersist]);

  const syncNow = useCallback(() => {
    void runSync();
  }, [runSync]);

  const getEntryPendingStatus = useCallback(
    (entryId: string): MutationStatus | undefined => {
      const match = queue.find(
        (m) =>
          (m.type === 'create-entry' && m.payload.localEntryId === entryId) ||
          (m.type !== 'create-entry' && m.payload.entryId === entryId)
      );
      return match?.status;
    },
    [queue]
  );

  const pendingCount = useMemo(
    () => queue.filter((m) => m.status === 'pending' || m.status === 'syncing').length,
    [queue]
  );
  const hasFailedMutations = useMemo(() => queue.some((m) => m.status === 'failed'), [queue]);

  const value = useMemo<SyncContextValue>(
    () => ({
      queue,
      isOnline,
      isSyncing,
      pendingCount,
      hasFailedMutations,
      createEntry,
      updateEntry,
      deleteEntry,
      retryFailed,
      syncNow,
      getEntryPendingStatus,
    }),
    [
      queue,
      isOnline,
      isSyncing,
      pendingCount,
      hasFailedMutations,
      createEntry,
      updateEntry,
      deleteEntry,
      retryFailed,
      syncNow,
      getEntryPendingStatus,
    ]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within a SyncProvider');
  return ctx;
}
