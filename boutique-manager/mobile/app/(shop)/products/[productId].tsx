import { useLocalSearchParams } from 'expo-router';
import { ProductEditorScreen } from '@/src/components/ProductEditorScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { useAuth } from '@/src/context/AuthContext';

export default function ShopEditProductScreen() {
  const { user, restoreSession } = useAuth();
  const { productId } = useLocalSearchParams<{ productId: string | string[] }>();
  if (!user?.shopId) return <ErrorState message="Boutique associée introuvable." onRetry={() => void restoreSession()} />;
  return <ProductEditorScreen shopId={user.shopId} productId={Array.isArray(productId) ? productId[0] : productId} />;
}
