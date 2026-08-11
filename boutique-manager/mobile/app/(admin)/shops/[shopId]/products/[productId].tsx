import { useLocalSearchParams } from 'expo-router';
import { ProductEditorScreen } from '@/src/components/ProductEditorScreen';

function first(value: string | string[]): string { return Array.isArray(value) ? value[0] : value; }

export default function AdminEditProductScreen() {
  const { shopId, productId } = useLocalSearchParams<{ shopId: string | string[]; productId: string | string[] }>();
  return <ProductEditorScreen shopId={first(shopId)} productId={first(productId)} />;
}
