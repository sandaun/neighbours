export type IncidentStatus = 'received' | 'in-progress' | 'resolved';

export type Incident = {
  id: string;
  title: string;
  location: string;
  reportedAt: string;
  status: IncidentStatus;
};

export const INCIDENT_CATEGORIES = ['plumbing', 'electrical', 'elevator', 'other'] as const;
export type IncidentCategory = (typeof INCIDENT_CATEGORIES)[number];

export type IncidentUpdate = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  status?: IncidentStatus;
};

export type IncidentDetail = Incident & {
  description: string;
  category: IncidentCategory;
  photoUrl?: string;
  photoUploadFailed?: boolean;
  updates: IncidentUpdate[];
};

export type CreateIncidentInput = {
  title: string;
  description: string;
  location: string;
  category: IncidentCategory;
  photo?: { base64: string; mimeType: string };
};

export type CommunityEvent = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
};

export type BoardPost = {
  id: string;
  author: string;
  authorInitials: string;
  body: string;
  commentsCount: number;
  publishedAt: string;
  topic: string;
};

export type HomeData = {
  communityName: string;
  incidents: Incident[];
  events: CommunityEvent[];
  boardPosts: BoardPost[];
};

export type CommunityDocument = {
  id: string;
  title: string;
  category: 'minutes' | 'insurance' | 'rules';
  fileType: 'PDF';
  fileSize: string;
  updatedAt: string;
};

export type ReceiptStatus = 'paid' | 'scheduled';

export type Receipt = {
  id: string;
  concept: string;
  amountCents: number;
  issuedAt: string;
  period: string;
  status: ReceiptStatus;
  hasFile?: boolean;
};

export type AccountsData = {
  balanceCents: number;
  nextChargeAt: string | null;
  nextChargeCents: number | null;
  receipts: Receipt[];
};

export const MORE_MODULE_KEYS = [
  'voting',
  'board',
  'bookings',
  'calendar',
  'directory',
  'access',
  'emergencies',
  'profile',
  'notifications',
  'language',
  'privacy',
] as const;

export type MoreModuleKey = (typeof MORE_MODULE_KEYS)[number];

export type ModuleItemTone = 'default' | 'success' | 'warning' | 'danger';

export type ModuleItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  startsAt?: string;
  endsAt?: string;
  badgeKey?: string;
  tone?: ModuleItemTone;
};

export type ModuleSection = {
  id: string;
  titleKey: string;
  items: ModuleItem[];
};

export type MoreModuleData = {
  key: MoreModuleKey;
  descriptionKey: string;
  highlight: {
    labelKey: string;
    value: string;
    tone?: ModuleItemTone;
  };
  sections: ModuleSection[];
};

export function isMoreModuleKey(value: string): value is MoreModuleKey {
  return MORE_MODULE_KEYS.some((key) => key === value);
}
