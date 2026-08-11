import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'boutique_manager_jwt';

// Repli temporaire si le module natif n'est pas disponible dans le client utilisé.
// Le jeton reste uniquement en mémoire et disparaît à la fermeture de l'application.
let memoryToken: string | null = null;

function getBrowserStorage(): Storage | null {
  if (Platform.OS !== 'web' || typeof globalThis.sessionStorage === 'undefined') {
    return null;
  }

  return globalThis.sessionStorage;
}

async function getToken(): Promise<string | null> {
  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    return browserStorage.getItem(TOKEN_KEY);
  }

  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return memoryToken;
  }
}

async function setToken(token: string): Promise<void> {
  memoryToken = token;

  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.setItem(TOKEN_KEY, token);
    return;
  }

  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {
    // Le jeton reste disponible en mémoire pour la session courante.
  }
}

async function clearToken(): Promise<void> {
  memoryToken = null;

  const browserStorage = getBrowserStorage();
  if (browserStorage) {
    browserStorage.removeItem(TOKEN_KEY);
    return;
  }

  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    // Rien d'autre à effacer quand le module natif n'est pas disponible.
  }
}

export const sessionStorage = {
  getToken,
  setToken,
  clearToken,
};
