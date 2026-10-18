// Schema snapshot for supabase/migrations/20261018100713_resident_mvp.sql.
// Regenerate against the linked project after applying the migration.
type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};
type Table<Row, RequiredInsert extends keyof Row, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Pick<Row, RequiredInsert> & Partial<Omit<Row, RequiredInsert>>;
  Update: Partial<Row>;
  Relationships: Relationships;
};

export type CommunityRow = { id: string; name: string; created_at: string };
export type UnitRow = {
  id: string;
  community_id: string;
  label: string;
  balance_cents: number;
  next_charge_at: string | null;
  next_charge_cents: number | null;
  created_at: string;
};
export type MembershipRow = {
  community_id: string;
  user_id: string;
  unit_id: string | null;
  display_name: string;
  role: 'resident' | 'admin';
  created_at: string;
};
export type IncidentRow = {
  id: string;
  community_id: string;
  reporter_id: string;
  title: string;
  description: string;
  location: string;
  category: 'plumbing' | 'electrical' | 'elevator' | 'other';
  status: 'received' | 'in-progress' | 'resolved';
  photo_path: string | null;
  reported_at: string;
};
export type IncidentUpdateRow = {
  id: string;
  incident_id: string;
  body: string;
  author_name: string;
  status: IncidentRow['status'] | null;
  created_at: string;
};
export type DocumentRow = {
  id: string;
  community_id: string;
  title: string;
  category: 'minutes' | 'insurance' | 'rules';
  file_size_bytes: number;
  storage_path: string;
  updated_at: string;
};
export type ReceiptRow = {
  id: string;
  community_id: string;
  unit_id: string;
  concept: string;
  amount_cents: number;
  issued_at: string;
  period: string;
  status: 'paid' | 'scheduled';
  storage_path: string | null;
};
export type EventRow = {
  id: string;
  community_id: string;
  title: string;
  location: string;
  starts_at: string;
  ends_at: string | null;
};

export type Database = {
  public: {
    Tables: {
      communities: Table<CommunityRow, 'name'>;
      units: Table<UnitRow, 'community_id' | 'label'>;
      community_members: Table<
        MembershipRow,
        'community_id' | 'user_id' | 'display_name',
        [
          {
            foreignKeyName: 'community_members_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_members_community_id_unit_id_fkey';
            columns: ['community_id', 'unit_id'];
            isOneToOne: false;
            referencedRelation: 'units';
            referencedColumns: ['community_id', 'id'];
          },
        ]
      >;
      incidents: Table<
        IncidentRow,
        'community_id' | 'reporter_id' | 'title' | 'description' | 'location' | 'category'
      >;
      incident_updates: Table<IncidentUpdateRow, 'incident_id' | 'body' | 'author_name'>;
      documents: Table<
        DocumentRow,
        'community_id' | 'title' | 'category' | 'file_size_bytes' | 'storage_path'
      >;
      receipts: Table<
        ReceiptRow,
        'community_id' | 'unit_id' | 'concept' | 'amount_cents' | 'issued_at' | 'period' | 'status'
      >;
      community_events: Table<EventRow, 'community_id' | 'title' | 'location' | 'starts_at'>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
