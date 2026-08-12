import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LogoutButton } from '@/src/components/LogoutButton';
import { colors } from '@/src/constants/theme';

export default function UserTabsLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerRight: () => <LogoutButton /> }}>
    <Tabs.Screen name="index" options={{ title: 'Recherche', tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" color={color} size={size} /> }} />
  </Tabs>;
}
