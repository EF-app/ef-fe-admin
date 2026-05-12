import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import {
  usePostIts,
  useHidePostItMutation,
  useRestorePostItMutation,
  formatFromNow,
  formatDateTime,
  POST_IT_CATEGORY_LABEL,
  type PostIt,
  type PostItCategory,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import BottomSheet from '../../../components/ui/BottomSheet';

type Visibility = 'ALL' | 'VISIBLE' | 'HIDDEN' | 'DELETED';

export default function PostItsScreen() {
  const [visibility, setVisibility] = useState<Visibility>('ALL');
  const [category, setCategory] = useState<PostItCategory | 'ALL'>('ALL');
  const [selected, setSelected] = useState<PostIt | null>(null);

  const { data, isLoading } = usePostIts({
    is_hidden:
      visibility === 'ALL' || visibility === 'DELETED' ? undefined : visibility === 'HIDDEN',
    is_deleted: visibility === 'DELETED' ? true : undefined,
    category_code: category === 'ALL' ? undefined : category,
    page: 0,
    size: 20,
  });

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<Visibility>
          value={visibility}
          onChange={setVisibility}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'VISIBLE', label: '게시 중' },
            { value: 'HIDDEN', label: '숨김' },
            { value: 'DELETED', label: '삭제됨' },
          ]}
        />
      </View>
      <View className="px-4 pb-2">
        <FilterChips<PostItCategory | 'ALL'>
          value={category}
          onChange={setCategory}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'LIGHTN', label: '⚡ 번개' },
            { value: 'DAILY', label: '💭 일상' },
            { value: 'LOVE', label: '💕 연애' },
            { value: 'INFO', label: '📌 정보' },
            { value: 'QUESTION', label: '❓ 질문' },
            { value: 'WORRY', label: '🌧 고민' },
            { value: 'FREE', label: '🗨 자유' },
          ]}
        />
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#9686BF" />
        </View>
      ) : (
        <FlatList<PostIt>
          data={data?.content ?? []}
          keyExtractor={(p) => p.uuid}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="조건에 맞는 글이 없습니다" />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => setSelected(item)}
              className="bg-surface border border-border rounded-xl p-4"
            >
              <View className="flex-row items-center gap-1.5 mb-2 flex-wrap">
                <Badge variant="point">{POST_IT_CATEGORY_LABEL[item.category_code]}</Badge>
                {item.is_anonymous && <Badge variant="neutral">익명</Badge>}
                {item.is_hidden && <Badge variant="danger">숨김</Badge>}
                {item.is_deleted && <Badge variant="neutral">삭제</Badge>}
                {item.report_count > 0 && (
                  <Badge variant="warn">신고 {item.report_count}</Badge>
                )}
              </View>
              <Text className="text-[13px] text-text mb-2" numberOfLines={3}>
                {item.content}
              </Text>
              <View className="flex-row items-center justify-between">
                <Text className="text-[10.5px] text-text-soft">
                  @{item.is_anonymous ? '익명' : item.user_nickname ?? '-'} · 답글 {item.reply_count}
                </Text>
                <Text className="text-[10.5px] text-text-soft">
                  {formatFromNow(item.create_time)}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}

      <PostItDetailSheet post={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </View>
  );
}

function PostItDetailSheet({
  post,
  visible,
  onClose,
}: {
  post: PostIt | null;
  visible: boolean;
  onClose: () => void;
}) {
  const hideMutation = useHidePostItMutation({ onSuccess: onClose });
  const restoreMutation = useRestorePostItMutation({ onSuccess: onClose });

  if (!post) return null;

  return (
    <BottomSheet visible={visible} title="포스트잇 상세" onClose={onClose}>
      <View className="flex-row items-center gap-1.5 mb-3 flex-wrap">
        <Badge variant="point">{POST_IT_CATEGORY_LABEL[post.category_code]}</Badge>
        {post.is_anonymous && <Badge variant="neutral">익명</Badge>}
        {post.is_hidden && <Badge variant="danger">숨김</Badge>}
        {post.is_deleted && <Badge variant="neutral">삭제</Badge>}
        {post.report_count > 0 && <Badge variant="warn">신고 {post.report_count}</Badge>}
      </View>

      <Text className="text-[13.5px] text-text bg-bg rounded-lg p-3 mb-3">{post.content}</Text>

      <View className="bg-bg rounded-lg p-3 gap-1.5 mb-4">
        <Row
          label="작성자"
          value={post.is_anonymous ? '익명' : post.user_nickname ?? '-'}
        />
        <Row label="작성" value={formatDateTime(post.create_time)} />
        <Row label="만료" value={formatDateTime(post.expires_at)} />
        <Row label="답글" value={`${post.reply_count}개`} />
        <Row label="신고" value={`${post.report_count}회`} />
      </View>

      {!post.is_deleted && (
        <View className="flex-row gap-2">
          {!post.is_hidden ? (
            <Pressable
              onPress={() => hideMutation.mutate({ uuid: post.uuid })}
              disabled={hideMutation.isPending}
              className="flex-1 bg-danger rounded-lg py-3 items-center"
            >
              <Text className="text-white font-extrabold text-[13px]">
                {hideMutation.isPending ? '처리 중...' : '숨김 처리'}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => restoreMutation.mutate(post.uuid)}
              disabled={restoreMutation.isPending}
              className="flex-1 bg-point rounded-lg py-3 items-center"
            >
              <Text className="text-white font-extrabold text-[13px]">
                {restoreMutation.isPending ? '처리 중...' : '숨김 해제'}
              </Text>
            </Pressable>
          )}
        </View>
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
