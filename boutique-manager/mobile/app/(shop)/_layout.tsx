import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/src/components/LoadingState';
import { USER_ROLES } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

export default function ShopLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== USER_ROLES.BOUTIQUE) return <Redirect href="/" />;
  return <Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /><Stack.Screen name="products/new" options={{ title: 'Ajouter un produit' }} /><Stack.Screen name="products/[productId]" options={{ title: 'Modifier le produit' }} /></Stack>;
}
