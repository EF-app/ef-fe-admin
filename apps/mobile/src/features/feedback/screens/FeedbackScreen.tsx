import { useEffect, useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput, ScrollView } from 'react-native';
import {
  useFeedbacks,
  useUpdateFeedbackMutation,
  formatFromNow,
  formatDateTime,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_CATEGORY_LABEL,
  FEEDBACK_STATUS,
  type Feedback,
  type FeedbackType,
  type FeedbackStatus,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import BottomSheet from '../../../components/ui/BottomSheet';

export default function FeedbackScreen() {
  const [type, setType] = useState<FeedbackType | 'ALL'>('ALL');
  const [status, setStatus] = useState<FeedbackStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Feedback | null>(null);

  const { data, isLoading } = useFeedbacks({
    feedback_type: type === 'ALL' ? undefined : type,
    status: status === 'ALL' ? undefined : status,
    page: 0,
    size: 20,
  });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<FeedbackType | 'ALL'>
          value={type}
          onChange={setType}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'BUG', label: '버그' },
            { value: 'FEATURE_REQUEST', label: '기능 요청' },
          ]}
        />
      </View>
      <View className="px-4 pb-2">
        <FilterChips<FeedbackStatus | 'ALL'>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'RECEIVED', label: '접수' },
            { value: 'IN_REVIEW', label: '검토' },
            { value: 'IN_PROGRESS', label: '처리 중' },
            { value: 'RESOLVED', label: '해결' },
            { value: 'DEFERRED', label: '보류' },
            { value: 'CLOSED', label: '종료' },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<Feedback>
          data={data?.content ?? []}
          keyExtractor={(f) => String(f.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="피드백이 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
                <Badge variant={item.feedback_type === 'BUG' ? 'danger' : 'point'}>
                  {FEEDBACK_TYPE_LABEL[item.feedback_type]}
                </Badge>
                <Badge variant="neutral">{FEEDBACK_CATEGORY_LABEL[item.category_code]}</Badge>
                <FeedbackStatusBadge status={item.status} />
              </View>
              <Text className="text-[13.5px] font-extrabold text-text mb-1" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-[12px] text-text-sub mb-2" numberOfLines={2}>
                {item.content}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10.5px] text-text-soft">
                  @{item.reporter_nickname ?? '-'} · {formatFromNow(item.create_time)}
                </Text>
                <Text className="text-[10.5px] text-text-soft">
                  담당 {item.admin_handler_name ?? '-'}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <FeedbackDetailSheet
        feedback={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const variant =
    status === 'RESOLVED' ? 'active' :
    status === 'CLOSED' || status === 'DEFERRED' ? 'neutral' :
    status === 'IN_PROGRESS' ? 'point' :
    'warn';
  return <Badge variant={variant}>{FEEDBACK_STATUS_LABEL[status]}</Badge>;
}

function FeedbackDetailSheet({
  feedback,
  visible,
  onClose,
}: {
  feedback: Feedback | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<FeedbackStatus>('RECEIVED');
  const [reply, setReply] = useState('');
  const [memo, setMemo] = useState('');

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setReply(feedback.admin_reply ?? '');
      setMemo(feedback.admin_internal_memo ?? '');
    }
  }, [feedback?.id]);

  const updateMutation = useUpdateFeedbackMutation({
    onSuccess: onClose,
  });

  if (!feedback) return null;

  const handleSubmit = () => {
    updateMutation.mutate({
      id: feedback.id,
      payload: {
        status,
        admin_reply: reply.trim() || undefined,
        admin_internal_memo: memo.trim() || undefined,
      },
    });
  };

  return (
    <BottomSheet visible={visible} title="피드백 상세" onClose={onClose}>
      <ScrollView style={{ maxHeight: 600 }}>
        <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
          <Badge variant={feedback.feedback_type === 'BUG' ? 'danger' : 'point'}>
            {FEEDBACK_TYPE_LABEL[feedback.feedback_type]}
          </Badge>
          <Badge variant="neutral">{FEEDBACK_CATEGORY_LABEL[feedback.category_code]}</Badge>
          <FeedbackStatusBadge status={feedback.status} />
        </View>

        <Text className="text-[15px] font-extrabold text-text mb-2">{feedback.title}</Text>
        <Text className="text-[13px] text-text bg-bg rounded-lg p-3 mb-3">
          {feedback.content}
        </Text>

        <View className="bg-bg rounded-lg p-3 gap-1.5 mb-3">
          <Row label="버전" value={feedback.app_version ?? '-'} />
          <Row label="디바이스" value={feedback.device_info ?? '-'} />
          <Row label="네트워크" value={feedback.network_type ?? '-'} />
          <Row label="작성자" value={feedback.reporter_nickname ?? '-'} />
          <Row label="접수" value={formatDateTime(feedback.create_time)} />
        </View>

        <Text className="text-[12px] font-bold text-text-sub mb-1.5">처리 상태</Text>
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {Object.values(FEEDBACK_STATUS).map((s) => (
            <Pressable
              key={s}
              onPress={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 border ${
                status === s ? 'bg-point border-point' : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-[10.5px] font-extrabold ${
                  status === s ? 'text-white' : 'text-text-sub'
                }`}
              >
                {FEEDBACK_STATUS_LABEL[s]}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-[12px] font-bold text-text-sub mb-1.5">유저에게 보낼 답변</Text>
        <TextInput
          value={reply}
          onChangeText={setReply}
          multiline
          placeholder="답변을 입력하면 유저에게 노출됩니다"
          placeholderTextColor="#B0A9BA"
          className="border border-border rounded-md px-3 py-2 text-[13px] text-text bg-bg min-h-[70px] mb-3"
        />

        <Text className="text-[12px] font-bold text-text-sub mb-1.5">내부 메모 (비공개)</Text>
        <TextInput
          value={memo}
          onChangeText={setMemo}
          multiline
          placeholder="담당자 인계, 우선순위 등"
          placeholderTextColor="#B0A9BA"
          className="border border-border rounded-md px-3 py-2 text-[13px] text-text bg-bg min-h-[60px] mb-4"
        />

        <Pressable
          onPress={handleSubmit}
          disabled={updateMutation.isPending}
          className={`rounded-lg py-3 items-center ${
            updateMutation.isPending ? 'bg-point-softer' : 'bg-point'
          }`}
        >
          <Text className="text-white font-extrabold text-[13px]">
            {updateMutation.isPending ? '저장 중...' : '저장'}
          </Text>
        </Pressable>
        <View className="h-4" />
      </ScrollView>
    </BottomSheet>
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
