import { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { shopsApi } from '@/src/api/shops.api';
import { usersApi } from '@/src/api/users.api';
import { AppButton } from '@/src/components/AppButton';
import { EmptyState } from '@/src/components/EmptyState';
import { ErrorState } from '@/src/components/ErrorState';
import { LoadingState } from '@/src/components/LoadingState';
import { Screen } from '@/src/components/Screen';
import { ShopCard } from '@/src/components/ShopCard';
import { USER_ROLES } from '@/src/constants/roles';
import { colors } from '@/src/constants/theme';
import type { User } from '@/src/types/user';
import { errorMessage } from '@/src/utils/errorMessage';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError(undefined);
    try { setUsers((await usersApi.list()).users); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const confirmDelete = (user: User) => {
    if (!user.shopId) return;
    Alert.alert('Supprimer la boutique', 'Supprimer cette boutique et tous ses produits ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => void removeShop(user.shopId!) },
    ]);
  };
  const removeShop = async (shopId: string) => {
    setDeletingId(shopId);
    try { await shopsApi.remove(shopId); await load(true); }
    catch (reason) { Alert.alert('Erreur', errorMessage(reason)); }
    finally { setDeletingId(undefined); }
  };

  if (loading) return <LoadingState />;
  if (error && users.length === 0) return <ErrorState message={error} onRetry={() => void load()} />;
  const admin = users.find((user) => user.role === USER_ROLES.ADMIN);
  const boutiques = users.filter((user) => user.role === USER_ROLES.BOUTIQUE);

  return (
    <Screen>
      <FlatList
        data={boutiques}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<View style={styles.header}>
          <AppButton title="+ Ajouter une boutique" onPress={() => router.push('/(admin)/shops/new')} />
          {admin ? <View style={styles.admin}><Text style={styles.adminName}>{admin.displayName}</Text><Text style={styles.role}>ADMIN</Text></View> : null}
          <Text style={styles.heading}>Boutiques</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
        </View>}
        ListEmptyComponent={<EmptyState message="Aucune boutique." />}
        renderItem={({ item }) => <ShopCard
          user={item}
          busy={deletingId === item.shopId}
          onDelete={() => confirmDelete(item)}
          onProducts={() => item.shopId && router.push({ pathname: '/(admin)/shops/[shopId]/products', params: { shopId: item.shopId, shopName: item.shop?.name ?? item.displayName } })}
          onEdit={() => item.shopId && router.push({ pathname: '/(admin)/shops/[shopId]/edit', params: { shopId: item.shopId, name: item.shop?.name ?? item.displayName, phone: item.shop?.phone ?? '', address: item.shop?.address ?? '' } })}
        />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12, paddingBottom: 24 }, header: { gap: 14 },
  admin: { padding: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.surface },
  adminName: { color: colors.text, fontSize: 19, fontWeight: '800' }, role: { color: colors.muted, marginTop: 5, fontWeight: '700' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '900' }, error: { color: colors.danger, textAlign: 'center' },
});
