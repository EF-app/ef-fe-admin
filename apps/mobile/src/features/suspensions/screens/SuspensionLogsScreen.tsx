import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator, TextInput } from 'react-native';
import {
  useSuspensionLogs,
  useLiftSuspensionMutation,
  formatDateTime,
  SUSPENSION_TYPE_LABEL,
  type SuspensionType,
  type SuspensionLog,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import BottomSheet from '../../../components/ui/BottomSheet';

type StateFilter = 'ALL' | 'ACTIVE' | 'LIFTED';

export default function SuspensionLogsScreen() {
  const [type, setType] = useState<SuspensionType | 'ALL'>('ALL');
  const [state, setState] = useState<StateFilter>('ALL');
  const [selected, setSelected] = useState<SuspensionLog | null>(null);

  const { data, isLoading } = useSuspensionLogs({
    suspension_type: type === 'ALL' ? undefined : type,
    is_lifted: state === 'ALL' ? undefined : state === 'LIFTED',
    page: 0,
    size: 20,
  });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<SuspensionType | 'ALL'>
          value={type}
          onChange={setType}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'WARNING', label: '경고' },
            { value: 'TEMPORARY', label: '일시정지' },
            { value: 'PERMANENT', label: '영구정지' },
          ]}
        />
      </View>
      <View className="px-4 pb-2">
        <FilterChips<StateFilter>
          value={state}
          onChange={setState}
          options={[
            { value: 'ALL', label: '전체 상태' },
            { value: 'ACTIVE', label: '진행 중' },
            { value: 'LIFTED', label: '해제됨' },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<SuspensionLog>
          data={data?.content ?? []}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="제재 이력이 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-[14px] font-extrabold text-text">
                  {item.user_nickname ?? '-'}
                </Text>
                <Badge
                  variant={
                    !item.is_lifted
                      ? 'warn'
                      : item.lifted_by_admin_id == null
                        ? 'neutral'
                        : 'active'
                  }
                >
                  {!item.is_lifted
                    ? '진행 중'
                    : item.lifted_by_admin_id == null
                      ? '자동 만료'
                      : '수동 해제'}
                </Badge>
              </View>
              <View className="flex-row items-center gap-2 mb-1">
                <Badge
                  variant={
                    item.suspension_type === 'WARNING'
                      ? 'warn'
                      : item.suspension_type === 'TEMPORARY'
                      ? 'point'
                      : 'danger'
                  }
                >
                  {SUSPENSION_TYPE_LABEL[item.suspension_type]}
                </Badge>
                <Text className="text-[10.5px] text-text-soft">
                  {formatDateTime(item.starts_at)}
                </Text>
              </View>
              <Text className="text-[12px] text-text-sub" numberOfLines={2}>
                {item.reason}
              </Text>
              <Text className="text-[10.5px] text-text-soft mt-1">
                {item.ends_at ? `~ ${formatDateTime(item.ends_at)}` : '영구'} · 처리:{' '}
                {item.created_by_admin_name ?? '-'}
              </Text>
            </Pressable>
          )}
        />
      )}

      <SuspensionDetailSheet
        log={selected}
        visible={!!selected}
        onClose={() => setSelected(null)}
      />
    </View>
  );
}

function SuspensionDetailSheet({
  log,
  visible,
  onClose,
}: {
  log: SuspensionLog | null;
  visible: boolean;
  onClose: () => void;
}) {
  const [liftReason, setLiftReason] = useState('');
  const liftMutation = useLiftSuspensionMutation({
    onSuccess: () => {
      setLiftReason('');
      onClose();
    },
  });

  if (!log) return null;

  const onLift = () => {
    if (!liftReason.trim()) return;
    liftMutation.mutate({ id: log.id, payload: { lifted_reason: liftReason.trim() } });
  };

  return (
    <BottomSheet visible={visible} title="제재 상세" onClose={onClose}>
      <View className="bg-bg rounded-lg p-4 gap-2 mb-4">
        <Row label="대상 유저" value={log.user_nickname ?? '-'} />
        <Row label="유형" value={SUSPENSION_TYPE_LABEL[log.suspension_type]} />
        <Row label="시작" value={formatDateTime(log.starts_at)} />
        <Row label="종료" value={log.ends_at ? formatDateTime(log.ends_at) : '영구'} />
        <Row label="처리 관리자" value={log.created_by_admin_name ?? '-'} />
        <Row
          label="상태"
          value={
            !log.is_lifted
              ? '진행 중'
              : log.lifted_by_admin_id == null
                ? '자동 만료'
                : '수동 해제'
          }
        />
      </View>

      <Text className="text-[12px] font-bold text-text-sub mb-1.5">제재 사유</Text>
      <Text className="text-[12.5px] text-text bg-bg rounded-lg p-3 mb-4">
        {log.reason}
      </Text>

      {log.is_lifted ? (
        <View className="bg-bg rounded-lg p-3 gap-1">
          <Text className="text-[11px] font-extrabold text-text-sub">
            {log.lifted_by_admin_id == null ? '자동 만료 정보' : '수동 해제 정보'}
          </Text>
          <Text className="text-[11.5px] text-text-sub">
            {log.lifted_at ? formatDateTime(log.lifted_at) : '-'}
            {log.lifted_by_admin_id != null && ` · ${log.lifted_by_admin_name ?? '-'}`}
          </Text>
          {log.lifted_by_admin_id == null ? (
            <Text className="text-[11.5px] text-text-soft">
              ends_at 도달로 배치가 자동 해제했습니다.
            </Text>
          ) : (
            log.lifted_reason && (
              <Text className="text-[11.5px] text-text-sub">사유: {log.lifted_reason}</Text>
            )
          )}
        </View>
      ) : (
        <>
          <Text className="text-[12px] font-bold text-text-sub mb-1.5">해제 사유</Text>
          <TextInput
            value={liftReason}
            onChangeText={setLiftReason}
            multiline
            placeholder="이의 신청 수용, 오인 신고 확인 등"
            placeholderTextColor="#B0A9BA"
            className="border border-border rounded-md px-3 py-2 text-[13px] text-text bg-bg min-h-[70px] mb-3"
          />
          <Pressable
            onPress={onLift}
            disabled={liftMutation.isPending || !liftReason.trim()}
            className={`rounded-lg py-3 items-center ${
              liftMutation.isPending || !liftReason.trim() ? 'bg-point-softer' : 'bg-point'
            }`}
          >
            <Text className="text-white font-extrabold text-[13px]">
              {liftMutation.isPending ? '처리 중...' : '제재 해제'}
            </Text>
          </Pressable>
        </>
      )}
      <View className="h-4" />
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
