import { ProductListScreen } from '@/src/components/ProductListScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { useAuth } from '@/src/context/AuthContext';

export default function ShopProductsScreen() {
  const { user, restoreSession } = useAuth();
  if (!user?.shopId) return <ErrorState message="Boutique associée introuvable." onRetry={() => void restoreSession()} />;
  return <ProductListScreen shopId={user.shopId} mode="shop" />;
}
