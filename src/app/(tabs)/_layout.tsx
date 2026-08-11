import { Tabs } from 'expo-router';
import { Ellipsis, FileText, Home, Wallet, Wrench } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

const light = { active: '#803EF6', inactive: '#7B7487', bg: '#FFFFFF', border: '#CCC3D8' };
const dark = { active: '#9B6BFF', inactive: '#B9AECC', bg: '#1E1132', border: '#44355E' };

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColorScheme() === 'dark' ? dark : light;

  return (
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
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="incidencies"
        options={{
          title: t('tabs.incidents'),
          tabBarIcon: ({ color, size }) => <Wrench color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t('tabs.documents'),
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="comptes"
        options={{
          title: t('tabs.accounts'),
          tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="mes"
        options={{
          title: t('tabs.more'),
          tabBarIcon: ({ color, size }) => <Ellipsis color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
