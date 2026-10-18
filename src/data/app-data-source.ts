import type {
  AccountsData,
  CommunityDocument,
  CreateIncidentInput,
  HomeData,
  Incident,
  IncidentDetail,
  MoreModuleData,
  MoreModuleKey,
} from './types';

export type AppDataSource = {
  getAccounts: () => Promise<AccountsData>;
  getDocuments: () => Promise<CommunityDocument[]>;
  getHome: () => Promise<HomeData>;
  getIncidents: () => Promise<Incident[]>;
  getMoreModule: (key: MoreModuleKey) => Promise<MoreModuleData>;
  getIncident: (id: string) => Promise<IncidentDetail>;
  createIncident: (input: CreateIncidentInput) => Promise<IncidentDetail>;
  getDocumentUrl: (id: string) => Promise<string>;
  getReceiptUrl: (id: string) => Promise<string>;
};
