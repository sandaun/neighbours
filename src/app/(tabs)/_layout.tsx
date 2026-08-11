import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ellipsis, FileText, Home, Wallet, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Platform, useColorScheme } from 'react-native';

const light = { active: '#803EF6', inactive: '#7B7487', bg: '#FFFFFF', border: '#CCC3D8' };
const dark = { active: '#9B6BFF', inactive: '#B9AECC', bg: '#1E1132', border: '#44355E' };

const TABS = [
  { name: 'index', labelKey: 'tabs.home', sf: { default: 'house', selected: 'house.fill' }, icon: Home },
  { name: 'incidencies', labelKey: 'tabs.incidents', sf: { default: 'wrench', selected: 'wrench.fill' }, icon: Wrench },
  { name: 'documents', labelKey: 'tabs.documents', sf: { default: 'doc', selected: 'doc.fill' }, icon: FileText },
  { name: 'comptes', labelKey: 'tabs.accounts', sf: { default: 'banknote', selected: 'banknote.fill' }, icon: Wallet },
  { name: 'mes', labelKey: 'tabs.more', sf: { default: 'ellipsis', selected: 'ellipsis' }, icon: Ellipsis },
] as const;

/**
 * iOS: tab bar nativa (UITabBarController) → Liquid Glass automàtic a iOS 26+.
 * Android: tabs JS estilitzades (Material) fins tenir el set d'icones vectorials.
 * Veure Full-de-ruta §3.3 i DESIGN_SYSTEM §4.
 */
export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColorScheme() === 'dark' ? dark : light;

  if (Platform.OS === 'ios') {
    return (
      <>
        <StatusBar style="light" />
        <NativeTabs tintColor={colors.active}>
          {TABS.map((tab) => (
            <NativeTabs.Trigger key={tab.name} name={tab.name}>
              <NativeTabs.Trigger.Label>{t(tab.labelKey)}</NativeTabs.Trigger.Label>
              <NativeTabs.Trigger.Icon sf={tab.sf} />
            </NativeTabs.Trigger>
          ))}
        </NativeTabs>
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.active,
          tabBarInactiveTintColor: colors.inactive,
          tabBarStyle: {
            backgroundColor: colors.bg,
            borderTopColor: colors.border,
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
              tabBarIcon: ({ color, size }) => <tab.icon color={color} size={size} />,
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
