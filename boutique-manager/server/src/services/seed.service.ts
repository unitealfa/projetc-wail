import { USER_ROLES } from '../constants/roles.js';
import { User } from '../models/User.js';

export async function ensureAdminExists(): Promise<void> {
  await User.init();
  try {
    await User.findOneAndUpdate(
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
    );
  } catch (error) {
    if ((error as { code?: number }).code !== 11000) {
      throw error;
    }
    await User.findOne({ role: USER_ROLES.ADMIN }).orFail();
  }
}
