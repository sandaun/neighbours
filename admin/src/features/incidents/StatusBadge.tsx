import { useTranslation } from 'react-i18next';

import type { IncidentStatus } from './incidents-api';

// Same colours as the resident app's StatusBadge (src/design-system/StatusBadge.tsx).
const styles: Record<IncidentStatus, { badge: string; dot: string; label: string }> = {
  received: { badge: 'bg-surface-hi', dot: 'bg-primary', label: 'text-ink' },
  'in-progress': { badge: 'bg-tertiary/15', dot: 'bg-tertiary', label: 'text-tertiary-txt' },
  resolved: { badge: 'bg-secondary/25', dot: 'bg-secondary-txt', label: 'text-secondary-txt' },
};

export function StatusBadge({ status }: { status: IncidentStatus }) {
  const { t } = useTranslation();
  const style = styles[status];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 ${style.badge}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${style.dot}`} />
      <span className={`font-label text-[11px] leading-[14px] ${style.label}`}>
        {t(`incidents.statuses.${status}`)}
      </span>
    </span>
  );
}
