import { Tabs } from 'expo-router';
import { Home, Store, Hammer, User } from 'lucide-react-native';
import { useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // DESIGN_SYSTEM.md：毛玻璃 Tab bar（半透明 + 浮动）
        tabBarActiveTintColor: isDark ? '#F5F5F7' : '#09090B',
        tabBarInactiveTintColor: '#A1A1AA',
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isDark
            ? 'rgba(24,24,27,0.80)'
            : 'rgba(255,255,255,0.80)',
          borderTopColor: isDark
            ? 'rgba(39,39,42,0.6)'
            : 'rgba(235,235,239,0.6)',
          borderTopWidth: 1,
          height: 56,
          paddingBottom: 4,
          paddingTop: 4,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: t('tabs.store'),
          tabBarIcon: ({ color }) => <Store size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="build"
        options={{
          title: t('tabs.build'),
          tabBarIcon: ({ color }) => <Hammer size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => <User size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
