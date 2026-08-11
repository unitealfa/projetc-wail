import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LogoutButton } from '@/src/components/LogoutButton';
import { colors } from '@/src/constants/theme';

export default function ShopTabsLayout() {
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, headerRight: () => <LogoutButton /> }}>
    <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} /> }} />
    <Tabs.Screen name="products" options={{ title: 'Produits', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" color={color} size={size} /> }} />
  </Tabs>;
}
