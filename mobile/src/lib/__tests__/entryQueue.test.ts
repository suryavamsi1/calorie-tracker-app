import AsyncStorage from '@react-native-async-storage/async-storage';

import { generateLocalId, isLocalId, loadQueue, saveQueue, type PendingMutation } from '@/lib/entryQueue';

describe('entryQueue', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  describe('generateLocalId / isLocalId', () => {
    it('generates ids prefixed with local_', () => {
      const id = generateLocalId();
      expect(id.startsWith('local_')).toBe(true);
      expect(isLocalId(id)).toBe(true);
    });

    it('generates unique ids on successive calls', () => {
      const ids = new Set(Array.from({ length: 20 }, () => generateLocalId()));
      expect(ids.size).toBe(20);
    });

    it('does not treat a real server id (uuid-like) as a local id', () => {
      expect(isLocalId('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe(false);
    });
  });

  describe('loadQueue / saveQueue', () => {
    it('returns an empty array when nothing is persisted yet', async () => {
      expect(await loadQueue()).toEqual([]);
    });

    it('round-trips a queue through AsyncStorage', async () => {
      const queue: PendingMutation[] = [
        {
          id: 'mut-1',
          createdAt: new Date().toISOString(),
          status: 'pending',
          type: 'delete-entry',
          payload: { entryId: 'entry-1' },
        },
      ];
      await saveQueue(queue);
      expect(await loadQueue()).toEqual(queue);
    });

    it('returns an empty array if the persisted value is corrupted JSON', async () => {
      await AsyncStorage.setItem('calorie_tracker_entry_queue:v1', 'not json{{{');
      expect(await loadQueue()).toEqual([]);
    });
  });
});
