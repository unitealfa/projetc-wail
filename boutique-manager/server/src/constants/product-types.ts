export const PRODUCT_TYPES = {
  T_SHIRT: 't_shirt',
  POLO: 'polo',
  SHIRT: 'shirt',
  BLOUSE: 'blouse',
  SWEATER: 'sweater',
  CARDIGAN: 'cardigan',
  HOODIE: 'hoodie',
  SWEATSHIRT: 'sweatshirt',
  JACKET: 'jacket',
  COAT: 'coat',
  BLAZER: 'blazer',
  VEST: 'vest',
  DRESS: 'dress',
  SKIRT: 'skirt',
  PANTS: 'pants',
  JEANS: 'jeans',
  SHORTS: 'shorts',
  LEGGINGS: 'leggings',
  SNEAKERS: 'sneakers',
  BOOTS: 'boots',
  SANDALS: 'sandals',
  HEELS: 'heels',
  LOAFERS: 'loafers',
  FLATS: 'flats',
  BAG: 'bag',
  BACKPACK: 'backpack',
  HAT: 'hat',
  SCARF: 'scarf',
  BELT: 'belt',
  OTHER: 'other',
  UNKNOWN: 'unknown',
} as const;

export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES];

export const PRODUCT_TYPE_VALUES = Object.values(PRODUCT_TYPES);

const aliases: Record<string, ProductType> = {
  tshirt: PRODUCT_TYPES.T_SHIRT,
  tee: PRODUCT_TYPES.T_SHIRT,
  polo: PRODUCT_TYPES.POLO,
  chemise: PRODUCT_TYPES.SHIRT,
  shirt: PRODUCT_TYPES.SHIRT,
  blouse: PRODUCT_TYPES.BLOUSE,
  pull: PRODUCT_TYPES.SWEATER,
  pullover: PRODUCT_TYPES.SWEATER,
  sweater: PRODUCT_TYPES.SWEATER,
  tricot: PRODUCT_TYPES.SWEATER,
  cardigan: PRODUCT_TYPES.CARDIGAN,
  gilet: PRODUCT_TYPES.CARDIGAN,
  hoodie: PRODUCT_TYPES.HOODIE,
  sweatacapuche: PRODUCT_TYPES.HOODIE,
  sweatshirt: PRODUCT_TYPES.SWEATSHIRT,
  sweat: PRODUCT_TYPES.SWEATSHIRT,
  veste: PRODUCT_TYPES.JACKET,
  jacket: PRODUCT_TYPES.JACKET,
  manteau: PRODUCT_TYPES.COAT,
  coat: PRODUCT_TYPES.COAT,
  blazer: PRODUCT_TYPES.BLAZER,
  vest: PRODUCT_TYPES.VEST,
  robe: PRODUCT_TYPES.DRESS,
  dress: PRODUCT_TYPES.DRESS,
  jupe: PRODUCT_TYPES.SKIRT,
  skirt: PRODUCT_TYPES.SKIRT,
  pantalon: PRODUCT_TYPES.PANTS,
  pants: PRODUCT_TYPES.PANTS,
  jean: PRODUCT_TYPES.JEANS,
  jeans: PRODUCT_TYPES.JEANS,
  short: PRODUCT_TYPES.SHORTS,
  shorts: PRODUCT_TYPES.SHORTS,
  legging: PRODUCT_TYPES.LEGGINGS,
  leggings: PRODUCT_TYPES.LEGGINGS,
  basket: PRODUCT_TYPES.SNEAKERS,
  baskets: PRODUCT_TYPES.SNEAKERS,
  sneakers: PRODUCT_TYPES.SNEAKERS,
  chaussure: PRODUCT_TYPES.SNEAKERS,
  chaussures: PRODUCT_TYPES.SNEAKERS,
  bottes: PRODUCT_TYPES.BOOTS,
  boots: PRODUCT_TYPES.BOOTS,
  sandales: PRODUCT_TYPES.SANDALS,
  sandals: PRODUCT_TYPES.SANDALS,
  talons: PRODUCT_TYPES.HEELS,
  heels: PRODUCT_TYPES.HEELS,
  mocassins: PRODUCT_TYPES.LOAFERS,
  loafers: PRODUCT_TYPES.LOAFERS,
  ballerines: PRODUCT_TYPES.FLATS,
  flats: PRODUCT_TYPES.FLATS,
  sac: PRODUCT_TYPES.BAG,
  bag: PRODUCT_TYPES.BAG,
  backpack: PRODUCT_TYPES.BACKPACK,
  sacados: PRODUCT_TYPES.BACKPACK,
  chapeau: PRODUCT_TYPES.HAT,
  hat: PRODUCT_TYPES.HAT,
  echarpe: PRODUCT_TYPES.SCARF,
  scarf: PRODUCT_TYPES.SCARF,
  ceinture: PRODUCT_TYPES.BELT,
  belt: PRODUCT_TYPES.BELT,
  accessoire: PRODUCT_TYPES.OTHER,
  other: PRODUCT_TYPES.OTHER,
  autre: PRODUCT_TYPES.OTHER,
  unknown: PRODUCT_TYPES.UNKNOWN,
  inconnu: PRODUCT_TYPES.UNKNOWN,
};

export function normalizeProductType(value: string | null | undefined): ProductType {
  if (!value) return PRODUCT_TYPES.UNKNOWN;
  const key = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (aliases[key]) return aliases[key];
  const normalizedWords = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  for (const word of normalizedWords) {
    if (aliases[word]) return aliases[word];
  }
  return PRODUCT_TYPES.OTHER;
}
