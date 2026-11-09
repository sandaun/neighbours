import { useAuth } from '@/features/auth/AuthProvider';
import type { AdminClient } from '@/lib/supabase';

export function useClient(): AdminClient {
  const { client } = useAuth();
  if (!client) throw new Error('Supabase client is unavailable.');
  return client;
}
