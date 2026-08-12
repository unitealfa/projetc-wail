import { useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { productsApi } from '../api/products.api';
import { resolveApiUrl } from '../api/client';
import type { CustomAttribute, PickedImage, Product, ProductAiAnalysis, ProductInput } from '../types/product';
import { commaSeparatedValues } from '../utils/arrays';
import { errorMessage } from '../utils/errorMessage';
import { colors } from '../constants/theme';
import { prepareImage } from '../utils/prepareImage';
import { AppButton } from './AppButton';
import { AppInput } from './AppInput';
import { ProductImageDropZone } from './ProductImageDropZone';

const PRODUCT_TYPES = [
  'T-shirt', 'Polo', 'Chemise', 'Blouse', 'Pull', 'Cardigan', 'Sweat à capuche', 'Sweatshirt',
  'Veste', 'Manteau', 'Blazer', 'Gilet', 'Robe', 'Jupe', 'Pantalon', 'Jean', 'Short',
  'Legging', 'Chaussure', 'Bottes', 'Sandales', 'Talons', 'Mocassins', 'Ballerines',
  'Sac', 'Sac à dos', 'Chapeau', 'Écharpe', 'Ceinture', 'Accessoire', 'Autre',
];

interface ProductFormProps {
  shopId: string;
  initialProduct?: Product;
  submitting: boolean;
  submitLabel: string;
  onSubmit: (input: ProductInput, images: PickedImage[], aiAnalysis?: ProductAiAnalysis, retainedImageUrls?: string[]) => Promise<void>;
}

export function ProductForm({ shopId, initialProduct, submitting, submitLabel, onSubmit }: ProductFormProps) {
  const initialType = initialProduct?.type?.trim();
  const knownType = initialType ? (PRODUCT_TYPES.includes(initialType) ? initialType : 'Autre') : '';
  const initialImageUrls = initialProduct?.imageUrls?.length
    ? initialProduct.imageUrls
    : (initialProduct?.imageUrl ? [initialProduct.imageUrl] : []);
  const [images, setImages] = useState<PickedImage[]>([]);
  const imagesRef = useRef<PickedImage[]>([]);
  const [retainedImageUrls, setRetainedImageUrls] = useState(initialImageUrls);
  const [aiAnalysis, setAiAnalysis] = useState<ProductAiAnalysis>();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string>();
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

  const remainingImageSlots = 2 - retainedImageUrls.length - images.length;

  const addImages = (newImages: PickedImage[]) => {
    setImages((current) => {
      const next = [...current, ...newImages].slice(0, 2 - retainedImageUrls.length);
      imagesRef.current = next;
      return next;
    });
    setAiAnalysis(undefined);
    setAiMessage(undefined);
  };

  const pickImage = async (source: 'camera' | 'gallery') => {
    if (remainingImageSlots <= 0) {
      Alert.alert('Deux images maximum', 'Supprimez une image avant d’en ajouter une autre.');
      return;
    }
    const permission = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission requise', source === 'camera' ? 'Autorisez l’accès à la caméra.' : 'Autorisez l’accès aux photos.');
      return;
    }
    const picker = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const multiple = source === 'gallery' && remainingImageSlots > 1;
    const result = await picker({
      mediaTypes: ['images'],
      allowsEditing: !multiple,
      allowsMultipleSelection: multiple,
      selectionLimit: remainingImageSlots,
      quality: 1,
    });
    if (result.canceled) return;
    try {
      const prepared = await Promise.all(
        result.assets.slice(0, remainingImageSlots).map((asset, index) => prepareImage(asset, `produit-${images.length + index + 1}`)),
      );
      addImages(prepared);
    }
    catch { Alert.alert('Image invalide', 'Impossible de préparer cette image.'); }
  };

  const autofill = async () => {
    const imagesToKeep = [...imagesRef.current];
    if (imagesToKeep.length === 0) {
      setError('Ajoutez une ou deux nouvelles images à analyser.');
      return;
    }
    setAnalyzing(true); setError(undefined); setAiMessage(undefined);
    try {
      const result = await productsApi.autofill(shopId, imagesToKeep);
      const suggestions = result.suggestions;
      if (suggestions.name) setName(suggestions.name);
      if (suggestions.type) {
        if (PRODUCT_TYPES.includes(suggestions.type)) { setSelectedType(suggestions.type); setOtherType(''); }
        else { setSelectedType('Autre'); setOtherType(suggestions.type); }
      }
      if (suggestions.brand) setBrand(suggestions.brand);
      if (suggestions.model) setModel(suggestions.model);
      if (suggestions.colors.length) setColorsText(suggestions.colors.join(', '));
      if (suggestions.material) setMaterial(suggestions.material);
      if (suggestions.description) setDescription(suggestions.description);
      if (suggestions.customAttributes.length) {
        setAttributes((current) => {
          const suggestedKeys = new Set(suggestions.customAttributes.map((item) => item.key.toLowerCase()));
          return [...current.filter((item) => !suggestedKeys.has(item.key.toLowerCase())), ...suggestions.customAttributes];
        });
      }
      setAiAnalysis(result.analysis);
      // L'analyse ne doit jamais consommer ni remplacer les fichiers locaux :
      // ils seront réutilisés lors de la création effective du produit.
      imagesRef.current = imagesToKeep;
      setImages(imagesToKeep);
      setAiMessage(`${imagesToKeep.length} image${imagesToKeep.length > 1 ? 's' : ''} conservée${imagesToKeep.length > 1 ? 's' : ''} · champs visibles remplis par l’IA. Vérifiez-les avant de créer le produit.`);
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setAnalyzing(false); }
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
    }, [...imagesRef.current], aiAnalysis, retainedImageUrls);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Section title="IMAGE">
        {retainedImageUrls.length || images.length ? (
          <View style={styles.previews}>
            {retainedImageUrls.map((uri) => <View key={uri} style={styles.previewItem}>
              <Image source={{ uri: resolveApiUrl(uri) }} style={styles.preview} resizeMode="cover" />
              <AppButton title="Retirer" variant="danger" disabled={submitting || analyzing} onPress={() => setRetainedImageUrls((current) => current.filter((item) => item !== uri))} />
            </View>)}
            {images.map((item, index) => <View key={item.uri} style={styles.previewItem}>
              <Image source={{ uri: item.uri }} style={styles.preview} resizeMode="cover" />
              <AppButton title="Retirer" variant="danger" disabled={submitting || analyzing} onPress={() => {
                setImages((current) => {
                  const next = current.filter((_, itemIndex) => itemIndex !== index);
                  imagesRef.current = next;
                  return next;
                });
                setAiAnalysis(undefined);
                setAiMessage(undefined);
              }} />
            </View>)}
          </View>
        ) : (
          <View style={[styles.preview, styles.previewPlaceholder]}><Text style={styles.hint}>Aucune image</Text></View>
        )}
        <View style={styles.imageActions}>
          <View style={styles.imageAction}><AppButton title="Prendre une photo" disabled={submitting || analyzing || remainingImageSlots <= 0} onPress={() => void pickImage('camera')} /></View>
          <View style={styles.imageAction}><AppButton title="Choisir des images" variant="secondary" disabled={submitting || analyzing || remainingImageSlots <= 0} onPress={() => void pickImage('gallery')} /></View>
        </View>
        <ProductImageDropZone disabled={submitting || analyzing} remaining={remainingImageSlots} onImages={addImages} />
        <Text style={styles.hint}>1 ou 2 images maximum · recadrage puis compression JPEG automatique</Text>
        <AppButton title="Remplir automatiquement avec l’IA" loading={analyzing} disabled={submitting || images.length === 0} onPress={() => void autofill()} />
        <Text style={styles.hint}>L’IA remplit uniquement ce qu’elle voit. Prix, stock, tailles, SKU et code-barres restent à saisir manuellement.</Text>
        {aiMessage ? <Text style={styles.aiSuccess}>{aiMessage}</Text> : null}
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
  previews: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  previewItem: { flexBasis: '47%', flexGrow: 1, gap: 6 },
  preview: { width: '100%', height: 190, borderRadius: 10, backgroundColor: '#E2E8F0' },
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
  aiSuccess: { color: colors.success, fontSize: 13, fontWeight: '800', textAlign: 'center' },
});
