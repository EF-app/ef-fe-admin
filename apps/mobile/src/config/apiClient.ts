import AsyncStorage from '@react-native-async-storage/async-storage';
import { createApiClient, setApiClient, STORAGE_KEYS } from '@ef-fe-admin/shared';
import Constants from 'expo-constants';

const baseURL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string })?.apiUrl ??
  '';

export const isOfflineMode = !baseURL;
if (isOfflineMode && __DEV__) {
  console.warn('[apiClient] 오프라인 모드: API 호출은 모두 실패합니다. UI 확인용으로만 사용하세요.');
}

let cachedToken: string | null = null;

export async function loadToken() {
  cachedToken = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  return cachedToken;
}

export async function saveToken(token: string) {
  cachedToken = token;
  await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
}

export async function clearToken() {
  cachedToken = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.ADMIN_PROFILE);
}

const client = createApiClient({
  baseURL,
  getToken: async () => cachedToken ?? (await loadToken()),
});

setApiClient(client);
