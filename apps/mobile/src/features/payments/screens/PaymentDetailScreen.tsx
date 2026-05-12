import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  usePaymentDetail,
  useRefundMutation,
  PAYMENT_STATUS_LABEL,
  PAYMENT_TYPE_LABEL,
  REFUND_TYPE_LABEL,
  formatCurrency,
  formatDateTime,
  type RefundType,
} from '@ef-fe-admin/shared';
import Badge from '../../../components/ui/Badge';

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const paymentId = id ? Number(id) : undefined;
  const { data: payment } = usePaymentDetail(paymentId);

  const [refundType, setRefundType] = useState<RefundType>('FULL');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const refund = useRefundMutation({
    onSuccess: () => {
      setReason('');
      setAmount('');
      router.back();
    },
  });

  if (!payment) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[12px] text-text-soft">불러오는 중...</Text>
      </View>
    );
  }

  const onSubmit = () => {
    if (!reason.trim()) return;
    const parsedAmount =
      refundType === 'PARTIAL' ? Number(amount.replace(/\D/g, '')) : undefined;
    refund.mutate({
      id: payment.id,
      payload: {
        refund_type: refundType,
        refund_reason: reason.trim(),
        amount: parsedAmount,
      },
    });
  };

  const canRefund = payment.status === 'SUCCESS';

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-3">
        <ArrowLeft size={14} color="#6B6573" />
        <Text className="text-[12px] text-text-sub font-bold">결제 목록</Text>
      </Pressable>

      <View className="bg-surface border border-border rounded-xl p-5 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-[24px] font-extrabold text-text">
            {formatCurrency(payment.amount)}
          </Text>
          <Badge
            variant={
              payment.status === 'SUCCESS'
                ? 'active'
                : payment.status === 'REFUNDED'
                ? 'neutral'
                : 'danger'
            }
          >
            {PAYMENT_STATUS_LABEL[payment.status]}
          </Badge>
        </View>
        <View className="bg-bg rounded-lg p-3 gap-1.5">
          <Row label="결제 유형" value={PAYMENT_TYPE_LABEL[payment.payment_type]} />
          <Row label="주문번호" value={payment.order_id} />
          <Row label="결제자" value={payment.user_nickname ?? '-'} />
          <Row label="결제 시각" value={formatDateTime(payment.paid_at)} />
          {payment.refunded_at && (
            <Row label="환불 시각" value={formatDateTime(payment.refunded_at)} />
          )}
        </View>
        {payment.refund_reason && (
          <View className="bg-warn-soft rounded-md px-3 py-2 mt-3">
            <Text className="text-[10.5px] font-extrabold text-warn-dark mb-0.5">
              환불 사유
            </Text>
            <Text className="text-[12px] text-text">{payment.refund_reason}</Text>
          </View>
        )}
      </View>

      {canRefund && (
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-[14px] font-extrabold text-text mb-3">환불 처리</Text>

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">환불 유형</Text>
          <View className="flex-row gap-2 mb-4">
            {(['FULL', 'PARTIAL', 'SYSTEM_ERROR'] as RefundType[]).map((t) => (
              <Pressable
                key={t}
                onPress={() => setRefundType(t)}
                className={`flex-1 rounded-md py-2 items-center border ${
                  refundType === t ? 'bg-point border-point' : 'bg-surface border-border'
                }`}
              >
                <Text
                  className={`text-[10.5px] font-extrabold ${
                    refundType === t ? 'text-white' : 'text-text-sub'
                  }`}
                >
                  {REFUND_TYPE_LABEL[t]}
                </Text>
              </Pressable>
            ))}
          </View>

          {refundType === 'PARTIAL' && (
            <>
              <Text className="text-[12px] font-bold text-text-sub mb-1.5">부분 환불 금액</Text>
              <TextInput
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="원"
                placeholderTextColor="#B0A9BA"
                className="border border-border rounded-lg px-3 py-2.5 text-[14px] text-text bg-bg mb-4"
              />
            </>
          )}

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">환불 사유</Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="환불 처리 사유를 입력하세요"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-lg px-3 py-2 text-[13px] text-text bg-bg mb-4 min-h-[80px]"
          />

          <Pressable
            onPress={onSubmit}
            disabled={refund.isPending || !reason.trim()}
            className={`rounded-lg py-3 items-center ${
              refund.isPending || !reason.trim() ? 'bg-point-softer' : 'bg-danger'
            }`}
          >
            <Text className="text-white font-extrabold text-[13px]">
              {refund.isPending ? '처리 중...' : '환불 승인'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-[11px] text-text-soft">{label}</Text>
      <Text className="text-[12px] font-bold text-text">{value}</Text>
    </View>
  );
}
