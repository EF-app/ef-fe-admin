import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search } from 'lucide-react-native';
import {
  useUsers,
  USER_STATUS_LABEL,
  formatDate,
  type User,
  type UserStatus,
} from '@ef-fe-admin/shared';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';

const statusVariant: Record<UserStatus, 'active' | 'warn' | 'danger' | 'neutral'> = {
  ACTIVE: 'active',
  TEMPORARY: 'danger',
  PERMANENT: 'danger',
  WITHDRAWING: 'neutral',
  WITHDRAWN: 'neutral',
};

export default function UsersScreen() {
  const router = useRouter();
  const [keyword, setKeyword] = useState('');
  const [applied, setApplied] = useState('');

  const { data, isLoading } = useUsers({
    keyword: applied || undefined,
    page: 0,
    size: 20,
  });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <View className="flex-row items-center bg-surface border border-border rounded-lg px-3 py-2">
          <Search size={16} color="#6B6573" />
          <TextInput
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => setApplied(keyword.trim())}
            placeholder="ID 또는 닉네임 검색"
            placeholderTextColor="#B0A9BA"
            className="flex-1 ml-2 text-[13px] text-text"
            returnKeyType="search"
          />
          <Pressable
            onPress={() => setApplied(keyword.trim())}
            className="bg-point rounded-md px-3 py-1.5"
          >
            <Text className="text-white text-[11px] font-extrabold">검색</Text>
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<User>
          data={data?.content ?? []}
          keyExtractor={(u) => u.uuid}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="검색 결과가 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/users/${item.uuid}` as never)}
              className="bg-surface border border-border rounded-xl p-4 flex-row items-center gap-3"
            >
              <View className="w-12 h-12 rounded-full bg-point-softer items-center justify-center">
                <Text className="text-[18px]">👤</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-extrabold text-text">{item.nickname}</Text>
                <Text className="text-[11px] text-text-soft mt-0.5">@{item.login_id}</Text>
                <Text className="text-[11px] text-text-soft mt-0.5">
                  가입 {formatDate(item.create_time)}
                </Text>
              </View>
              <Badge variant={statusVariant[item.status]}>{USER_STATUS_LABEL[item.status]}</Badge>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
