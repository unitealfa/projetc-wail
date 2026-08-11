import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'boutique_manager_jwt';

export const sessionStorage = {
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  setToken: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  clearToken: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // Certaines versions d'Expo Go n'exposent pas encore la méthode native
      // utilisée par deleteItemAsync. Écraser la valeur supprime le JWT actif
      // tout en restant compatible avec ces versions.
      await SecureStore.setItemAsync(TOKEN_KEY, '');
    }
  },
};
