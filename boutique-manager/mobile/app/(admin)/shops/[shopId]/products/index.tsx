import { useLocalSearchParams } from 'expo-router';
import { ProductListScreen } from '@/src/components/ProductListScreen';

function first(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }

export default function AdminProductsScreen() {
  const params = useLocalSearchParams<{ shopId: string | string[]; shopName?: string | string[] }>();
  return <ProductListScreen shopId={first(params.shopId)} shopName={first(params.shopName)} mode="admin" />;
}
