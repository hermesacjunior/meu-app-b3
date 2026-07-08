import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/components/theme';

function icon(emoji: string) {
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: 'Descobrir', tabBarIcon: icon('🧭') }}
      />
      <Tabs.Screen
        name="conversas"
        options={{ title: 'Conversas', tabBarIcon: icon('💬') }}
      />
      <Tabs.Screen
        name="connections"
        options={{ title: 'Conexoes', tabBarIcon: icon('❤️') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Perfil', tabBarIcon: icon('👤') }}
      />
    </Tabs>
  );
}
