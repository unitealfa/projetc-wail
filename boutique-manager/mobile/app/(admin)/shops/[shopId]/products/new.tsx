import { useLocalSearchParams } from 'expo-router';
import { ProductEditorScreen } from '@/src/components/ProductEditorScreen';

export default function AdminNewProductScreen() {
  const { shopId } = useLocalSearchParams<{ shopId: string | string[] }>();
  return <ProductEditorScreen shopId={Array.isArray(shopId) ? shopId[0] : shopId} />;
}
