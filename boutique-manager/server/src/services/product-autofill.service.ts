import type { VisualProductProfile } from '../types/visual-product-profile.js';

const TYPE_LABELS: Record<string, string> = {
  t_shirt: 'T-shirt', polo: 'Polo', shirt: 'Chemise', blouse: 'Blouse', sweater: 'Pull',
  cardigan: 'Cardigan', hoodie: 'Sweat à capuche', sweatshirt: 'Sweatshirt', jacket: 'Veste',
  coat: 'Manteau', blazer: 'Blazer', vest: 'Gilet', dress: 'Robe', skirt: 'Jupe',
  pants: 'Pantalon', jeans: 'Jean', shorts: 'Short', leggings: 'Legging', sneakers: 'Chaussure',
  boots: 'Bottes', sandals: 'Sandales', heels: 'Talons', loafers: 'Mocassins', flats: 'Ballerines',
  bag: 'Sac', backpack: 'Sac à dos', hat: 'Chapeau', scarf: 'Écharpe', belt: 'Ceinture',
};

function present(value: string | null | undefined): string | undefined {
  const cleaned = value?.trim();
  return cleaned && !['unknown', 'inconnu', 'inconnue'].includes(cleaned.toLowerCase()) ? cleaned : undefined;
}

function attribute(key: string, values: Array<string | null | undefined>) {
  const value = values.map(present).filter((item): item is string => Boolean(item)).join(', ');
  return value ? { key, value } : null;
}

export function productSuggestionsFromProfile(profile: VisualProductProfile) {
  const primaryColor = present(profile.primaryColor);
  const colors = [primaryColor, ...profile.secondaryColors.map(present)]
    .filter((value): value is string => Boolean(value));
  const customAttributes = [
    attribute('Motif', [profile.pattern]),
    attribute('Texture', profile.texture),
    attribute('Coupe', [profile.fit]),
    attribute('Silhouette', [profile.silhouette]),
    attribute('Col', [profile.necklineOrCollar]),
    attribute('Manches', [profile.sleeveLength]),
    attribute('Fermeture', [profile.closure]),
    attribute('Poches', profile.pocketDetails),
    attribute('Logo', profile.logoDetails),
    attribute('Détails distinctifs', profile.distinctiveFeatures),
  ].filter((item): item is { key: string; value: string } => Boolean(item));

  return {
    name: present(profile.shortDescription)?.slice(0, 120),
    type: TYPE_LABELS[profile.productType] ?? present(profile.subtype),
    brand: profile.fieldConfidence.brand >= 0.55 ? present(profile.brand) : undefined,
    model: profile.fieldConfidence.model >= 0.55 ? present(profile.modelOrLine) : undefined,
    colors,
    material: profile.materialAppearance.map(present).filter(Boolean).join(', ') || undefined,
    description: present(profile.shortDescription),
    customAttributes,
  };
}
