import { ScrollView, View, Text, Pressable } from 'react-native';
import { AlertTriangle, CreditCard, FileText, UserCheck } from 'lucide-react-native';
import {
  useDashboardMetrics,
  useDashboardAlerts,
  useNotices,
  formatDateTime,
  formatCurrency,
  formatDiff,
} from '@ef-fe-admin/shared';
import Card from '../../../components/ui/Card';

function Metric({ label, value, diff, unit }: { label: string; value: string; diff?: number; unit?: string }) {
  const diffColor = diff == null ? 'text-text-soft' : diff > 0 ? 'text-success-dark' : diff < 0 ? 'text-danger' : 'text-text-soft';
  return (
    <View className="bg-surface border border-border rounded-xl p-4 flex-1 mx-1">
      <Text className="text-[11px] text-text-soft font-bold">{label}</Text>
      <Text className="text-[20px] font-extrabold text-text mt-1">
        {value}
        {unit && <Text className="text-[11px] font-bold text-text-soft"> {unit}</Text>}
      </Text>
      {diff !== undefined && (
        <Text className={`text-[10px] font-extrabold mt-1 ${diffColor}`}>
          {formatDiff(diff)} 어제 대비
        </Text>
      )}
    </View>
  );
}

function QuickCard({
  label,
  count,
  icon,
  tone,
}: {
  label: string;
  count: number;
  icon: React.ReactNode;
  tone: 'danger' | 'warn' | 'point' | 'success';
}) {
  const tones = {
    danger: 'bg-danger-soft',
    warn: 'bg-warn-soft',
    point: 'bg-point-softer',
    success: 'bg-success-soft',
  } as const;
  return (
    <Pressable className={`${tones[tone]} rounded-xl p-4 flex-1 mx-1 flex-row items-center gap-3`}>
      {icon}
      <View className="flex-1">
        <Text className="text-[11px] font-bold text-text-sub">{label}</Text>
        <Text className="text-[16px] font-extrabold text-text mt-0.5">{count}건</Text>
      </View>
    </Pressable>
  );
}

export default function DashboardScreen() {
  const { data: metrics } = useDashboardMetrics();
  const { data: alerts } = useDashboardAlerts({ refetchInterval: 60_000 });
  const { data: notices } = useNotices({ status: 'SENT', page: 0, size: 5 });

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ padding: 16 }}>
      <Text className="text-[13px] font-extrabold text-text mb-3">오늘의 핵심 지표</Text>
      <View className="flex-row -mx-1">
        <Metric
          label="오늘 DAU"
          value={metrics ? metrics.dau.toLocaleString() : '-'}
          diff={metrics?.dau_diff}
        />
        <Metric
          label="신규 가입"
          value={metrics ? metrics.new_users.toLocaleString() : '-'}
          diff={metrics?.new_users_diff}
        />
      </View>
      <View className="flex-row -mx-1 mt-3">
        <Metric
          label="오늘 매출"
          value={metrics ? formatCurrency(metrics.today_revenue) : '-'}
          diff={metrics?.today_revenue_diff}
        />
        <Metric
          label="매칭 수"
          value={metrics ? metrics.match_count.toLocaleString() : '-'}
          diff={metrics?.match_count_diff}
        />
      </View>

      <Text className="text-[13px] font-extrabold text-text mt-6 mb-3">빠른 이동</Text>
      <View className="flex-row -mx-1">
        <QuickCard
          label="신고 대기"
          count={alerts?.pending_reports ?? 0}
          icon={<AlertTriangle size={22} color="#D14B5F" />}
          tone="danger"
        />
        <QuickCard
          label="환불 대기"
          count={alerts?.pending_refunds ?? 0}
          icon={<CreditCard size={22} color="#D49C2C" />}
          tone="warn"
        />
      </View>
      <View className="flex-row -mx-1 mt-3">
        <QuickCard
          label="프로필 심사"
          count={alerts?.pending_profile_reviews ?? 0}
          icon={<UserCheck size={22} color="#7668A3" />}
          tone="point"
        />
        <QuickCard
          label="밸런스 신청"
          count={alerts?.pending_bal_applies ?? 0}
          icon={<FileText size={22} color="#3E9F7A" />}
          tone="success"
        />
      </View>

      <Text className="text-[13px] font-extrabold text-text mt-6 mb-3">최근 발송 공지</Text>
      <Card>
        {notices?.content?.length ? (
          notices.content.map((n, idx) => (
            <View
              key={n.uuid}
              className={`py-3 ${idx < notices.content.length - 1 ? 'border-b border-border' : ''}`}
            >
              <Text className="text-[13px] font-bold text-text" numberOfLines={1}>
                {n.title}
              </Text>
              <Text className="text-[11px] text-text-soft mt-1">
                {n.sent_at ? formatDateTime(n.sent_at) : '-'} · {n.sent_count.toLocaleString()}명
              </Text>
            </View>
          ))
        ) : (
          <Text className="text-[12px] text-text-soft py-3">발송된 공지가 없습니다</Text>
        )}
      </Card>
      <View className="h-10" />
    </ScrollView>
  );
}
