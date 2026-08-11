import mongoose, { Schema, type HydratedDocument, type Types } from 'mongoose';
import { USER_ROLES, type UserRole } from '../constants/roles.js';

export interface IUser {
  displayName: string;
  role: UserRole;
  shopId: Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    displayName: { type: String, required: true, trim: true },
    role: { type: String, enum: Object.values(USER_ROLES), required: true, index: true },
    shopId: { type: Schema.Types.ObjectId, ref: 'Shop', default: null, index: true },
    isActive: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

userSchema.index(
  { role: 1 },
  { unique: true, partialFilterExpression: { role: USER_ROLES.ADMIN }, name: 'one_admin_only' },
);
userSchema.index(
  { shopId: 1 },
  { unique: true, partialFilterExpression: { role: USER_ROLES.BOUTIQUE }, name: 'one_user_per_shop_mvp' },
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
