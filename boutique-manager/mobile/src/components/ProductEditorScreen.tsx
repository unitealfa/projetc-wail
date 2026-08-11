import { useCallback, useEffect, useState } from 'react';
import { Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { productsApi } from '../api/products.api';
import type { PickedImage, Product, ProductInput } from '../types/product';
import { errorMessage } from '../utils/errorMessage';
import { colors } from '../constants/theme';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ProductForm } from './ProductForm';

export function ProductEditorScreen({ shopId, productId }: { shopId: string; productId?: string }) {
  const [product, setProduct] = useState<Product>(); const [loading, setLoading] = useState(Boolean(productId));
  const [submitting, setSubmitting] = useState(false); const [error, setError] = useState<string>();
  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true); setError(undefined);
    try { setProduct((await productsApi.get(shopId, productId)).product); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }, [shopId, productId]);
  useEffect(() => { void load(); }, [load]);

  const submit = async (input: ProductInput, image?: PickedImage) => {
    setSubmitting(true); setError(undefined);
    try {
      if (productId) await productsApi.update(shopId, productId, input, image);
      else await productsApi.create(shopId, input, image);
      router.back();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setSubmitting(false); }
  };
  if (loading) return <LoadingState />;
  if (error && productId && !product) return <ErrorState message={error} onRetry={() => void load()} />;
  return <>{error ? <Text style={styles.error}>{error}</Text> : null}<ProductForm initialProduct={product} submitting={submitting} submitLabel={productId ? 'Enregistrer les modifications' : 'Créer le produit'} onSubmit={submit} /></>;
}

const styles = StyleSheet.create({ error: { color: colors.danger, padding: 12, textAlign: 'center', backgroundColor: colors.dangerLight } });
