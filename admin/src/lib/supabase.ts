import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@shared/database';

import { adminConfig } from '@/lib/config';

export type AdminClient = SupabaseClient<Database>;

let client: AdminClient | undefined;

export function getSupabase(): AdminClient {
  if (!adminConfig.ok) throw new Error(adminConfig.error);
  client ??= createClient<Database>(adminConfig.url, adminConfig.publishableKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
  });
  return client;
}
