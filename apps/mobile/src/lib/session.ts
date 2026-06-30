import * as SecureStore from 'expo-secure-store';
import { Session } from '../types/domain';

const SESSION_KEY = 'licio.session.v1';
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function parseSession(raw: string | null): Session | undefined {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return undefined;
  }
}

export async function getSession(): Promise<Session | undefined> {
  return parseSession(await SecureStore.getItemAsync(SESSION_KEY, secureStoreOptions));
}

export async function saveSession(session: Session) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), secureStoreOptions);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(SESSION_KEY, secureStoreOptions);
}
