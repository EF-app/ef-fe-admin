import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  useReportDetail,
  useProcessReportMutation,
  useDismissReportMutation,
  REPORT_TARGET_TYPE_LABEL,
  REPORT_STATUS_LABEL,
  SUSPENSION_TYPE_LABEL,
  calcSuspensionEndsAt,
  TEMPORARY_DURATION_OPTIONS,
  formatDateTime,
  type SuspensionType,
} from '@ef-fe-admin/shared';
import Badge from '../../../components/ui/Badge';

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const reportId = id ? Number(id) : undefined;
  const { data: report } = useReportDetail(reportId);

  const [mode, setMode] = useState<'process' | 'dismiss'>('process');
  const [type, setType] = useState<SuspensionType>('WARNING');
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');

  const process = useProcessReportMutation({ onSuccess: () => router.back() });
  const dismiss = useDismissReportMutation({ onSuccess: () => router.back() });

  if (!report) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[12px] text-text-soft">불러오는 중...</Text>
      </View>
    );
  }

  const onSubmit = () => {
    if (mode === 'process') {
      // 제재 부과는 별도 흐름(유저 상세 화면) 에서. 여기선 "제재 없이 처리" 로 PROCESSED 마킹만.
      process.mutate({ id: report.id, payload: { suspension_id: null } });
    } else {
      dismiss.mutate({ id: report.id });
    }
  };

  const pending = process.isPending || dismiss.isPending;
  const isPending = report.status === 'PENDING';

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-3">
        <ArrowLeft size={14} color="#6B6573" />
        <Text className="text-[12px] text-text-sub font-bold">신고 목록</Text>
      </Pressable>

      <View className="bg-surface border border-border rounded-xl p-4 mb-4">
        <View className="flex-row items-center justify-between mb-3">
          <Badge variant="point">{REPORT_TARGET_TYPE_LABEL[report.target_type]}</Badge>
          <Badge
            variant={
              report.status === 'PENDING'
                ? 'warn'
                : report.status === 'PROCESSED'
                ? 'active'
                : 'neutral'
            }
          >
            {REPORT_STATUS_LABEL[report.status]}
          </Badge>
        </View>

        <View className="bg-bg rounded-lg p-3 mb-3">
          <Text className="text-[10.5px] text-text-soft font-bold mb-1">신고 사유</Text>
          <Text className="text-[13px] text-text">{report.reason ?? '(내용 없음)'}</Text>
        </View>

        {report.target_preview && (
          <View className="bg-bg rounded-lg p-3 mb-3">
            <Text className="text-[10.5px] text-text-soft font-bold mb-1">대상 컨텐츠</Text>
            <Text className="text-[13px] text-text">{report.target_preview}</Text>
          </View>
        )}

        <View className="flex-row items-center justify-between">
          <Text className="text-[11px] text-text-soft">
            @{report.reporter_nickname ?? '-'} → @{report.target_user_nickname ?? '-'}
          </Text>
          <Text className="text-[10.5px] text-text-soft">
            {formatDateTime(report.create_time)}
          </Text>
        </View>

        {report.admin_processed_at && (
          <Text className="text-[10.5px] text-text-soft mt-2">
            처리: {formatDateTime(report.admin_processed_at)}
          </Text>
        )}
      </View>

      {!isPending ? (
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-[12.5px] text-text-soft text-center">
            이미 {REPORT_STATUS_LABEL[report.status]} 상태입니다.
          </Text>
        </View>
      ) : (
        <View className="bg-surface border border-border rounded-xl p-4">
          <Text className="text-[14px] font-extrabold text-text mb-3">처리</Text>

          <View className="flex-row gap-2 mb-4">
            <Pressable
              onPress={() => setMode('process')}
              className={`flex-1 rounded-md py-2 items-center border ${
                mode === 'process' ? 'bg-danger border-danger' : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-[12px] font-extrabold ${
                  mode === 'process' ? 'text-white' : 'text-text-sub'
                }`}
              >
                제재 처리
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('dismiss')}
              className={`flex-1 rounded-md py-2 items-center border ${
                mode === 'dismiss' ? 'bg-text-sub border-text-sub' : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`text-[12px] font-extrabold ${
                  mode === 'dismiss' ? 'text-white' : 'text-text-sub'
                }`}
              >
                기각
              </Text>
            </Pressable>
          </View>

          {mode === 'process' && (
            <>
              <Text className="text-[12px] font-bold text-text-sub mb-1.5">제재 유형</Text>
              <View className="flex-row gap-2 mb-3">
                {(['WARNING', 'TEMPORARY', 'PERMANENT'] as SuspensionType[]).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    className={`flex-1 rounded-md py-2 items-center border ${
                      type === t ? 'bg-point border-point' : 'bg-surface border-border'
                    }`}
                  >
                    <Text
                      className={`text-[10.5px] font-extrabold ${
                        type === t ? 'text-white' : 'text-text-sub'
                      }`}
                    >
                      {SUSPENSION_TYPE_LABEL[t]}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {type === 'TEMPORARY' && (
                <View className="flex-row gap-2 mb-3">
                  {TEMPORARY_DURATION_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.days}
                      onPress={() => setDays(opt.days)}
                      className={`flex-1 rounded-md py-2 items-center border ${
                        days === opt.days
                          ? 'bg-point-softer border-point'
                          : 'bg-surface border-border'
                      }`}
                    >
                      <Text className="text-[10.5px] font-bold text-text-sub">{opt.label}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </>
          )}

          <Text className="text-[12px] font-bold text-text-sub mb-1.5">
            {mode === 'process' ? '제재 사유' : '기각 사유'}
          </Text>
          <TextInput
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={3}
            placeholder="최소 5자"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-lg px-3 py-2 text-[13px] text-text bg-bg mb-4 min-h-[80px]"
          />

          <Pressable
            onPress={onSubmit}
            disabled={pending || !reason.trim()}
            className={`rounded-lg py-3 items-center ${
              pending || !reason.trim()
                ? 'bg-point-softer'
                : mode === 'process'
                ? 'bg-danger'
                : 'bg-text-sub'
            }`}
          >
            <Text className="text-white font-extrabold text-[13px]">
              {pending ? '처리 중...' : mode === 'process' ? '제재 적용' : '기각'}
            </Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}
