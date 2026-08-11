import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LogoutButton } from '@/src/components/LogoutButton';
import { colors } from '@/src/constants/theme';

export default function AdminTabsLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerRight: () => <LogoutButton /> }}>
    <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="users" options={{ title: 'Users', tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" color={color} size={size} /> }} />
  </Tabs>;
}
