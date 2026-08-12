export interface CustomAttribute {
  key: string;
  value: string;
}

export interface ProductInput {
  name: string;
  type?: string;
  brand?: string;
  model?: string;
  reference?: string;
  sku?: string;
  barcode?: string;
  colors: string[];
  sizes: string[];
  material?: string;
  targetAudience?: string;
  description?: string;
  price?: number;
  currency?: string;
  stock?: number;
  customAttributes: CustomAttribute[];
}

export interface Product extends ProductInput {
  _id: string;
  shopId: string;
  internalCode: string;
  imageUrl?: string;
  imageStorageKey?: string;
  aiAnalysisStatus?: 'PENDING' | 'READY' | 'FAILED' | null;
  aiAnalysisModel?: string | null;
  aiAnalyzedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PickedImage {
  uri: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
}
