import { create } from 'zustand';
import type { AdminAccount } from '@ef-fe-admin/shared';
import { saveToken, clearToken } from '../config/apiClient';

interface AuthState {
  token: string | null;
  admin: AdminAccount | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (token: string, admin: AdminAccount) => Promise<void>;
  logout: () => Promise<void>;
  setHydrated: (hydrated: boolean) => void;
  restore: (token: string | null, admin: AdminAccount | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  admin: null,
  isAuthenticated: false,
  hydrated: false,

  login: async (token, admin) => {
    await saveToken(token);
    set({ token, admin, isAuthenticated: true });
  },
  logout: async () => {
    await clearToken();
    set({ token: null, admin: null, isAuthenticated: false });
  },
  setHydrated: (hydrated) => set({ hydrated }),
  restore: (token, admin) =>
    set({ token, admin, isAuthenticated: !!token, hydrated: true }),
}));
