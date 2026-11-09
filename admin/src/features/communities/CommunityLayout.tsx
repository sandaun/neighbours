import { ChevronLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useOutletContext, useParams } from 'react-router';

import { NotFound } from '@/components/NotFound';
import { type AdminCommunity } from '@/features/auth/auth-api';
import { useAuth } from '@/features/auth/AuthProvider';

const tabs = [
  { path: 'incidents', label: 'incidents.title' },
  { path: 'events', label: 'events.title' },
  { path: 'board', label: 'board.title' },
  { path: 'directory', label: 'directory.title' },
  { path: 'documents', label: 'documents.title' },
  { path: 'receipts', label: 'receipts.title' },
] as const;

export function CommunityLayout() {
  const { t } = useTranslation();
  const { communityId = '' } = useParams();
  const community = useAuth().communities.find((item) => item.communityId === communityId);
  if (!community) return <NotFound />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1 self-start font-label text-xs text-ink-soft hover:text-primary focus-visible:outline-2 focus-visible:outline-primary-dark"
        >
          <ChevronLeft aria-hidden size={14} />
          {t('incidents.back')}
        </Link>
        <p className="font-label text-xs tracking-wide text-primary uppercase">
          {community.communityName}
        </p>
      </div>
      <nav
        aria-label={t('communities.sections')}
        className="-mx-4 overflow-x-auto border-b border-outline/60 px-4"
      >
        <ul className="flex gap-1">
          {tabs.map((tab) => (
            <li key={tab.path}>
              <NavLink
                to={`/communities/${communityId}/${tab.path}`}
                className={({ isActive }) =>
                  `-mb-px inline-flex min-h-11 items-center border-b-2 px-3 font-label text-sm whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-primary-dark ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-ink-soft hover:text-ink'
                  }`
                }
              >
                {t(tab.label)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Outlet context={community} />
    </div>
  );
}

export function useCommunity() {
  return useOutletContext<AdminCommunity>();
}
