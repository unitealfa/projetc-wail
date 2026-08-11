import type { User } from '../types/user';
import { apiRequest } from './client';

export const usersApi = {
  list: () => apiRequest<{ users: User[] }>('/api/users'),
};
