import { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import {
  useUserDetail,
  useSuspendUserMutation,
  useLiftSuspensionMutation,
  USER_STATUS_LABEL,
  SUSPENSION_TYPE_LABEL,
  POST_IT_CATEGORY_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  REPORT_STATUS_LABEL,
  formatDate,
  formatDateTime,
  formatCurrency,
  calcSuspensionEndsAt,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared';
import type {
  SuspensionType,
  PostItCategory,
  ReportTargetType,
  ReportStatus,
} from '@ef-fe-admin/shared';
import Badge from '../../../components/ui/Badge';
import EmptyState from '../../../components/ui/EmptyState';

export default function UserDetailScreen() {
  const { uuid } = useLocalSearchParams<{ uuid: string }>();
  const router = useRouter();
  const { data: user } = useUserDetail(uuid);

  const [type, setType] = useState<SuspensionType>('WARNING');
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [liftReason, setLiftReason] = useState('');
  const [mode, setMode] = useState<'idle' | 'suspend' | 'lift'>('idle');

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setReason('');
      setMode('idle');
    },
  });
  const liftMutation = useLiftSuspensionMutation({
    onSuccess: () => {
      setLiftReason('');
      setMode('idle');
    },
  });

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <Text className="text-[12px] text-text-soft">불러오는 중...</Text>
      </View>
    );
  }

  const onSuspend = () => {
    if (!reason.trim()) return;
    suspendMutation.mutate({
      uuid: user.uuid,
      payload: {
        suspension_type: type,
        reason: reason.trim(),
        ends_at: calcSuspensionEndsAt(type, days),
      },
    });
  };

  const onLift = () => {
    if (!user.active_suspension || !liftReason.trim()) return;
    liftMutation.mutate({
      id: user.active_suspension.id,
      payload: { lifted_reason: liftReason.trim() },
    });
  };

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16, paddingBottom: 64 }}>
      <Pressable onPress={() => router.back()} className="flex-row items-center gap-1 mb-3">
        <ArrowLeft size={14} color="#6B6573" />
        <Text className="text-[12px] text-text-sub font-bold">유저 목록</Text>
      </Pressable>

      {/* 헤더 */}
      <View className="bg-surface border border-border rounded-xl p-5 mb-3">
        <View className="flex-row items-center gap-3">
          <View className="w-16 h-16 rounded-full bg-point items-center justify-center">
            <Text className="text-white font-black text-[22px]">
              {user.nickname?.[0] ?? '?'}
            </Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2 mb-1 flex-wrap">
              <Text className="text-[16px] font-extrabold text-text">{user.nickname}</Text>
              <Badge
                variant={
                  user.status === 'ACTIVE'
                    ? 'active'
                    : user.status === 'WARNING'
                    ? 'warn'
                    : 'danger'
                }
              >
                {USER_STATUS_LABEL[user.status]}
              </Badge>
            </View>
            <Text className="text-[11px] text-text-soft">
              @{user.login_id} · {user.age}세
            </Text>
            <Text className="text-[10.5px] text-text-soft mt-0.5">UUID: {user.uuid}</Text>
          </View>
        </View>
      </View>

      {/* 활성 제재 */}
      {user.active_suspension && (
        <View className="bg-danger-soft border border-danger rounded-xl p-3 mb-3">
          <Text className="text-[12px] font-extrabold text-danger">
            현재 제재: {SUSPENSION_TYPE_LABEL[user.active_suspension.suspension_type]}
          </Text>
          <Text className="text-[11px] text-text-sub mt-1">
            사유: {user.active_suspension.reason}
          </Text>
          <Text className="text-[10.5px] text-text-sub mt-0.5">
            {formatDateTime(user.active_suspension.starts_at)} →{' '}
            {user.active_suspension.ends_at
              ? formatDateTime(user.active_suspension.ends_at)
              : '영구'}
          </Text>
        </View>
      )}

      {/* 액션 버튼 */}
      <View className="flex-row gap-2 mb-3">
        {!user.active_suspension && mode !== 'suspend' && (
          <Pressable
            onPress={() => setMode('suspend')}
            className="flex-1 bg-danger rounded-md py-2.5 items-center"
          >
            <Text className="text-white text-[12px] font-extrabold">제재 발동</Text>
          </Pressable>
        )}
        {user.active_suspension && mode !== 'lift' && (
          <Pressable
            onPress={() => setMode('lift')}
            className="flex-1 bg-surface border border-border rounded-md py-2.5 items-center"
          >
            <Text className="text-text-sub text-[12px] font-extrabold">제재 해제</Text>
          </Pressable>
        )}
      </View>

      {/* 제재 발동 패널 */}
      {mode === 'suspend' && (
        <View className="bg-surface border border-border rounded-xl p-4 mb-3">
          <Text className="text-[13px] font-extrabold text-text mb-3">제재 발동</Text>
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
          <TextInput
            value={reason}
            onChangeText={setReason}
            multiline
            placeholder="사유 (유저에게 통보됨)"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-md px-3 py-2 text-[13px] text-text bg-bg min-h-[70px] mb-3"
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setMode('idle')}
              className="flex-1 bg-surface border border-border rounded-md py-2.5 items-center"
            >
              <Text className="text-text-sub text-[12px] font-extrabold">취소</Text>
            </Pressable>
            <Pressable
              onPress={onSuspend}
              disabled={suspendMutation.isPending || !reason.trim()}
              className={`flex-1 rounded-md py-2.5 items-center ${
                suspendMutation.isPending || !reason.trim() ? 'bg-point-softer' : 'bg-danger'
              }`}
            >
              <Text className="text-white text-[12px] font-extrabold">
                {suspendMutation.isPending ? '처리 중...' : '제재 발동'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 제재 해제 패널 */}
      {mode === 'lift' && user.active_suspension && (
        <View className="bg-surface border border-border rounded-xl p-4 mb-3">
          <Text className="text-[13px] font-extrabold text-text mb-3">제재 해제</Text>
          <TextInput
            value={liftReason}
            onChangeText={setLiftReason}
            multiline
            placeholder="해제 사유 (이의 신청 수용 등)"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-md px-3 py-2 text-[13px] text-text bg-bg min-h-[70px] mb-3"
          />
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setMode('idle')}
              className="flex-1 bg-surface border border-border rounded-md py-2.5 items-center"
            >
              <Text className="text-text-sub text-[12px] font-extrabold">취소</Text>
            </Pressable>
            <Pressable
              onPress={onLift}
              disabled={liftMutation.isPending || !liftReason.trim()}
              className={`flex-1 rounded-md py-2.5 items-center ${
                liftMutation.isPending || !liftReason.trim() ? 'bg-point-softer' : 'bg-point'
              }`}
            >
              <Text className="text-white text-[12px] font-extrabold">
                {liftMutation.isPending ? '처리 중...' : '해제'}
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* 통계 */}
      <View className="flex-row gap-2 mb-3">
        <StatBox label="총 결제" value={formatCurrency(user.payment_total ?? 0)} />
        <StatBox label="신고 받은" value={`${user.report_count ?? 0}건`} tone="danger" />
      </View>
      <View className="flex-row gap-2 mb-4">
        <StatBox label="활성 매칭" value={`${user.recent_matches?.filter((m) => m.is_active).length ?? 0}건`} />
        <StatBox label="차단" value={`${user.blocks?.length ?? 0}명`} />
      </View>

      {/* 기본 정보 */}
      <SectionTitle>기본 정보</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-4 mb-4">
        <InfoRow label="전화번호" value={user.phone} />
        <InfoRow label="직업" value={user.job ?? '-'} />
        <InfoRow label="가입일" value={formatDate(user.create_time)} />
        <InfoRow label="최근 접속" value={formatDateTime(user.last_login_time)} />
        <InfoRow
          label="본인 인증"
          value={user.identity_verified_at ? formatDate(user.identity_verified_at) : '미인증'}
        />
      </View>

      {/* 제재 이력 */}
      <SectionTitle>제재 이력 ({user.suspensions?.length ?? 0})</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-3 mb-4">
        {!user.suspensions?.length ? (
          <EmptyState message="제재 이력이 없습니다" />
        ) : (
          user.suspensions.map((s, idx) => (
            <View
              key={s.id}
              className={`py-2 ${idx < user.suspensions!.length - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-1">
                <Text className="text-[12.5px] font-extrabold text-text">
                  {SUSPENSION_TYPE_LABEL[s.suspension_type]}
                </Text>
                <Badge variant={s.is_lifted ? 'active' : 'warn'}>
                  {s.is_lifted ? '해제됨' : '진행 중'}
                </Badge>
              </View>
              <Text className="text-[11.5px] text-text-sub" numberOfLines={2}>
                {s.reason}
              </Text>
              <Text className="text-[10px] text-text-soft mt-1">
                {formatDateTime(s.starts_at)} →{' '}
                {s.ends_at ? formatDateTime(s.ends_at) : '영구'}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 매칭 이력 */}
      <SectionTitle>매칭 이력 ({user.recent_matches?.length ?? 0})</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-3 mb-4">
        {!user.recent_matches?.length ? (
          <EmptyState message="매칭 이력이 없습니다" />
        ) : (
          user.recent_matches.map((m, idx) => (
            <View
              key={m.id}
              className={`py-2 ${idx < user.recent_matches!.length - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-[12.5px] font-extrabold text-text">
                  {m.partner_nickname}
                </Text>
                <Badge variant={m.is_active ? 'active' : 'neutral'}>
                  {m.is_active ? '활성' : '종료'}
                </Badge>
              </View>
              <Text className="text-[10.5px] text-text-soft mt-1">
                매칭 {formatDateTime(m.matched_at)} · 메시지 {m.message_count}개
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 받은 신고 */}
      <SectionTitle>받은 신고 ({user.recent_reports?.length ?? 0})</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-3 mb-4">
        {!user.recent_reports?.length ? (
          <EmptyState message="받은 신고가 없습니다" />
        ) : (
          user.recent_reports.map((r, idx) => (
            <View
              key={r.id}
              className={`py-2 ${idx < user.recent_reports!.length - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-0.5">
                <Text className="text-[12px] font-extrabold text-text">
                  {REPORT_TARGET_TYPE_LABEL[r.target_type as ReportTargetType] ?? r.target_type}
                </Text>
                <Text className="text-[10px] text-text-soft">
                  {REPORT_STATUS_LABEL[r.status as ReportStatus] ?? r.status}
                </Text>
              </View>
              <Text className="text-[11.5px] text-text-sub" numberOfLines={2}>
                {r.reason ?? '-'}
              </Text>
              <Text className="text-[10px] text-text-soft mt-0.5">
                {formatDateTime(r.create_time)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 작성 글 */}
      <SectionTitle>작성한 포스트잇 ({user.recent_post_its?.length ?? 0})</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-3 mb-4">
        {!user.recent_post_its?.length ? (
          <EmptyState message="작성한 글이 없습니다" />
        ) : (
          user.recent_post_its.map((p, idx) => (
            <View
              key={p.uuid}
              className={`py-2 ${idx < user.recent_post_its!.length - 1 ? 'border-b border-border' : ''}`}
            >
              <View className="flex-row items-center gap-2 mb-1 flex-wrap">
                <Badge variant="point">
                  {POST_IT_CATEGORY_LABEL[p.category_code as PostItCategory] ?? p.category_code}
                </Badge>
                {p.is_hidden && <Badge variant="danger">숨김</Badge>}
                {p.is_deleted && <Badge variant="neutral">삭제</Badge>}
              </View>
              <Text className="text-[12.5px] text-text" numberOfLines={2}>
                {p.content_preview}
              </Text>
              <Text className="text-[10px] text-text-soft mt-1">
                {formatDateTime(p.create_time)} · 답글 {p.reply_count} · 신고 {p.report_count}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* 차단 */}
      <SectionTitle>차단한 유저 ({user.blocks?.length ?? 0})</SectionTitle>
      <View className="bg-surface border border-border rounded-xl p-3 mb-4">
        {!user.blocks?.length ? (
          <EmptyState message="차단한 유저가 없습니다" />
        ) : (
          user.blocks.map((b, idx) => (
            <View
              key={b.id}
              className={`py-2 ${idx < user.blocks!.length - 1 ? 'border-b border-border' : ''}`}
            >
              <Text className="text-[12.5px] font-extrabold text-text">
                {b.blocked_user_nickname}
              </Text>
              <Text className="text-[10.5px] text-text-soft mt-0.5">
                {formatDateTime(b.blocked_at)}
                {b.reason ? ` · ${b.reason}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <View className="flex-1 bg-surface border border-border rounded-xl p-3">
      <Text className="text-[10.5px] text-text-soft font-bold">{label}</Text>
      <Text
        className={`text-[16px] font-extrabold mt-1 ${
          tone === 'danger' ? 'text-danger' : 'text-text'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[13px] font-extrabold text-text-sub mb-2 mt-2">{children}</Text>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <Text className="text-[11px] text-text-soft">{label}</Text>
      <Text className="text-[12px] font-bold text-text">{value}</Text>
    </View>
  );
}
