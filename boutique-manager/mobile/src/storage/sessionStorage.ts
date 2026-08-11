import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'boutique_manager_jwt';

export const sessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
