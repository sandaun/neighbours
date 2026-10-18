import { getSupabase } from '@/lib/supabase';

export type Membership = {
  communityId: string;
  communityName: string;
  userId: string;
  unitId: string | null;
  unitLabel: string | null;
  displayName: string;
  role: 'resident' | 'admin';
};

export async function signInWithPassword(email: string, password: string) {
  const { error } = await getSupabase().auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

export async function loadMembership(userId: string): Promise<Membership | null> {
  const client = getSupabase();
  const { data, error } = await client
    .from('community_members')
    .select(
      'community_id, user_id, unit_id, display_name, role, communities!inner(name), units(label)'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .order('community_id', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    communityId: data.community_id,
    communityName: data.communities.name,
    userId: data.user_id,
    unitId: data.unit_id,
    unitLabel: data.units?.label ?? null,
    displayName: data.display_name,
    role: data.role,
  };
}
