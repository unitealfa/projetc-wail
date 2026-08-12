import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { CustomAttribute, PickedImage, Product, ProductInput } from '../types/product';
import { commaSeparatedValues } from '../utils/arrays';
import { colors } from '../constants/theme';
import { prepareImage } from '../utils/prepareImage';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';

const PRODUCT_TYPES = ['Pantalon', 'Chaussure', 'T-shirt', 'Veste', 'Robe', 'Sac', 'Accessoire', 'Autre'];

interface ProductFormProps {
  initialProduct?: Product;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: ProductInput, image?: PickedImage) => Promise<void>;
}

export function ProductForm({ initialProduct, submitting, submitLabel, onSubmit }: ProductFormProps) {
  const initialType = initialProduct?.type?.trim();
  const knownType = initialType ? (PRODUCT_TYPES.includes(initialType) ? initialType : 'Autre') : '';
  const [image, setImage] = useState<PickedImage>();
  const [name, setName] = useState(initialProduct?.name ?? '');
  const [selectedType, setSelectedType] = useState(knownType);
  const [otherType, setOtherType] = useState(knownType === 'Autre' ? initialType ?? '' : '');
  const [brand, setBrand] = useState(initialProduct?.brand ?? '');
  const [model, setModel] = useState(initialProduct?.model ?? '');
  const [reference, setReference] = useState(initialProduct?.reference ?? '');
  const [sku, setSku] = useState(initialProduct?.sku ?? '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode ?? '');
  const [colorsText, setColorsText] = useState(initialProduct?.colors.join(', ') ?? '');
  const [sizesText, setSizesText] = useState(initialProduct?.sizes.join(', ') ?? '');
  const [material, setMaterial] = useState(initialProduct?.material ?? '');
  const [targetAudience, setTargetAudience] = useState(initialProduct?.targetAudience ?? '');
  const [description, setDescription] = useState(initialProduct?.description ?? '');
  const [price, setPrice] = useState(initialProduct?.price?.toString() ?? '');
  const [currency, setCurrency] = useState(initialProduct?.currency ?? '');
  const [stock, setStock] = useState(initialProduct?.stock?.toString() ?? '');
  const [attributes, setAttributes] = useState<CustomAttribute[]>(initialProduct?.customAttributes ?? []);
  const [error, setError] = useState<string>();

  const pickImage = async (source: 'camera' | 'gallery') => {
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', source === 'camera' ? 'Autorisez l’accès à la caméra.' : 'Autorisez l’accès aux photos.');
      return;
    }
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await picker({ mediaTypes: ['images'], allowsEditing: true, quality: 1 });
    if (result.canceled) return;
    try { setImage(await prepareImage(result.assets[0], 'produit')); }
    catch { Alert.alert('Image invalide', 'Impossible de préparer cette image.'); }
  };

  const updateAttribute = (index: number, field: keyof CustomAttribute, value: string) => {
    setAttributes((current) => current.map((attribute, itemIndex) => itemIndex === index ? { ...attribute, [field]: value } : attribute));
  };

  const submit = async () => {
    setError(undefined);
    const finalType = selectedType === 'Autre' ? otherType.trim() || undefined : selectedType || undefined;
    const colorValues = commaSeparatedValues(colorsText);
    const numericPrice = price.trim() === '' ? undefined : Number(price.replace(',', '.'));
    const numericStock = stock.trim() === '' ? undefined : Number(stock);
    const cleanAttributes = attributes.map((item) => ({ key: item.key.trim(), value: item.value.trim() }));

    if (!name.trim() || name.trim().length < 2) {
      setError('Le nom doit contenir au moins 2 caractères.');
      return;
    }
    if (colorValues.length === 0) {
      setError('Ajoutez au moins une couleur.');
      return;
    }
    if (numericPrice !== undefined && (!Number.isFinite(numericPrice) || numericPrice < 0)) {
      setError('Le prix doit être un nombre positif ou nul.');
      return;
    }
    if (numericStock !== undefined && (!Number.isInteger(numericStock) || numericStock < 0)) {
      setError('Le stock doit être un entier positif ou nul.');
      return;
    }
    if (cleanAttributes.some((item) => !item.key || !item.value)) {
      setError('Chaque caractéristique doit avoir une clé et une valeur.');
      return;
    }

    const optional = (value: string) => value.trim() || undefined;
    await onSubmit({
      name: name.trim(), type: finalType, brand: optional(brand), model: optional(model), reference: optional(reference),
      sku: optional(sku), barcode: optional(barcode), colors: colorValues, sizes: commaSeparatedValues(sizesText),
      material: optional(material), targetAudience: optional(targetAudience), description: optional(description),
      price: numericPrice, currency: optional(currency), stock: numericStock, customAttributes: cleanAttributes,
    }, image);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="IMAGE">
        {image?.uri || initialProduct?.imageUrl ? (
          <Image source={{ uri: image?.uri ?? initialProduct?.imageUrl }} style={styles.preview} resizeMode="cover" />
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]}><Text style={styles.hint}>Aucune image</Text></View>
        )}
        <View style={styles.imageActions}>
          <View style={styles.imageAction}><AppButton title="Caméra" disabled={submitting} onPress={() => void pickImage('camera')} /></View>
          <View style={styles.imageAction}><AppButton title="Galerie" variant="secondary" disabled={submitting} onPress={() => void pickImage('gallery')} /></View>
        </View>
        <Text style={styles.hint}>Facultatif · recadrage puis compression JPEG automatique</Text>
      </Section>

      <Section title="IDENTIFICATION">
        <AppInput label="Nom *" value={name} onChangeText={setName} maxLength={120} />
        <Text style={styles.label}>Type (facultatif)</Text>
        <View style={styles.typeList}>{['', ...PRODUCT_TYPES].map((item) => (
          <Pressable key={item} onPress={() => setSelectedType(item)} style={[styles.typeChip, selectedType === item && styles.typeChipSelected]}>
            <Text style={[styles.typeText, selectedType === item && styles.typeTextSelected]}>{item || 'Non renseigné'}</Text>
          </Pressable>
        ))}</View>
        {selectedType === 'Autre' ? <AppInput label="Autre type" value={otherType} onChangeText={setOtherType} maxLength={60} /> : null}
        <AppInput label="Marque" value={brand} onChangeText={setBrand} maxLength={80} />
        <AppInput label="Modèle" value={model} onChangeText={setModel} />
        <AppInput label="Référence" value={reference} onChangeText={setReference} />
        <AppInput label="SKU" value={sku} onChangeText={setSku} />
        <AppInput label="Code-barres" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" />
      </Section>

      <Section title="VARIANTES">
        <AppInput label="Couleurs *" value={colorsText} onChangeText={setColorsText} placeholder="Noir, Blanc, Rouge" />
        <AppInput label="Tailles" value={sizesText} onChangeText={setSizesText} placeholder="40, 41, 42" />
      </Section>

      <Section title="INFORMATIONS">
        <AppInput label="Matière" value={material} onChangeText={setMaterial} />
        <AppInput label="Public cible" value={targetAudience} onChangeText={setTargetAudience} />
        <AppInput label="Description" value={description} onChangeText={setDescription} multiline maxLength={2000} />
      </Section>

      <Section title="PRIX / STOCK">
        <AppInput label="Prix" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        <AppInput label="Devise" value={currency} onChangeText={setCurrency} placeholder="DZD" autoCapitalize="characters" />
        <AppInput label="Stock" value={stock} onChangeText={setStock} keyboardType="number-pad" />
      </Section>

      <Section title="CARACTÉRISTIQUES SUPPLÉMENTAIRES">
        {attributes.map((attribute, index) => (
          <View key={index} style={styles.attribute}>
            <AppInput label="Clé" value={attribute.key} onChangeText={(value) => updateAttribute(index, 'key', value)} />
            <AppInput label="Valeur" value={attribute.value} onChangeText={(value) => updateAttribute(index, 'value', value)} />
            <AppButton title="Supprimer cette caractéristique" variant="danger" disabled={submitting} onPress={() => setAttributes((current) => current.filter((_, itemIndex) => itemIndex !== index))} />
          </View>
        ))}
        <AppButton title="+ Ajouter" variant="secondary" disabled={submitting} onPress={() => setAttributes((current) => [...current, { key: '', value: '' }])} />
      </Section>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      <AppButton title={submitLabel} loading={submitting} onPress={() => void submit()} />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text style={styles.sectionTitle}>{title}</Text>{children}</View>;
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 18, backgroundColor: colors.background },
  section: { backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 15, gap: 12 },
  sectionTitle: { color: colors.primary, fontSize: 14, fontWeight: '900', letterSpacing: 0.7 },
  preview: { width: '100%', height: 220, borderRadius: 10, backgroundColor: '#E2E8F0' },
  previewPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  hint: { color: colors.muted, fontSize: 12, textAlign: 'center' },
  imageActions: { flexDirection: 'row', gap: 10 },
  imageAction: { flex: 1 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600' },
  typeList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.surface },
  typeChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeText: { color: colors.text },
  typeTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  attribute: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, gap: 10 },
  error: { color: colors.danger, fontSize: 15, fontWeight: '600', textAlign: 'center' },
});
