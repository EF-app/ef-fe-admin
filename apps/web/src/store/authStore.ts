import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '@ef-fe-admin/shared';
import type { AdminAccount } from '@ef-fe-admin/shared';

interface AuthState {
  token: string | null;
  admin: AdminAccount | null;
  isAuthenticated: boolean;
  login: (token: string, admin: AdminAccount) => void;
  logout: () => void;
  updateAdmin: (admin: AdminAccount) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      admin: null,
      isAuthenticated: false,
      login: (token, admin) => {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
        set({ token, admin, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.ADMIN_PROFILE);
        set({ token: null, admin: null, isAuthenticated: false });
      },
      updateAdmin: (admin) => set({ admin }),
    }),
    {
      name: STORAGE_KEYS.ADMIN_PROFILE,
      partialize: (s) => ({ admin: s.admin, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
);
