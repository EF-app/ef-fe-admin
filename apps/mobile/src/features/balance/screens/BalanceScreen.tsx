import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { Plus } from 'lucide-react-native';
import {
  useBalApplies,
  useBalGames,
  useApproveBalApplyMutation,
  useHideBalGameMutation,
  usePublishBalGameMutation,
  useArchiveBalGameMutation,
  BAL_APPLY_STATUS_LABEL,
  BAL_GAME_STATUS_LABEL,
  BAL_CATEGORY_MAP,
  formatDate,
  formatNumber,
  type BalApply,
  type BalGame,
  type BalApplyStatus,
  type BalGameStatus,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import RejectApplySheet from '../../content/RejectApplySheet';
import BalGameComposeSheet from '../../content/BalGameComposeSheet';

type Tab = 'applies' | 'games';

export default function BalanceScreen() {
  const [tab, setTab] = useState<Tab>('applies');
  const [rejectTarget, setRejectTarget] = useState<BalApply | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<BalGame | null>(null);
  const [fromApply, setFromApply] = useState<BalApply | null>(null);

  const openCreate = () => {
    setEditTarget(null);
    setFromApply(null);
    setComposeOpen(true);
  };
  const openEdit = (g: BalGame) => {
    setEditTarget(g);
    setFromApply(null);
    setComposeOpen(true);
  };
  const openFromApply = (a: BalApply) => {
    setEditTarget(null);
    setFromApply(a);
    setComposeOpen(true);
  };
  const closeCompose = () => {
    setComposeOpen(false);
    setEditTarget(null);
    setFromApply(null);
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'applies', label: '밸런스 신청' },
            { value: 'games', label: '게시 게임' },
          ]}
        />
      </View>

      {tab === 'applies' ? (
        <AppliesTab onReject={setRejectTarget} onApproveEdit={openFromApply} />
      ) : (
        <GamesTab onCreate={openCreate} onEdit={openEdit} />
      )}

      <RejectApplySheet
        apply={rejectTarget}
        visible={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
      />
      {composeOpen && (
        <BalGameComposeSheet
          visible={composeOpen}
          onClose={closeCompose}
          editTarget={editTarget}
          fromApply={fromApply}
        />
      )}
    </View>
  );
}

