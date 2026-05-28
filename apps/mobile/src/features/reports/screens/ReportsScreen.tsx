import { useState } from 'react';
import { View, Text, Pressable, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronRight, ExternalLink, ShieldCheck } from 'lucide-react-native';
import {
  useReportsGrouped,
  REPORT_TARGET_TYPE_LABEL,
  REPORT_STATUS_LABEL,
  formatDateTime,
  formatFromNow,
  type ReportGroup,
  type ReportStatus,
} from '@ef-fe-admin/shared';
import FilterChips from '../../../components/ui/FilterChips';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';

function groupKey(g: ReportGroup) {
  return `${g.target_type}-${g.target_id}`;
}

// 어드민은 모두 BIGINT id 기반 — uuid 사용 안 함.
function getContentLink(g: ReportGroup): { href: string; label: string } | null {
  if (g.target_type === 'PROFILE') {
    const userId = g.target_user_id ?? g.target_id;
    return { href: `/(tabs)/users/${userId}`, label: '프로필' };
  }
  if (g.target_type === 'POST_IT')
    return { href: `/(tabs)/post-its`, label: '포스트잇' };
  if (g.target_type === 'BAL_COMMENT') {
    // 모바일에는 게임별 댓글 페이지가 없으므로 목록으로만 점프 (웹은 /balance/:id/comments 지원).
    return { href: `/(tabs)/balance`, label: '게임 댓글 목록' };
  }
  return null;
}

function getTargetUserLink(g: ReportGroup): string | null {
  if (g.target_type === 'PROFILE') return null;
  return g.target_user_id != null ? `/(tabs)/users/${g.target_user_id}` : null;
}

function resolveGroupOutcome(g: ReportGroup):
  | { kind: 'pending'; count: number }
  | { kind: 'suspended'; suspensionId: number }
  | { kind: 'dismissed' }
  | { kind: 'processed' } {
  if (g.pending_count > 0) return { kind: 'pending', count: g.pending_count };
  // 평탄화 — 같은 그룹의 모든 PROCESSED 신고에 동일 suspension_id 부여됨.
  const processed = g.reports.find(
    (r) => r.status === 'PROCESSED' && r.suspension_id != null,
  );
  if (processed) {
    return { kind: 'suspended', suspensionId: processed.suspension_id! };
  }
  const anyDismissed = g.reports.some((r) => r.status === 'DISMISSED');
  if (anyDismissed && !g.reports.some((r) => r.status === 'PROCESSED'))
    return { kind: 'dismissed' };
  return { kind: 'processed' };
}

