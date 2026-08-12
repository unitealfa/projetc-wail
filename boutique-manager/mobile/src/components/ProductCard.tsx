import { Image, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../types/product';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';
import { resolveApiUrl } from '../api/client';

export function ProductCard({ product, busy, onEdit, onDelete, onRetryAnalysis }: { product: Product; busy: boolean; onEdit: () => void; onDelete: () => void; onRetryAnalysis: () => void }) {
  const imageUrls = product.imageUrls?.length ? product.imageUrls : (product.imageUrl ? [product.imageUrl] : []);
  return (
    <View style={styles.card}>
      {imageUrls.length ? (
        <View style={styles.images}>
          {imageUrls.map((uri) => <Image key={uri} source={{ uri: resolveApiUrl(uri) }} style={styles.image} resizeMode="cover" />)}
        </View>
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}><Text style={styles.imagePlaceholderText}>Sans image</Text></View>
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        {product.type || product.brand ? <Text style={styles.meta}>{[product.type, product.brand].filter(Boolean).join(' · ')}</Text> : null}
        <Text style={styles.meta}>Couleurs : {product.colors.join(', ')}</Text>
        {product.reference ? <Text style={styles.meta}>Référence : {product.reference}</Text> : null}
        {product.stock !== undefined ? <Text style={styles.meta}>Stock : {product.stock}</Text> : null}
        {product.aiAnalysisStatus === 'READY' ? <Text style={styles.aiReady}>Analyse IA prête</Text> : null}
        {product.aiAnalysisStatus === 'PENDING' ? <Text style={styles.meta}>Analyse IA en cours…</Text> : null}
        {product.aiAnalysisStatus === 'FAILED' ? <View style={styles.aiError}><Text style={styles.aiErrorText}>Analyse IA non disponible</Text><AppButton title="Réessayer l’analyse IA" variant="secondary" disabled={busy || !product.imageUrl} onPress={onRetryAnalysis} /></View> : null}
        <View style={styles.actions}>
          <View style={styles.action}><AppButton title="Modifier" variant="secondary" disabled={busy} onPress={onEdit} /></View>
          <View style={styles.action}><AppButton title="Supprimer" variant="danger" loading={busy} onPress={onDelete} /></View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border },
  images: { flexDirection: 'row', gap: 2 },
  image: { flex: 1, minWidth: 0, height: 190, backgroundColor: '#E2E8F0' },
  imagePlaceholder: { width: '100%', alignItems: 'center', justifyContent: 'center' },
  imagePlaceholderText: { color: colors.muted, fontSize: 15, fontWeight: '600' },
  content: { padding: 14, gap: 5 },
  name: { color: colors.text, fontSize: 19, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { flex: 1 },
  aiReady: { color: colors.success, fontSize: 13, fontWeight: '800' },
  aiError: { gap: 7, marginTop: 5 },
  aiErrorText: { color: colors.danger, fontSize: 13, fontWeight: '800' },
});
