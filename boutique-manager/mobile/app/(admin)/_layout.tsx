import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/src/components/LoadingState';
import { USER_ROLES } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== USER_ROLES.ADMIN) return <Redirect href="/(shop)/(tabs)" />;
  return <Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="shops/new" options={{ title: 'Ajouter une boutique' }} /><Stack.Screen name="shops/[shopId]/products/index" options={{ title: 'Produits' }} /><Stack.Screen name="shops/[shopId]/products/new" options={{ title: 'Ajouter un produit' }} /><Stack.Screen name="shops/[shopId]/products/[productId]" options={{ title: 'Modifier le produit' }} /></Stack>;
}
