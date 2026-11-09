import type { AdminClient } from '@/lib/supabase';

export type AdminCommunity = {
  communityId: string;
  communityName: string;
  displayName: string;
};

export async function signInWithPassword(client: AdminClient, email: string, password: string) {
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

// RLS only returns the signed-in user's own memberships (members_read_self).
export async function loadAdminCommunities(
  client: AdminClient,
  userId: string
): Promise<AdminCommunity[]> {
  const { data, error } = await client
    .from('community_members')
    .select('community_id, display_name, communities!inner(name)')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .order('created_at', { ascending: true })
    .order('community_id', { ascending: true });
  if (error) throw error;
  return data
    .map((row) => ({
      communityId: row.community_id,
      communityName: row.communities.name,
      displayName: row.display_name,
    }))
    .sort((a, b) => a.communityName.localeCompare(b.communityName));
}
