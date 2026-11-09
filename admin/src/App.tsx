import { useTranslation } from 'react-i18next';
import { Route, Routes } from 'react-router';

import { AppShell } from './components/AppShell';
import { Button } from './components/Button';
import { NotFound } from './components/NotFound';
import { StatusScreen } from './components/StatusScreen';
import { useAuth } from './features/auth/AuthProvider';
import { LoginScreen } from './features/auth/LoginScreen';
import { CommunitiesScreen } from './features/communities/CommunitiesScreen';
import { IncidentDetailScreen } from './features/incidents/IncidentDetailScreen';
import { IncidentsScreen } from './features/incidents/IncidentsScreen';

export function App() {
  const { t } = useTranslation();
  const auth = useAuth();

  switch (auth.status) {
    case 'config-error':
      return <StatusScreen title={t('auth.configErrorTitle')} body={t('auth.configErrorBody')} />;
    case 'loading':
      return <StatusScreen title={t('auth.loading')} busy />;
    case 'error':
      return (
        <StatusScreen title={t('auth.errorTitle')} body={t('auth.errorBody')}>
          <Button onClick={auth.retry}>{t('auth.retry')}</Button>
        </StatusScreen>
      );
    case 'signed-out':
      return <LoginScreen />;
    case 'no-access':
      return (
        <StatusScreen title={t('auth.noAccessTitle')} body={t('auth.noAccessBody')}>
          <Button variant="outline" onClick={() => void auth.signOut()}>
            {t('auth.signOut')}
          </Button>
        </StatusScreen>
      );
    case 'ready':
      return (
        <AppShell>
          <Routes>
            <Route index element={<CommunitiesScreen />} />
            <Route path="communities/:communityId/incidents" element={<IncidentsScreen />} />
            <Route
              path="communities/:communityId/incidents/:incidentId"
              element={<IncidentDetailScreen />}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppShell>
      );
  }
}
