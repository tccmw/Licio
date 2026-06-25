import * as SecureStore from 'expo-secure-store';
import { Session } from '../types/domain';

const SESSION_KEY = 'licio.session.v1';
type EncryptedStorageApi = typeof import('react-native-encrypted-storage').default;

async function getEncryptedStorage(): Promise<EncryptedStorageApi | undefined> {
  try {
    const module = await import('react-native-encrypted-storage');
    return module.default;
  } catch {
    return undefined;
  }
}

function parseSession(raw: string | null): Session | undefined {
  if (!raw) return undefined;
  return JSON.parse(raw) as Session;
}

export async function getSession(): Promise<Session | undefined> {
  const encryptedStorage = await getEncryptedStorage();
  const encryptedSession = parseSession(encryptedStorage ? await encryptedStorage.getItem(SESSION_KEY) : null);
  if (encryptedSession) return encryptedSession;

  const legacySession = parseSession(await SecureStore.getItemAsync(SESSION_KEY));
  if (!legacySession || !encryptedStorage) return legacySession;

  await encryptedStorage.setItem(SESSION_KEY, JSON.stringify(legacySession));
  await SecureStore.deleteItemAsync(SESSION_KEY);

  return legacySession;
}

export async function saveSession(session: Session) {
  const serializedSession = JSON.stringify(session);
  const encryptedStorage = await getEncryptedStorage();

  if (!encryptedStorage) {
    await SecureStore.setItemAsync(SESSION_KEY, serializedSession);
    return;
  }

  await encryptedStorage.setItem(SESSION_KEY, serializedSession);
  await SecureStore.deleteItemAsync(SESSION_KEY);
}

export async function clearSession() {
  const encryptedStorage = await getEncryptedStorage();
  await Promise.all([
    encryptedStorage?.removeItem(SESSION_KEY),
    SecureStore.deleteItemAsync(SESSION_KEY),
  ]);
}
