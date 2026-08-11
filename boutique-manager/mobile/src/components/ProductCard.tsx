import { Image, StyleSheet, Text, View } from 'react-native';
import type { Product } from '../types/product';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';

export function ProductCard({ product, busy, onEdit, onDelete }: { product: Product; busy: boolean; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
      <View style={styles.content}>
        <Text style={styles.name}>{product.name}</Text>
        <Text style={styles.meta}>{product.type} · {product.brand}</Text>
        <Text style={styles.meta}>Couleurs : {product.colors.join(', ')}</Text>
        {product.reference ? <Text style={styles.meta}>Référence : {product.reference}</Text> : null}
        {product.stock !== undefined ? <Text style={styles.meta}>Stock : {product.stock}</Text> : null}
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
  image: { width: '100%', height: 190, backgroundColor: '#E2E8F0' },
  content: { padding: 14, gap: 5 },
  name: { color: colors.text, fontSize: 19, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 14 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  action: { flex: 1 },
});
