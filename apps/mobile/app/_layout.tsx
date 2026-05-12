import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@ef-fe-admin/shared';

import '../global.css';
import '../src/config/apiClient';
import { loadToken, isOfflineMode } from '../src/config/apiClient';
import { useAuthStore } from '../src/store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: isOfflineMode ? 0 : 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export default function RootLayout() {
  const restore = useAuthStore((s) => s.restore);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const token = await loadToken();
      const rawAdmin = await AsyncStorage.getItem(STORAGE_KEYS.ADMIN_PROFILE);
      const admin = rawAdmin ? JSON.parse(rawAdmin) : null;
      restore(token, admin);
      setReady(true);
    })();
  }, [restore]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#F5F3F1' },
            }}
          >
            <Stack.Screen name="index" options={{ title: '테스트 센터' }} />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
