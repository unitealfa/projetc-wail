import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { productsApi } from '../api/products.api';
import type { Product } from '../types/product';
import { errorMessage } from '../utils/errorMessage';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { LoadingState } from './LoadingState';
import { ProductCard } from './ProductCard';
import { Screen } from './Screen';

export function ProductListScreen({ shopId, shopName, mode }: { shopId: string; shopName?: string; mode: 'admin' | 'shop' }) {
  const [products, setProducts] = useState<Product[]>([]); const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); const [error, setError] = useState<string>(); const [deleting, setDeleting] = useState<string>();
  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(undefined);
    try { setProducts((await productsApi.list(shopId)).products); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [shopId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const newProduct = () => mode === 'admin'
    ? router.push({ pathname: '/(admin)/shops/[shopId]/products/new', params: { shopId, shopName: shopName ?? '' } })
    : router.push('/(shop)/products/new');
  const editProduct = (productId: string) => mode === 'admin'
    ? router.push({ pathname: '/(admin)/shops/[shopId]/products/[productId]', params: { shopId, productId, shopName: shopName ?? '' } })
    : router.push({ pathname: '/(shop)/products/[productId]', params: { productId } });
  const confirmDelete = (product: Product) => Alert.alert('Supprimer le produit', 'Supprimer ce produit ?', [
    { text: 'Annuler', style: 'cancel' },
    { text: 'Supprimer', style: 'destructive', onPress: () => void remove(product._id) },
  ]);
  const remove = async (productId: string) => {
    setDeleting(productId);
    try { await productsApi.remove(shopId, productId); await load(true); }
    catch (reason) { Alert.alert('Erreur', errorMessage(reason)); }
    finally { setDeleting(undefined); }
  };

  if (loading) return <LoadingState />;
  if (error && products.length === 0) return <ErrorState message={error} onRetry={() => void load()} />;
  return <Screen><FlatList data={products} keyExtractor={(item) => item._id} contentContainerStyle={styles.list}
    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
    ListHeaderComponent={<View style={styles.header}>{shopName ? <Text style={styles.title}>Produits - {shopName}</Text> : null}<AppButton title="+ Ajouter un produit" onPress={newProduct} />{error ? <Text style={styles.error}>{error}</Text> : null}</View>}
    ListEmptyComponent={<EmptyState message="Aucun produit." />}
    renderItem={({ item }) => <ProductCard product={item} busy={deleting === item._id} onEdit={() => editProduct(item._id)} onDelete={() => confirmDelete(item)} />}
  /></Screen>;
}

const styles = StyleSheet.create({ list: { gap: 14, paddingBottom: 24 }, header: { gap: 13 }, title: { color: colors.text, fontSize: 22, fontWeight: '900' }, error: { color: colors.danger, textAlign: 'center' } });
