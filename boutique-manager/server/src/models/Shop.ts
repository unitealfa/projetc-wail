import mongoose, { Schema, type HydratedDocument } from 'mongoose';

export interface IShop {
  name: string;
  phone: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ShopDocument = HydratedDocument<IShop>;

const shopSchema = new Schema<IShop>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

export const Shop = mongoose.models.Shop || mongoose.model<IShop>('Shop', shopSchema);
