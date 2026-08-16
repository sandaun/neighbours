import type {
  AccountsData,
  CommunityDocument,
  HomeData,
  Incident,
  MoreModuleData,
  MoreModuleKey,
} from './types';

export type AppDataSource = {
  getAccounts: () => Promise<AccountsData>;
  getDocuments: () => Promise<CommunityDocument[]>;
  getHome: () => Promise<HomeData>;
  getIncidents: () => Promise<Incident[]>;
  getMoreModule: (key: MoreModuleKey) => Promise<MoreModuleData>;
};
