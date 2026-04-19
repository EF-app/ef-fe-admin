import { createApiClient, setApiClient, STORAGE_KEYS } from '@ef-fe-admin/shared';

const baseURL = import.meta.env.VITE_API_URL ?? '';

const client = createApiClient({
  baseURL,
  getToken: () => localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN),
  onUnauthorized: () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_PROFILE);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  },
});

setApiClient(client);
