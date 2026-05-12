import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useAuditLogs, formatDateTime, type AuditLog } from '@ef-fe-admin/shared';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';

export default function AuditLogsScreen() {
  const { data, isLoading } = useAuditLogs({ page: 0, size: 20 });

  return (
    <View className="flex-1 bg-bg">
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<AuditLog>
          data={data?.content ?? []}
          keyExtractor={(l) => String(l.id)}
          contentContainerStyle={{ padding: 16, gap: 8 }}
          ListEmptyComponent={<EmptyState message="감사 로그가 없습니다" />}
          renderItem={({ item }) => (
            <View className="bg-surface border border-border rounded-xl p-3.5">
              <View className="flex-row items-center gap-2 mb-1.5">
                <Badge variant="point">{item.action}</Badge>
                <Text className="text-[10.5px] text-text-soft">
                  {formatDateTime(item.create_time)}
                </Text>
              </View>
              <Text className="text-[12.5px] font-extrabold text-text">
                @{item.admin_name} · {item.target_type ?? '-'} #{item.target_id ?? '-'}
              </Text>
              {item.ip_address && (
                <Text className="text-[10.5px] text-text-soft mt-0.5">
                  IP {item.ip_address}
                </Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}
