import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { shopsApi } from '@/src/api/shops.api';
import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { colors } from '@/src/constants/theme';
import { errorMessage } from '@/src/utils/errorMessage';
import { geocodeAddress } from '@/src/utils/geocodeAddress';

function param(value: string | string[] | undefined): string { return Array.isArray(value) ? value[0] ?? '' : value ?? ''; }

export default function EditShopScreen() {
  const params = useLocalSearchParams<{ shopId?: string; name?: string; phone?: string; address?: string }>();
  const shopId = param(params.shopId);
  const originalAddress = param(params.address);
  const [name, setName] = useState(param(params.name));
  const [phone, setPhone] = useState(param(params.phone));
  const [address, setAddress] = useState(originalAddress);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const submit = async () => {
    const input = { name: name.trim(), phone: phone.trim(), address: address.trim() };
    if (!shopId || !input.name || !input.phone || !input.address) { setError('Tous les champs sont obligatoires.'); return; }
    setSubmitting(true); setError(undefined);
    try {
      const coordinates = input.address !== originalAddress ? await geocodeAddress(input.address) : null;
      await shopsApi.update(shopId, {
        ...input,
        ...(input.address !== originalAddress ? { latitude: coordinates?.latitude ?? null, longitude: coordinates?.longitude ?? null } : {}),
      });
      router.back();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setSubmitting(false); }
  };

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <AppInput label="Nom de la boutique *" value={name} onChangeText={setName} maxLength={120} />
    <AppInput label="Numéro de téléphone *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={40} />
    <AppInput label="Adresse *" value={address} onChangeText={setAddress} maxLength={250} />
    <Text style={styles.hint}>Si l’adresse change, l’application essaie automatiquement de recalculer sa position. L’enregistrement fonctionne même si cela échoue.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <AppButton title="Enregistrer" loading={submitting} onPress={() => void submit()} />
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 15, backgroundColor: colors.background, flexGrow: 1 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  error: { color: colors.danger, textAlign: 'center' },
});
