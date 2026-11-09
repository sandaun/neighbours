import { useTranslation } from 'react-i18next';

import { AppShell } from './components/AppShell';
import { Button } from './components/Button';
import { StatusScreen } from './components/StatusScreen';
import { useAuth } from './features/auth/AuthProvider';
import { LoginScreen } from './features/auth/LoginScreen';
import { CommunitiesScreen } from './features/communities/CommunitiesScreen';

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
          <CommunitiesScreen />
        </AppShell>
      );
  }
}
