export type AdminConfig =
  { ok: true; url: string; publishableKey: string } | { ok: false; error: string };

type Environment = { url?: string; publishableKey?: string };

// Same validation rules as the resident app (src/lib/app-config.ts), without demo mode.
export function resolveAdminConfig(environment: Environment): AdminConfig {
  const url = environment.url?.trim();
  const publishableKey = environment.publishableKey?.trim();
  if (!url || !publishableKey) {
    return { ok: false, error: 'Supabase URL and publishable key must both be configured.' };
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
    return { ok: false, error: 'Supabase URL must be a valid HTTPS origin.' };
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    return {
      ok: false,
      error: 'Use a Supabase publishable key, never a secret or service role key.',
    };
  }
  return { ok: true, url, publishableKey };
}

export const adminConfig = resolveAdminConfig({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
});
