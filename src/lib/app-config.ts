export type AppConfig =
  | { mode: 'demo' }
  | { mode: 'supabase'; url: string; publishableKey: string }
  | { mode: 'error'; error: string };

type Environment = { mode?: string; url?: string; publishableKey?: string };

export function resolveAppConfig(environment: Environment): AppConfig {
  const mode = environment.mode?.trim();
  const url = environment.url?.trim();
  const publishableKey = environment.publishableKey?.trim();
  if (mode && mode !== 'demo' && mode !== 'supabase') {
    return { mode: 'error', error: 'EXPO_PUBLIC_DATA_MODE must be demo or supabase.' };
  }
  if (mode === 'demo' || (!mode && !url && !publishableKey)) return { mode: 'demo' };
  if (!url || !publishableKey) {
    return { mode: 'error', error: 'Supabase URL and publishable key must both be configured.' };
  }
  try {
    const parsed = new URL(url);
    if (
      (parsed.protocol !== 'https:' &&
        !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname))) ||
      parsed.username ||
      parsed.password ||
      parsed.pathname !== '/' ||
      parsed.search ||
      parsed.hash
    )
      throw new Error('Invalid URL');
  } catch {
    return { mode: 'error', error: 'Supabase URL must be a valid HTTPS origin.' };
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    return {
      mode: 'error',
      error: 'Use a Supabase publishable key, never a secret or service role key.',
    };
  }
  return { mode: 'supabase', url, publishableKey };
}

// Expo replaces only direct process.env references in the client bundle.
export const appConfig = resolveAppConfig({
  mode: process.env.EXPO_PUBLIC_DATA_MODE,
  url: process.env.EXPO_PUBLIC_SUPABASE_URL,
  publishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});
export const isDemoMode = appConfig.mode === 'demo';
