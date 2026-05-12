import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  useReports,
  REPORT_TARGET_TYPE_LABEL,
  formatFromNow,
  type Report,
  type ReportStatus,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';

export default function ReportsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const { data, isLoading } = useReports({ status, page: 0, size: 20 });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<ReportStatus>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'PENDING', label: '대기 중' },
            { value: 'PROCESSED', label: '처리됨' },
            { value: 'DISMISSED', label: '기각됨' },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<Report>
          data={data?.content ?? []}
          keyExtractor={(r) => String(r.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="신고 내역이 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/reports/${item.id}` as never)}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Badge variant="point">{REPORT_TARGET_TYPE_LABEL[item.target_type]}</Badge>
                <Text className="text-[10px] text-text-soft">
                  {formatFromNow(item.create_time)}
                </Text>
              </View>
              <Text className="text-[13px] text-text font-bold mb-1" numberOfLines={2}>
                {item.target_preview ?? item.reason ?? '(내용 없음)'}
              </Text>
              <Text className="text-[11px] text-text-soft">
                신고자: @{item.reporter_nickname ?? '-'} → 피신고: @
                {item.target_user_nickname ?? '-'}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
