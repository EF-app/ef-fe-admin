import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import LoginScreen from '../../src/features/auth/screens/LoginScreen';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginRoute() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) router.replace('/(tabs)/dashboard');
  }, [isAuthenticated, router]);

  return <LoginScreen />;
}
