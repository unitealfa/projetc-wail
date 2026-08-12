import mongoose, { Schema, type HydratedDocument } from 'mongoose';

export interface IShop {
  name: string;
  phone: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ShopDocument = HydratedDocument<IShop>;

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    latitude: { type: Number, min: -90, max: 90, default: null },
    longitude: { type: Number, min: -180, max: 180, default: null },
  },
  { timestamps: true },
);

export const Shop = mongoose.models.Shop || mongoose.model<IShop>('Shop', shopSchema);
