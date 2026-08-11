export const USER_ROLES = {
  ADMIN: 'ADMIN',
  BOUTIQUE: 'BOUTIQUE',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
