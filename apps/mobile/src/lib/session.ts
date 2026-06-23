import * as SecureStore from 'expo-secure-store';
import { Session } from '../types/domain';

const SESSION_KEY = 'licio.session.v1';

export async function getSession(): Promise<Session | undefined> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  return raw ? JSON.parse(raw) as Session : undefined;
}

export function saveSession(session: Session) {
  return SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  return SecureStore.deleteItemAsync(SESSION_KEY);
}
