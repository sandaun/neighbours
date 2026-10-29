import { MORE_MODULE_KEYS, isMoreModuleKey } from '@/data/types';
import { mockAppDataSource as appDataSource } from '@/mocks/app-data';

describe('mock app data source', () => {
  test('returns data for every primary tab', async () => {
    const [home, incidents, documents, accounts] = await Promise.all([
      appDataSource.getHome(),
      appDataSource.getIncidents(),
      appDataSource.getDocuments(),
      appDataSource.getAccounts(),
    ]);

    expect(home.communityName).toBeTruthy();
    expect(home.incidents.length).toBeGreaterThan(0);
    expect(incidents.length).toBeGreaterThan(0);
    expect(documents.length).toBeGreaterThan(0);
    expect(accounts.receipts.length).toBeGreaterThan(0);
  });

  test('returns a typed preview for every More destination', async () => {
    const modules = await Promise.all(
      MORE_MODULE_KEYS.map((key) => appDataSource.getMoreModule(key))
    );

    expect(modules.map((module) => module.key)).toEqual(MORE_MODULE_KEYS);
    // Emergency contacts have their own local screen in both data modes.
    expect(
      modules
        .filter((module) => module.key !== 'emergencies')
        .every((module) => module.sections.length > 0)
    ).toBe(true);
  });

  test('recognizes valid More destination keys', () => {
    expect(isMoreModuleKey('voting')).toBe(true);
    expect(isMoreModuleKey('unknown')).toBe(false);
  });
});
