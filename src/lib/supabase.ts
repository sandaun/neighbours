import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/data/database.types';
import { appConfig } from '@/lib/app-config';
import { sessionStorage } from '@/lib/session-storage';

let client: SupabaseClient<Database> | undefined;

export function getSupabase(): SupabaseClient<Database> {
  if (appConfig.mode !== 'supabase') {
    throw new Error(
      appConfig.mode === 'error' ? appConfig.error : 'Supabase is unavailable in demo mode.'
    );
  }
  client ??= createClient<Database>(appConfig.url, appConfig.publishableKey, {
    auth: {
      storage: sessionStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
  return client;
}
