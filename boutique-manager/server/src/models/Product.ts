import mongoose, { Schema, type HydratedDocument, type Types } from 'mongoose';

export interface ICustomAttribute {
  key: string;
  value: string;
}

export interface IProduct {
  shopId: Types.ObjectId;
  internalCode: string;
  name: string;
  type: string;
  brand: string;
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
  imageUrl: string;
  imageStorageKey: string;
  customAttributes: ICustomAttribute[];
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type ProductDocument = HydratedDocument<IProduct>;

const customAttributeSchema = new Schema<ICustomAttribute>(
  {
    key: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const productSchema = new Schema<IProduct>(
  {
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', required: true, index: true },
    internalCode: { type: String, required: true, unique: true, immutable: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    model: { type: String, trim: true },
    reference: { type: String, trim: true },
    sku: { type: String, trim: true },
    barcode: { type: String, trim: true },
    colors: { type: [String], required: true },
    sizes: { type: [String], default: [] },
    material: { type: String, trim: true },
    targetAudience: { type: String, trim: true },
    description: { type: String, trim: true },
    price: { type: Number, min: 0 },
    currency: { type: String, trim: true },
    stock: { type: Number, min: 0 },
    imageUrl: { type: String, required: true },
    imageStorageKey: { type: String, required: true },
    customAttributes: { type: [customAttributeSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
