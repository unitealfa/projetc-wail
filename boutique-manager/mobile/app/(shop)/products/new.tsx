import { ProductEditorScreen } from '@/src/components/ProductEditorScreen';
import { ErrorState } from '@/src/components/ErrorState';
import { useAuth } from '@/src/context/AuthContext';

export default function ShopNewProductScreen() {
  const { user, restoreSession } = useAuth();
  if (!user?.shopId) return <ErrorState message="Boutique associée introuvable." onRetry={() => void restoreSession()} />;
  return <ProductEditorScreen shopId={user.shopId} />;
}
