import { StyleSheet, Text, View } from 'react-native';
import type { User } from '../types/user';
import { colors } from '../constants/theme';
import { AppButton } from './AppButton';

export function ShopCard({ user, busy, onProducts, onEdit, onDelete }: { user: User; busy: boolean; onProducts: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{user.shop?.name ?? user.displayName}</Text>
      <Text style={styles.meta}>{user.shop?.phone}</Text>
      <Text style={styles.meta}>{user.shop?.address}</Text>
      <Text style={styles.role}>Rôle : {user.role}</Text>
      <AppButton title="Gérer les produits" variant="secondary" disabled={busy} onPress={onProducts} />
      <AppButton title="Modifier la boutique" variant="secondary" disabled={busy} onPress={onEdit} />
      <AppButton title="Supprimer" variant="danger" loading={busy} onPress={onDelete} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 16, gap: 9 },
  name: { color: colors.text, fontSize: 19, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 15 },
  role: { color: colors.text, fontSize: 14, fontWeight: '700', marginBottom: 4 },
});
