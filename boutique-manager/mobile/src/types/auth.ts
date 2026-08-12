import type { UserRole } from '../constants/roles';

export interface AuthUser {
  id: string;
  displayName: string;
  role: UserRole;
  shopId: string | null;
}

export interface AuthOption {
  userId: string;
  displayName: string;
}

export interface BoutiqueAuthOption extends AuthOption {
  shopId: string;
  shopName: string;
}

export interface AuthOptions {
  admin: AuthOption;
  boutiques: BoutiqueAuthOption[];
  users: AuthOption[];
}
