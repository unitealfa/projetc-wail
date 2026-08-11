import type { UserRole } from '../constants/roles';
import type { Shop } from './shop';

export interface User {
  id: string;
  displayName: string;
  role: UserRole;
  shopId: string | null;
  isActive: boolean;
  shop: Shop | null;
}
