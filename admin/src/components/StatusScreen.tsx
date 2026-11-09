import type { ReactNode } from 'react';

import { Brand } from './Brand';

export function StatusScreen({
  title,
  body,
  busy = false,
  children,
}: {
  title: string;
  body?: string;
  busy?: boolean;
  children?: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div
        className="flex w-full max-w-md flex-col items-center gap-5 text-center"
        role={busy ? 'status' : undefined}
        aria-live={busy ? 'polite' : undefined}
      >
        <Brand />
        {busy && (
          <span
            aria-hidden
            className="size-8 animate-spin rounded-full border-4 border-surface-hi border-t-primary"
          />
        )}
        <h1 className="font-display text-2xl text-ink">{title}</h1>
        {body && <p className="text-ink-soft">{body}</p>}
        {children}
      </div>
    </main>
  );
}
