import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { ShieldCheck, LayoutDashboard, Settings, UserCheck, AlertTriangle, Unlock } from "lucide-react-native";
import { useAuthStore } from "../src/store/authStore";

export default function AdminTestCenter() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const handleDevEnter = async () => {
    await login('dev-fake-token', {
      id: 0,
      uuid: 'dev-uuid',
      login_id: 'dev',
      name: '개발자',
      email: 'dev@local',
      phone: '',
      role: 'SUPER_ADMIN',
      is_active: true,
      deactivated_at: null,
      deactivated_reason: null,
      last_login_at: null,
      last_login_ip: null,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    });
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} className="bg-[#F5F3F1]">
      <View className="flex-1 items-center justify-center p-6 mt-10">
        <ShieldCheck color="#9686BF" size={48} strokeWidth={2} />
        <Text className="text-2xl font-bold text-[#9686BF] mt-4 mb-2">
          EF Admin Test Center 💜
        </Text>
        <Text className="text-gray-500 mb-10 text-center">
          관리자 시스템 개발용 테스트 페이지입니다.
        </Text>

        {/* 0. 개발용 바로 진입 */}
        <TouchableOpacity
          onPress={handleDevEnter}
          className="w-full flex-row items-center justify-center bg-[#3E9F7A] p-4 rounded-2xl mb-4 shadow-lg"
        >
          <Unlock color="white" size={20} className="mr-2" />
          <Text className="text-white text-lg font-bold ml-2">🔓 개발용 바로 진입 (로그인 우회)</Text>
        </TouchableOpacity>

        {/* 1. 대시보드 (메인) */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/dashboard")}
          className="w-full flex-row items-center justify-center bg-[#9686BF] p-4 rounded-2xl mb-4 shadow-lg"
        >
          <LayoutDashboard color="white" size={20} className="mr-2" />
          <Text className="text-white text-lg font-bold ml-2">관리자 대시보드 진입</Text>
        </TouchableOpacity>

        {/* 2. 유저 관리 (예시) */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/users")}
          className="w-full flex-row items-center justify-center bg-white border-2 border-[#9686BF] p-4 rounded-2xl mb-4"
        >
          <UserCheck color="#9686BF" size={20} className="mr-2" />
          <Text className="text-[#9686BF] text-lg font-bold ml-2">유저 관리 페이지</Text>
        </TouchableOpacity>

        {/*없는 페이지로 가기 */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/this-is-not-real")}
          className="w-full flex-row items-center justify-center bg-white border-2 border-[#9686BF] p-4 rounded-2xl mb-4"
        >
          <Settings color="#9686BF" size={20} className="mr-2" />
          <Text className="text-[#9686BF] text-lg font-bold ml-2">없는 페이지로 가기</Text>
        </TouchableOpacity>

        <View className="w-full h-[1px] bg-gray-300 my-6" />

        {/* 4. 에러 페이지 테스트 */}
        <TouchableOpacity
          onPress={() => router.push("/not-found-test")}
          className="w-full flex-row items-center justify-center bg-gray-200 p-4 rounded-2xl mb-4"
        >
          <AlertTriangle color="#666" size={20} className="mr-2" />
          <Text className="text-[#666] text-lg font-bold ml-2">에러(404) 페이지 테스트</Text>
        </TouchableOpacity>

        <Text className="mt-8 text-gray-400 text-xs">
          현재 경로: apps/mobile/app/index.tsx
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
});