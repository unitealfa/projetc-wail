import type { AuthOptions, AuthUser } from '../types/auth';
import { apiRequest } from './client';

export const authApi = {
  options: () => apiRequest<AuthOptions>('/api/auth/options', { authenticated: false }),
  login: (userId: string) =>
    apiRequest<{ token: string; user: AuthUser }>('/api/auth/mock-login', {
      method: 'POST',
      json: { userId },
      authenticated: false,
    }),
  me: () => apiRequest<{ user: AuthUser }>('/api/auth/me'),
};
