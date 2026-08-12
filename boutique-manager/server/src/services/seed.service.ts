import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';

export async function ensureInitialUsersExist(): Promise<void> {
  await User.init();
  try {
    await Promise.all([
      User.findOneAndUpdate(
        { role: USER_ROLES.ADMIN },
        {
          $setOnInsert: {
            displayName: 'Administrateur',
            role: USER_ROLES.ADMIN,
            shopId: null,
            isActive: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
      User.findOneAndUpdate(
        { role: USER_ROLES.USER, systemSeedKey: 'initial_user' },
        {
          $setOnInsert: {
            displayName: 'Utilisateur',
            role: USER_ROLES.USER,
            shopId: null,
            isActive: true,
            systemSeedKey: 'initial_user',
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      ),
    ]);
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) {
      throw error;
    }
    await User.findOne({ role: USER_ROLES.ADMIN }).orFail();
  }
}