export default function ReportsScreen() {
  const router = useRouter();
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const { data, isLoading } = useReportsGrouped({ status, page: 0, size: 20 });

  const toggle = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <View className="flex-1 bg-bg">
      <View className="px-4 pt-4 pb-2">
        <FilterChips<ReportStatus>
          value={status}
          onChange={(v) => {
            setStatus(v);
            setExpanded(new Set());
          }}
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
        <FlatList<ReportGroup>
          data={data?.content ?? []}
          keyExtractor={(g) => groupKey(g)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={<EmptyState message="신고 그룹이 없습니다" />}
          renderItem={({ item }) => {
            const key = groupKey(item);
            const isOpen = expanded.has(key);
            const reps = item.reports;
            const first = reps[0];
            const contentLink = getContentLink(item);
            const targetUserLink = getTargetUserLink(item);
            const outcome = resolveGroupOutcome(item);
            return (
              <View className="bg-surface border border-border rounded-xl overflow-hidden">
                <Pressable
                  onPress={() => toggle(key)}
                  className="px-4 py-3 flex-row items-center gap-2"
                >
                  <View
                    style={{
                      transform: [{ rotate: isOpen ? '90deg' : '0deg' }],
                    }}
                  >
                    <ChevronRight size={14} color="#9C95A8" />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant="point">
                        {REPORT_TARGET_TYPE_LABEL[item.target_type]}
                      </Badge>
                      {outcome.kind === 'pending' && (
                        <Badge variant="warn">대기 {outcome.count}</Badge>
                      )}
                      {outcome.kind === 'dismissed' && (
                        <Badge variant="neutral">기각됨</Badge>
                      )}
                      {outcome.kind === 'processed' && (
                        <Badge variant="active">처리 완료</Badge>
                      )}
                      <Badge variant="neutral">총 {item.total_count}건</Badge>
                    </View>
                    <Text
                      className="text-[13px] font-extrabold text-text"
                      numberOfLines={1}
                    >
                      {item.target_user_nickname ?? `target #${item.target_id}`}
                    </Text>
                    {item.target_preview && (
                      <Text
                        className="text-[11px] text-text-sub mt-0.5"
                        numberOfLines={1}
                      >
                        {item.target_preview}
                      </Text>
                    )}
                    <Text className="text-[10px] text-text-soft mt-1">
                      첫 신고 · {formatFromNow(item.first_reported_at)}
                      {item.total_count > 1
                        ? `  ·  마지막 · ${formatFromNow(item.last_reported_at)}`
                        : ''}
                    </Text>

                    {(contentLink || targetUserLink || outcome.kind === 'suspended') && (
                      <View className="flex-row items-center gap-1.5 mt-2 flex-wrap">
                        {contentLink && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(contentLink.href as never);
                            }}
                            className="flex-row items-center gap-1 border border-border rounded-md px-2 py-1"
                          >
                            <ExternalLink size={10} color="#6B6573" />
                            <Text className="text-[10.5px] font-bold text-text-sub">
                              {contentLink.label}
                            </Text>
                          </Pressable>
                        )}
                        {targetUserLink && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(targetUserLink as never);
                            }}
                            className="flex-row items-center gap-1 border border-border rounded-md px-2 py-1"
                          >
                            <ExternalLink size={10} color="#6B6573" />
                            <Text className="text-[10.5px] font-bold text-text-sub">
                              작성자 프로필
                            </Text>
                          </Pressable>
                        )}
                        {outcome.kind === 'suspended' && (
                          <Pressable
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(
                                `/(tabs)/suspensions/${outcome.suspensionId}` as never
                              );
                            }}
                            className="flex-row items-center gap-1 bg-success-soft rounded-md px-2 py-1"
                          >
                            <ShieldCheck size={10} color="#2F6B4F" />
                            <Text className="text-[10.5px] font-extrabold text-success-dark">
                              제재 #{outcome.suspensionId}
                            </Text>
                          </Pressable>
                        )}
                      </View>
                    )}
                  </View>
                </Pressable>

                {isOpen && (
                  <View className="border-t border-border bg-bg/40">
                    {item.target_preview && (
                      <View className="px-4 py-3 border-b border-border bg-surface">
                        <Text className="text-[10px] font-extrabold text-text-soft mb-1.5 tracking-wider">
                          신고된 {REPORT_TARGET_TYPE_LABEL[item.target_type]} 내용
                        </Text>
                        <View className="bg-bg rounded-md px-3 py-2 border border-border">
                          <Text className="text-[12.5px] text-text leading-5">
                            {item.target_preview}
                          </Text>
                        </View>
                      </View>
                    )}
                    {reps.map((r, idx) => {
                      const isFirst = r.id === first.id;
                      return (
                        <Pressable
                          key={r.id}
                          onPress={() =>
                            router.push(`/(tabs)/reports/${r.id}` as never)
                          }
                          className={`px-4 py-3 ${
                            idx < reps.length - 1 ? 'border-b border-border' : ''
                          }`}
                        >
                          <View className="flex-row items-center justify-between mb-1">
                            <View className="flex-row items-center gap-1.5 flex-1">
                              <Text className="text-[10px] text-text-soft w-[14px]">
                                {idx + 1}
                              </Text>
                              <Text
                                className="text-[12.5px] font-bold text-text"
                                numberOfLines={1}
                              >
                                @{r.reporter_nickname ?? '(탈퇴)'}
                              </Text>
                              {isFirst && (
                                <Badge variant="point">대표 후보</Badge>
                              )}
                            </View>
                            <Badge
                              variant={
                                r.status === 'PENDING'
                                  ? 'warn'
                                  : r.status === 'PROCESSED'
                                  ? 'active'
                                  : 'neutral'
                              }
                            >
                              {REPORT_STATUS_LABEL[r.status]}
                            </Badge>
                          </View>
                          <Text
                            className="text-[11.5px] text-text-sub pl-[20px]"
                            numberOfLines={1}
                          >
                            {r.reason ?? '-'}
                          </Text>
                          <Text className="text-[10px] text-text-soft pl-[20px] mt-0.5">
                            {formatDateTime(r.create_time)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
