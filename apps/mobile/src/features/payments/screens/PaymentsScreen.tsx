import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import {
  usePayments,
  PAYMENT_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
  formatCurrency,
  formatDate,
  type PaymentLog,
  type PaymentStatus,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';

export default function PaymentsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus | 'ALL'>('SUCCESS');

  const params = status === 'ALL' ? {} : { status };
  const { data, isLoading } = usePayments({ ...params, page: 0, size: 20 });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<PaymentStatus | 'ALL'>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'SUCCESS', label: '결제 완료' },
            { value: 'REFUNDED', label: '환불됨' },
            { value: 'FAILED', label: '실패' },
            { value: 'ALL', label: '전체' },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<PaymentLog>
          data={data?.content ?? []}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="결제 내역이 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(`/(tabs)/payments/${item.id}` as never)}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[17px] font-extrabold text-text">
                  {formatCurrency(item.amount)}
                </Text>
                <Badge
                  variant={
                    item.status === 'SUCCESS'
                      ? 'active'
                      : item.status === 'REFUNDED'
                      ? 'neutral'
                      : 'danger'
                  }
                >
                  {PAYMENT_STATUS_LABEL[item.status]}
                </Badge>
              </View>
              <Text className="text-[12px] text-text-sub mb-1">
                @{item.user_nickname ?? '-'} · {PAYMENT_TYPE_LABEL[item.payment_type]}
              </Text>
              <Text className="text-[11px] text-text-soft">
                결제 {formatDate(item.paid_at)} · {item.order_id}
              </Text>
              {item.refund_reason && (
                <Text className="text-[11px] text-text-soft mt-2">
                  환불 사유: {item.refund_reason}
                </Text>
              )}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}
