import { Image, Linking, StyleSheet, Text, View } from 'react-native';
import type { SearchMatch } from '../types/productSearch';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';
import { resolveApiUrl } from '../api/client';

const LABELS = {
  VERY_LIKELY: 'Correspondance très probable',
  LIKELY: 'Correspondance probable',
  POSSIBLE: 'Correspondance possible',
} as const;

export function SearchResultCard({ match, requestedSize }: { match: SearchMatch; requestedSize?: string }) {
  const imageUrls = match.product.imageUrls?.length
    ? match.product.imageUrls
    : (match.product.imageUrl ? [match.product.imageUrl] : []);
  const price = match.product.price === null
    ? null
    : `${new Intl.NumberFormat('fr-FR').format(match.product.price)} ${match.product.currency ?? 'DZD'}`;
  const sizeMessage = match.requestedSizeStatus === 'LISTED'
    ? `Taille ${requestedSize} listée par la boutique (à confirmer)`
    : match.requestedSizeStatus === 'NOT_LISTED'
      ? `Taille ${requestedSize} non déclarée`
      : null;
  return <View style={styles.card}>
    {imageUrls.length ? <View style={styles.images}>{imageUrls.map((uri) => <Image key={uri} source={{ uri: resolveApiUrl(uri) }} style={styles.image} resizeMode="cover" />)}</View> : null}
    <View style={styles.content}>
      <Text style={styles.label}>{LABELS[match.confidenceLabel]} · {match.score}%</Text>
      <Text style={styles.name}>{match.product.name}</Text>
      <Text style={styles.meta}>{[match.product.brand, match.product.type, match.product.model].filter(Boolean).join(' · ')}</Text>
      {match.reasons.length ? <Text style={styles.reasons}>{match.reasons.join(' · ')}</Text> : null}
      <View style={styles.separator} />
      <Text style={styles.shop}>{match.shop.name}</Text>
      <Text style={styles.meta}>{match.shop.address}</Text>
      <Text style={styles.meta}>{match.shop.phone}</Text>
      {match.distanceKm !== null ? <Text style={styles.distance}>À environ {match.distanceKm.toFixed(1)} km</Text> : null}
      {price ? <Text style={styles.price}>{price}</Text> : null}
      {sizeMessage ? <Text style={styles.size}>{sizeMessage}</Text> : null}
      <Text style={styles.stock}>{match.product.stock === null ? 'Stock à confirmer' : `Stock déclaré : ${match.product.stock}`}</Text>
      <Text style={styles.warning}>Appelez la boutique pour confirmer le modèle, la taille et le stock avant de vous déplacer.</Text>
      <AppButton title="Appeler la boutique" onPress={() => void Linking.openURL(`tel:${match.shop.phone.replace(/[^+0-9]/g, '')}`)} />
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  images: { flexDirection: 'row', gap: 2 },
  image: { flex: 1, minWidth: 0, height: 210, backgroundColor: '#E2E8F0' },
  content: { padding: 15, gap: 6 },
  label: { color: colors.success, fontSize: 13, fontWeight: '900' },
  name: { color: colors.text, fontSize: 20, fontWeight: '900' },
  meta: { color: colors.muted, fontSize: 14 },
  reasons: { color: colors.text, fontSize: 13, lineHeight: 19 },
  separator: { height: 1, backgroundColor: colors.border, marginVertical: 5 },
  shop: { color: colors.text, fontSize: 17, fontWeight: '800' },
  distance: { color: colors.primary, fontWeight: '800' },
  price: { color: colors.text, fontSize: 18, fontWeight: '900' },
  size: { color: colors.text, fontWeight: '700' },
  stock: { color: colors.text, fontWeight: '700' },
  warning: { color: colors.muted, fontSize: 12, lineHeight: 17, marginVertical: 5 },
});
