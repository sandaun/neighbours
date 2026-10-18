import { createChunkedStorage } from '../session-storage';

function storageFixture() {
  const items = new Map<string, string>();
  const store = {
    getItem: jest.fn(async (key: string) => items.get(key) ?? null),
    setItem: jest.fn(async (key: string, value: string) => {
      items.set(key, value);
    }),
    removeItem: jest.fn(async (key: string) => {
      items.delete(key);
    }),
  };
  return { items, store, storage: createChunkedStorage(store) };
}

describe('secure session persistence', () => {
  test('round-trips large sessions and removes every old chunk on replacement and logout', async () => {
    const { storage, items, store } = storageFixture();
    const value = 'token-🦊-à'.repeat(2000);
    await storage.setItem('session', value);
    expect(await storage.getItem('session')).toBe(value);
    for (const [, stored] of store.setItem.mock.calls)
      expect(new TextEncoder().encode(stored).length).toBeLessThan(2048);
    await storage.setItem('session', 'short');
    expect(items.size).toBe(2);
    expect(await storage.getItem('session')).toBe('short');
    await storage.removeItem('session');
    expect(items.size).toBe(0);
    expect(await storage.getItem('session')).toBeNull();
  });
  test('removes incomplete sessions rather than returning partial tokens', async () => {
    const { storage, items } = storageFixture();
    await storage.setItem('session', 'a'.repeat(1000));
    items.delete('session.1');
    expect(await storage.getItem('session')).toBeNull();
    expect(items.size).toBe(0);
  });
  test('cleans up when a native chunk write is rejected', async () => {
    const { storage, store, items } = storageFixture();
    store.setItem
      .mockImplementationOnce(async (key, value) => {
        items.set(key, value);
      })
      .mockRejectedValueOnce(new Error('Native store rejected write'));
    await expect(storage.setItem('session', 'token')).rejects.toThrow(
      'Native store rejected write'
    );
    expect(items.size).toBe(0);
  });
  test('serializes concurrent writes and logout so a token cannot reappear', async () => {
    const { storage, items } = storageFixture();
    await Promise.all([storage.setItem('session', 'token'), storage.removeItem('session')]);
    expect(items.size).toBe(0);
  });
  test('retains cleanup metadata if deletion fails so removal can be retried', async () => {
    const { storage, store, items } = storageFixture();
    await storage.setItem('session', 'a'.repeat(1000));
    store.removeItem.mockRejectedValueOnce(new Error('Locked device'));
    await expect(storage.removeItem('session')).rejects.toThrow('Locked device');
    expect(items.has('session.chunks')).toBe(true);
    await storage.removeItem('session');
    expect(items.size).toBe(0);
  });
});
