import type { Database, UnitRow } from '@shared/database';

import { one } from '@/lib/rows';
import type { AdminClient } from '@/lib/supabase';

export type { UnitRow };
export type UnitInput = Pick<
  UnitRow,
  'label' | 'balance_cents' | 'next_charge_at' | 'next_charge_cents'
>;

type MemberResult = Database['public']['Functions']['admin_list_members']['Returns'][number];
export type Member = {
  id: string;
  displayName: string;
  email: string;
  unitId: string | null;
  role: MemberResult['role'];
};
export type MemberInput = { displayName: string; unitId: string | null };

// Postgres foreign key violation: the unit still has residents or receipts.
export const isInUse = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === '23503';

export async function listUnits(client: AdminClient, communityId: string) {
  const { data, error } = await client
    .from('units')
    .select('*')
    .eq('community_id', communityId)
    .order('label', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createUnit(client: AdminClient, communityId: string, input: UnitInput) {
  return one(
    await client
      .from('units')
      .insert({ community_id: communityId, ...input })
      .select()
  );
}

export async function updateUnit(client: AdminClient, id: string, input: UnitInput) {
  return one(await client.from('units').update(input).eq('id', id).select());
}

export async function deleteUnit(client: AdminClient, id: string) {
  return one(await client.from('units').delete().eq('id', id).select('id'));
}

export async function listMembers(client: AdminClient, communityId: string): Promise<Member[]> {
  const { data, error } = await client.rpc('admin_list_members', { p_community_id: communityId });
  if (error) throw error;
  return data.map((row) => ({
    id: row.user_id,
    displayName: row.display_name,
    email: row.email,
    unitId: row.unit_id,
    role: row.role,
  }));
}

export async function updateMember(
  client: AdminClient,
  communityId: string,
  userId: string,
  input: MemberInput
) {
  const { error } = await client.rpc('admin_update_member', {
    p_community_id: communityId,
    p_user_id: userId,
    p_display_name: input.displayName.trim(),
    p_unit_id: input.unitId,
  });
  if (error) throw error;
}

// Removes access to this community only; the account and its history remain.
export async function removeMember(client: AdminClient, communityId: string, userId: string) {
  const { error } = await client.rpc('admin_remove_member', {
    p_community_id: communityId,
    p_user_id: userId,
  });
  if (error) throw error;
}
