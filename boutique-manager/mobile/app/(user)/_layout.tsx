import { Redirect, Stack } from 'expo-router';
import { LoadingState } from '@/src/components/LoadingState';
import { USER_ROLES } from '@/src/constants/roles';
import { useAuth } from '@/src/context/AuthContext';

export default function UserLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!user) return <Redirect href="/login" />;
  if (user.role !== USER_ROLES.USER) return <Redirect href="/" />;
  return <Stack><Stack.Screen name="(tabs)" options={{ headerShown: false }} /></Stack>;
}