function AppliesTab({
  onReject,
  onApproveEdit,
}: {
  onReject: (a: BalApply) => void;
  onApproveEdit: (a: BalApply) => void;
}) {
  const [status, setStatus] = useState<BalApplyStatus | 'ALL'>('PENDING');
  const params = status === 'ALL' ? {} : { status };
  const { data, isLoading } = useBalApplies({ ...params, page: 0, size: 20 });
  const approve = useApproveBalApplyMutation();

  return (
    <>
      <View className="px-4 pb-2">
        <FilterChips<BalApplyStatus | 'ALL'>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'PENDING', label: '대기' },
            { value: 'APPROVED', label: '승인' },
            { value: 'REJECTED', label: '반려' },
            { value: 'ALL', label: '전체' },
          ]}
        />
      </View>
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList<BalApply>
          data={data?.content ?? []}
          keyExtractor={(a) => String(a.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="신청 내역이 없습니다" />}
          renderItem={({ item }) => {
            const category = item.category_id ? BAL_CATEGORY_MAP[item.category_id] : null;
            return (
              <View className="bg-surface border border-border rounded-xl p-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[11px] text-text-soft">@{item.user_nickname ?? '-'}</Text>
                  <Badge
                    variant={
                      item.status === 'APPROVED'
                        ? 'active'
                        : item.status === 'REJECTED'
                        ? 'danger'
                        : 'warn'
                    }
                  >
                    {BAL_APPLY_STATUS_LABEL[item.status]}
                  </Badge>
                </View>
                {category && (
                  <Text className="text-[11px] text-text-sub mb-1">
                    {category.emoji} {category.name}
                  </Text>
                )}
                <View className="flex-row items-center gap-2 mb-1">
                  <View className="flex-1 bg-point-softer rounded-lg p-2.5">
                    <Text className="text-[9.5px] font-extrabold text-point-dark">A</Text>
                    <Text className="text-[12.5px] font-extrabold text-text" numberOfLines={2}>
                      {item.option_a}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-black text-text-soft">VS</Text>
                  <View className="flex-1 bg-point-softer rounded-lg p-2.5">
                    <Text className="text-[9.5px] font-extrabold text-point-dark">B</Text>
                    <Text className="text-[12.5px] font-extrabold text-text" numberOfLines={2}>
                      {item.option_b}
                    </Text>
                  </View>
                </View>
                {item.status === 'PENDING' && (
                  <View className="flex-row gap-2 mt-3">
                    <Pressable
                      onPress={() =>
                        approve.mutate(item.id, { onSuccess: () => onApproveEdit(item) })
                      }
                      className="flex-1 bg-success rounded-md py-2 items-center"
                    >
                      <Text className="text-white text-[12px] font-extrabold">승인 → 초안</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => onReject(item)}
                      className="flex-1 bg-surface border border-danger rounded-md py-2 items-center"
                    >
                      <Text className="text-danger text-[12px] font-extrabold">반려</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </>
  );
}

function GamesTab({
  onCreate,
  onEdit,
}: {
  onCreate: () => void;
  onEdit: (g: BalGame) => void;
}) {
  const [status, setStatus] = useState<BalGameStatus | 'ALL'>('ALL');
  const params = status === 'ALL' ? {} : { status };
  const { data, isLoading } = useBalGames({ ...params, page: 0, size: 20 });
  const hide = useHideBalGameMutation();
  const publish = usePublishBalGameMutation();
  const archive = useArchiveBalGameMutation();

  return (
    <>
      <View className="px-4 pb-2">
        <FilterChips<BalGameStatus | 'ALL'>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'DRAFT', label: '작성 중' },
            { value: 'SCHEDULED', label: '예약' },
            { value: 'PUBLISHED', label: '게시' },
            { value: 'HIDDEN', label: '숨김' },
            { value: 'ARCHIVED', label: '보관' },
          ]}
        />
      </View>
      <View className="px-4 pb-2 flex-row justify-end">
        <Pressable
          onPress={onCreate}
          className="flex-row items-center gap-1.5 bg-point rounded-md px-3 py-2"
        >
          <Plus size={14} color="#fff" />
          <Text className="text-white text-[12px] font-extrabold">새 게임</Text>
        </Pressable>
      </View>
      {isLoading ? (
        <Loading />
      ) : (
        <FlatList<BalGame>
          data={data?.content ?? []}
          keyExtractor={(g) => g.uuid}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="게임이 없습니다" />}
          renderItem={({ item }) => {
            const total = item.a_count + item.b_count;
            const aRatio = total > 0 ? Math.round((item.a_count / total) * 100) : 0;
            return (
              <Pressable
                onPress={() => onEdit(item)}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-[11px] text-text-sub flex-1 mr-2" numberOfLines={1}>
                    {item.description ?? '(설명 없음)'}
                  </Text>
                  <Badge
                    variant={
                      item.status === 'PUBLISHED'
                        ? 'active'
                        : item.status === 'SCHEDULED'
                        ? 'point'
                        : item.status === 'HIDDEN'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {BAL_GAME_STATUS_LABEL[item.status]}
                  </Badge>
                </View>
                <View className="flex-row items-center gap-2 mb-2">
                  <View className="flex-1">
                    <Text className="text-[12px] font-extrabold text-text" numberOfLines={1}>
                      A. {item.option_a}
                    </Text>
                    <Text className="text-[10.5px] text-text-soft mt-0.5">
                      {formatNumber(item.a_count)}표 ({aRatio}%)
                    </Text>
                  </View>
                  <Text className="text-[10px] font-black text-text-soft">VS</Text>
                  <View className="flex-1">
                    <Text className="text-[12px] font-extrabold text-text" numberOfLines={1}>
                      B. {item.option_b}
                    </Text>
                    <Text className="text-[10.5px] text-text-soft mt-0.5">
                      {formatNumber(item.b_count)}표 ({100 - aRatio}%)
                    </Text>
                  </View>
                </View>
                <Text className="text-[10.5px] text-text-soft">
                  댓글 {formatNumber(item.comment_count)} ·{' '}
                  {item.published_at
                    ? `게시 ${formatDate(item.published_at)}`
                    : `생성 ${formatDate(item.create_time)}`}
                </Text>
                <View className="flex-row gap-2 mt-3">
                  {(item.status === 'DRAFT' || item.status === 'HIDDEN') && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        publish.mutate(item.uuid);
                      }}
                      className="flex-1 bg-success rounded-md py-2 items-center"
                    >
                      <Text className="text-white text-[11.5px] font-extrabold">게시</Text>
                    </Pressable>
                  )}
                  {item.status === 'PUBLISHED' && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        hide.mutate(item.uuid);
                      }}
                      className="flex-1 bg-surface border border-warn rounded-md py-2 items-center"
                    >
                      <Text className="text-warn-dark text-[11.5px] font-extrabold">숨김</Text>
                    </Pressable>
                  )}
                  {(item.status === 'HIDDEN' || item.status === 'ARCHIVED') && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        archive.mutate(item.uuid);
                      }}
                      className="flex-1 bg-surface border border-border-strong rounded-md py-2 items-center"
                    >
                      <Text className="text-text-sub text-[11.5px] font-extrabold">종료</Text>
                    </Pressable>
                  )}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </>
  );
}

function Loading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#9686BF" />
    </View>
  );
}
