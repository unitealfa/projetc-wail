import type { PickedImage } from './product';

export interface SearchAnalysis {
  productType: string;
  brand: string | null;
  primaryColor: string | null;
  shortDescription: string;
  confidence: number;
  isProduct: boolean;
  multipleProductsDetected: boolean;
}

export interface SearchMatch {
  score: number;
  confidenceLabel: 'VERY_LIKELY' | 'LIKELY' | 'POSSIBLE';
  reasons: string[];
  product: {
    id: string;
    name: string;
    brand: string | null;
    type: string | null;
    model: string | null;
    reference: string | null;
    colors: string[];
    sizes: string[];
    stock: number | null;
    price: number | null;
    currency: string | null;
    imageUrl: string | null;
  };
  shop: {
    id: string;
    name: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  distanceKm: number | null;
  requestedSizeStatus: 'LISTED' | 'NOT_LISTED' | 'NOT_REQUESTED';
  mustConfirmByPhone: true;
}

export interface ProductSearchInput {
  image: PickedImage;
  size?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProductSearchResult {
  analysis: SearchAnalysis;
  lowConfidence: boolean;
  message?: string;
  multipleStrongMatches?: boolean;
  matches: SearchMatch[];
}
