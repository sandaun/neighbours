import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type StorageAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

const nativeStore: StorageAdapter = {
  getItem: SecureStore.getItemAsync,
  setItem: (key, value) =>
    SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    }),
  removeItem: SecureStore.deleteItemAsync,
};

/** Small UTF-16 chunks also fit below historic 2 KB native UTF-8 limits. */
export function createChunkedStorage(store: StorageAdapter): StorageAdapter {
  const queues = new Map<string, Promise<unknown>>();
  function serialize<T>(key: string, action: () => Promise<T>): Promise<T> {
    const next = (queues.get(key) ?? Promise.resolve()).catch(() => undefined).then(action);
    queues.set(key, next);
    void next
      .finally(() => {
        if (queues.get(key) === next) queues.delete(key);
      })
      .catch(() => undefined);
    return next;
  }
  async function count(key: string) {
    const value = Number(await store.getItem(`${key}.chunks`));
    if (!Number.isInteger(value) || value < 0 || value > 10000) {
      throw new Error('Invalid stored session manifest.');
    }
    return value;
  }
  async function remove(key: string) {
    const length = await count(key);
    // Retain the manifest on failure so cleanup can be retried safely.
    const deletions = await Promise.allSettled(
      Array.from({ length }, (_, index) => store.removeItem(`${key}.${index}`))
    );
    const failure = deletions.find((result) => result.status === 'rejected');
    if (failure?.status === 'rejected') throw failure.reason;
    await store.removeItem(`${key}.chunks`);
    await store.removeItem(key);
  }
  return {
    getItem: (key) =>
      serialize(key, async () => {
        const length = await count(key);
        if (!length) return null;
        const chunks = await Promise.all(
          Array.from({ length }, (_, index) => store.getItem(`${key}.${index}`))
        );
        if (chunks.some((chunk) => chunk === null)) {
          await remove(key);
          return null;
        }
        return chunks.join('');
      }),
    setItem: (key, value) =>
      serialize(key, async () => {
        await remove(key);
        const characters = Array.from(value);
        const chunks: string[] = [];
        for (let offset = 0; offset < characters.length; offset += 400)
          chunks.push(characters.slice(offset, offset + 400).join(''));
        if (!chunks.length) chunks.push('');
        // Write cleanup metadata first, including when an individual chunk write fails.
        await store.setItem(`${key}.chunks`, String(chunks.length));
        try {
          for (const [index, chunk] of chunks.entries())
            await store.setItem(`${key}.${index}`, chunk);
        } catch (error) {
          await remove(key);
          throw error;
        }
      }),
    removeItem: (key) => serialize(key, () => remove(key)),
  };
}

export const sessionStorage: StorageAdapter =
  Platform.OS === 'web'
    ? {
        getItem: async (key) =>
          typeof window === 'undefined' ? null : window.localStorage.getItem(key),
        setItem: async (key, value) => {
          if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
        },
        removeItem: async (key) => {
          if (typeof window !== 'undefined') window.localStorage.removeItem(key);
        },
      }
    : createChunkedStorage(nativeStore);
