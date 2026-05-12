import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginMutation, validators, STORAGE_KEYS } from '@ef-fe-admin/shared';
import { useAuthStore } from '../../../store/authStore';

export default function LoginScreen() {
  const storeLogin = useAuthStore((s) => s.login);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useLoginMutation({
    onSuccess: async (data) => {
      await AsyncStorage.setItem(STORAGE_KEYS.ADMIN_PROFILE, JSON.stringify(data.admin));
      await storeLogin(data.token, data.admin);
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = () => {
    setError(null);
    const idCheck = validators.loginId(loginId);
    const pwCheck = validators.password(password);
    if (!idCheck.valid) return setError(idCheck.message ?? '');
    if (!pwCheck.valid) return setError(pwCheck.message ?? '');
    loginMutation.mutate({ login_id: loginId, password });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <View className="bg-surface rounded-2xl p-8 border border-border">
          <View className="flex-row items-center gap-3 mb-8">
            <View className="w-12 h-12 rounded-xl bg-point items-center justify-center">
              <Text className="text-white font-black text-[15px]">EF</Text>
            </View>
            <View>
              <Text className="text-[17px] font-extrabold text-text">EF 관리자</Text>
              <Text className="text-[11px] text-text-soft">Admin Console</Text>
            </View>
          </View>

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">아이디</Text>
          <TextInput
            value={loginId}
            onChangeText={setLoginId}
            autoCapitalize="none"
            autoCorrect={false}
            className="border border-border rounded-lg px-3 py-2.5 text-[14px] text-text bg-bg mb-4"
          />

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">비밀번호</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            className="border border-border rounded-lg px-3 py-2.5 text-[14px] text-text bg-bg mb-5"
          />

          {error && (
            <View className="bg-danger-soft rounded-md px-3 py-2 mb-4">
              <Text className="text-danger text-[12px] font-bold">{error}</Text>
            </View>
          )}

          <Pressable
            onPress={handleSubmit}
            disabled={loginMutation.isPending}
            className={`rounded-lg py-3 items-center ${
              loginMutation.isPending ? 'bg-point-softer' : 'bg-point'
            }`}
          >
            <Text className="text-white font-extrabold text-[14px]">
              {loginMutation.isPending ? '로그인 중...' : '로그인'}
            </Text>
          </Pressable>

          <Text className="text-[10px] text-text-soft text-center mt-6">
            © 2026 EF. All rights reserved.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
