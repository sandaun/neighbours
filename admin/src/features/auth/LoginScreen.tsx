import { Eye, EyeOff } from 'lucide-react';
import { type FormEvent, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuth } from './AuthProvider';
import { Brand } from '@/components/Brand';
import { Button } from '@/components/Button';
import { LanguageSelect } from '@/components/LanguageSelect';

const fieldClass =
  'min-h-12 w-full rounded-lg border border-outline bg-surface px-4 text-base text-ink placeholder:text-ink-muted focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

export function LoginScreen() {
  const { t } = useTranslation();
  const auth = useAuth();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && password.length > 0;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current || !valid) return;
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      await auth.signIn(email, password);
    } catch {
      setError(t('auth.signInError'));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col px-4 py-6">
      <div className="flex justify-end">
        <LanguageSelect />
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Brand />
            <h1 className="font-display text-3xl leading-tight text-ink">{t('auth.title')}</h1>
            <p className="text-ink-soft">{t('auth.subtitle')}</p>
          </div>
          <form
            noValidate
            onSubmit={(event) => void submit(event)}
            className="flex flex-col gap-4 rounded-xl border border-outline/60 bg-surface p-5 shadow-sm"
            aria-describedby={error ? errorId : undefined}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="font-label text-xs text-ink-soft">
                {t('auth.email')}
              </label>
              <input
                id={emailId}
                className={fieldClass}
                type="email"
                autoComplete="username"
                inputMode="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={busy}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={passwordId} className="font-label text-xs text-ink-soft">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  id={passwordId}
                  className={`${fieldClass} pr-12`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder={t('auth.passwordPlaceholder')}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={busy}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-1 flex w-10 items-center justify-center rounded-md text-ink-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-primary-dark"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff aria-hidden size={18} /> : <Eye aria-hidden size={18} />}
                </button>
              </div>
            </div>
            {error && (
              <p
                id={errorId}
                role="alert"
                className="rounded-md bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={!valid || busy}>
              {busy ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
