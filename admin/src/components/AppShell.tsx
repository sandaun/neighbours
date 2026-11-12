import { LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Brand } from './Brand';
import { Button } from './Button';
import { LanguageSelect } from './LanguageSelect';
import { useAuth } from '@/features/auth/AuthProvider';

export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const auth = useAuth();
  const name = auth.communities[0]?.displayName ?? auth.session?.user.email ?? '';

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-outline/60 bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Brand compact />
          <div className="flex items-center gap-2">
            <span className="hidden max-w-48 truncate text-sm text-ink-soft sm:inline" title={name}>
              {name}
            </span>
            <LanguageSelect />
            <Button variant="ghost" className="px-3" onClick={() => void auth.signOut()}>
              <LogOut aria-hidden size={16} />
              <span className="hidden sm:inline">{t('auth.signOut')}</span>
              <span className="sr-only sm:hidden">{t('auth.signOut')}</span>
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
