import { create } from 'zustand';
import { clearSession, getSession, saveSession } from '../lib/session';
import { Session } from '../types/domain';

type AuthState = {
  session?: Session;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSession: (session: Session) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  hydrated: false,
  hydrate: async () => set({ session: await getSession(), hydrated: true }),
  setSession: async (session) => { await saveSession(session); set({ session }); },
  signOut: async () => { await clearSession(); set({ session: undefined }); },
}));
