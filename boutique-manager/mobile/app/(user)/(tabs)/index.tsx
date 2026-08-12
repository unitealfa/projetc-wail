import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { aiApi } from '@/src/api/ai.api';
import { AppButton } from '@/src/components/AppButton';
import { AppInput } from '@/src/components/AppInput';
import { SearchResultCard } from '@/src/components/SearchResultCard';
import { colors } from '@/src/constants/theme';
import type { PickedImage } from '@/src/types/product';
import type { ProductSearchResult } from '@/src/types/productSearch';
import { errorMessage } from '@/src/utils/errorMessage';
import { prepareImage } from '@/src/utils/prepareImage';

interface Coordinates { latitude: number; longitude: number }

export default function UserSearchScreen() {
  const [image, setImage] = useState<PickedImage>();
  const [size, setSize] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates>();
  const [locationMessage, setLocationMessage] = useState('Localisation en attente…');
  const [result, setResult] = useState<ProductSearchResult>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!active) return;
        if (!permission.granted) { setLocationMessage('Localisation refusée : tri par score uniquement.'); return; }
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!active) return;
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLocationMessage('Localisation utilisée uniquement pour classer les boutiques proches.');
      } catch {
        if (active) setLocationMessage('Localisation indisponible : tri par score uniquement.');
      }
    })();
    return () => { active = false; };
  }, []);

  const choose = async (source: 'camera' | 'gallery') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', source === 'camera' ? "Autorisez l'accès à la caméra." : "Autorisez l'accès aux photos.");
      return;
    }
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const picked = await picker({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
    if (picked.canceled) return;
    try {
      setImage(await prepareImage(picked.assets[0], 'recherche'));
      setResult(undefined);
      setError(undefined);
    } catch {
      Alert.alert('Image invalide', "Impossible de préparer cette image.");
    }
  };

  const search = async () => {
    if (!image) { setError('Prenez une photo ou choisissez une image.'); return; }
    setLoading(true); setError(undefined); setResult(undefined);
    try {
      setResult(await aiApi.searchProduct({ image, size: size.trim() || undefined, ...coordinates }));
    } catch (reason) {
      setError(errorMessage(reason));
    } finally { setLoading(false); }
  };

  return <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
    <Text style={styles.title}>Trouver un produit</Text>
    <Text style={styles.intro}>Prenez une photo ou sélectionnez une image du produit que vous recherchez. L’image sert uniquement à cette recherche et n’est pas enregistrée.</Text>
    {image ? <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" /> : <View style={[styles.preview, styles.placeholder]}><Text style={styles.placeholderText}>Aucune image choisie</Text></View>}
    <View style={styles.row}>
      <View style={styles.flex}><AppButton title="Prendre une photo" onPress={() => void choose('camera')} /></View>
      <View style={styles.flex}><AppButton title="Choisir une image" variant="secondary" onPress={() => void choose('gallery')} /></View>
    </View>
    <AppInput label="Taille recherchée (facultatif)" value={size} onChangeText={setSize} placeholder="Ex. L, 42" maxLength={30} />
    <Text style={styles.location}>{locationMessage}</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <AppButton title="Rechercher ce produit" loading={loading} onPress={() => void search()} />
    {result ? <View style={styles.results}>
      <Text style={styles.detected}>Produit détecté</Text>
      <Text style={styles.analysis}>{result.analysis.shortDescription}</Text>
      {result.analysis.multipleProductsDetected ? <Text style={styles.notice}>Plusieurs produits ont été détectés. Recadrez le produit recherché pour améliorer le résultat.</Text> : null}
      {result.multipleStrongMatches ? <Text style={styles.notice}>Plusieurs produits ressemblent fortement à votre image.</Text> : null}
      {result.lowConfidence ? <Text style={styles.notice}>{result.message}</Text> : null}
      {!result.lowConfidence && result.matches.length === 0 ? <Text style={styles.notice}>Aucune correspondance suffisamment fiable dans les boutiques.</Text> : null}
      {result.matches.map((match) => <SearchResultCard key={`${match.shop.id}-${match.product.id}`} match={match} requestedSize={size.trim() || undefined} />)}
    </View> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 14, backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 28, fontWeight: '900' },
  intro: { color: colors.muted, fontSize: 15, lineHeight: 21 },
  preview: { width: '100%', height: 280, borderRadius: 16, backgroundColor: '#E2E8F0' },
  placeholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  placeholderText: { color: colors.muted, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  location: { color: colors.muted, fontSize: 12 },
  error: { color: colors.danger, textAlign: 'center', fontWeight: '700' },
  results: { gap: 14, marginTop: 8 },
  detected: { color: colors.text, fontSize: 22, fontWeight: '900' },
  analysis: { color: colors.muted, lineHeight: 20 },
  notice: { color: colors.primary, backgroundColor: '#DBEAFE', padding: 12, borderRadius: 10, fontWeight: '700' },
});
