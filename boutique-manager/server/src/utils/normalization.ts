import { normalizeProductType } from '../constants/product-types.js';

const COLOR_ALIASES: Record<string, string> = {
  black: 'black', noir: 'black', noire: 'black',
  white: 'white', blanc: 'white', blanche: 'white',
  red: 'red', rouge: 'red',
  blue: 'blue', bleu: 'blue', bleue: 'blue', navy: 'navy', marine: 'navy',
  green: 'green', vert: 'green', verte: 'green',
  yellow: 'yellow', jaune: 'yellow',
  orange: 'orange',
  purple: 'purple', violet: 'purple', violette: 'purple',
  pink: 'pink', rose: 'pink',
  brown: 'brown', marron: 'brown', brun: 'brown',
  beige: 'beige', cream: 'cream', creme: 'cream',
  gray: 'gray', grey: 'gray', gris: 'gray', grise: 'gray',
  gold: 'gold', dore: 'gold', doree: 'gold',
  silver: 'silver', argent: 'silver', argente: 'silver', argentee: 'silver',
};

const EMPTY_VALUES = new Set(['', 'unknown', 'inconnu', 'inconnue', 'indetermine', 'indeterminee', 'n/a', 'null']);

export function normalizeString(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
  return EMPTY_VALUES.has(normalized) ? null : normalized;
}

export function normalizeFeatureToken(value: string | null | undefined): string | null {
  return normalizeString(value)?.replace(/\s+/g, '-') ?? null;
}

export function normalizeColor(value: string | null | undefined): string | null {
  const normalized = normalizeString(value);
  if (!normalized) return null;
  const tokens = normalized.split(' ');
  return tokens.map((token) => COLOR_ALIASES[token] ?? token).join('-');
}

export { normalizeProductType };
