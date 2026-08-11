import { Redirect } from 'expo-router';
import { LoadingState } from '@/src/components/LoadingState';
import { useAuth } from '@/src/context/AuthContext';
import { USER_ROLES } from '@/src/constants/roles';

export default function IndexScreen() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingState />;
  if (!user) return <Redirect href="/login" />;
  return <Redirect href={user.role === USER_ROLES.ADMIN ? '/(admin)/(tabs)' : '/(shop)/(tabs)'} />;
}
