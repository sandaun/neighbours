import { Tabs } from 'expo-router/js-tabs';
import { NativeTabs } from 'expo-router/native-tabs';
import { CreditCard, FileText, Home, LayoutGrid, MessageSquareWarning } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

const TABS = [
  {
    name: 'index',
    labelKey: 'tabs.home',
    sf: { default: 'house', selected: 'house.fill' },
    icon: Home,
  },
  {
    name: 'incidencies',
    labelKey: 'tabs.incidents',
    sf: { default: 'exclamationmark.bubble', selected: 'exclamationmark.bubble.fill' },
    icon: MessageSquareWarning,
  },
  {
    name: 'documents',
    labelKey: 'tabs.documents',
    sf: { default: 'doc.text', selected: 'doc.text.fill' },
    icon: FileText,
  },
  {
    name: 'comptes',
    labelKey: 'tabs.accounts',
    sf: { default: 'creditcard', selected: 'creditcard.fill' },
    icon: CreditCard,
  },
  {
    name: 'mes',
    labelKey: 'tabs.more',
    sf: { default: 'square.grid.2x2', selected: 'square.grid.2x2.fill' },
    icon: LayoutGrid,
  },
] as const;

/**
 * iOS uses the native UITabBarController, including system Liquid Glass on iOS 26+.
 * Android keeps styled JavaScript tabs until native icon support is unified.
 * See Full-de-ruta section 3.3 and DESIGN_SYSTEM section 4.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useTheme();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        tintColor={colors.primary}
        backgroundColor={colors.surface}
        disableTransparentOnScrollEdge
      >
        {TABS.map((tab) => (
          <NativeTabs.Trigger key={tab.name} name={tab.name} disableAutomaticContentInsets>
            <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Icon sf={tab.sf} />
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.outline,
        },
        tabBarLabelStyle: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11 },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(tab.labelKey),
            tabBarIcon: ({ color }) => <tab.icon color={color} size={24} strokeWidth={2} />,
          }}
        />
      ))}
    </Tabs>
  );
}
