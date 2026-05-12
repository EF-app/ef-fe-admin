import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import {
  useRevenueSummary,
  useRevenueDailyChart,
  useRevenueByMethod,
  useRevenueByPlan,
  formatCurrency,
  formatNumber,
} from '@ef-fe-admin/shared'
import { TrendingUp, TrendingDown, Wallet, Users, UserMinus, RefreshCcw } from 'lucide-react'
import Topbar from '../../components/layout/Topbar'

const PIE_COLORS = ['#9686BF', '#7BB894', '#E8B76B', '#D97878', '#A09AAA']

export default function RevenuePage() {
  const { data: summary } = useRevenueSummary()
  const { data: daily } = useRevenueDailyChart(30)
  const { data: byMethod } = useRevenueByMethod()
  const { data: byPlan } = useRevenueByPlan()

  return (
    <>
      <Topbar
        title="정산·매출 대시보드"
        subtitle={`기간: ${summary?.period_start} ~ ${summary?.period_end} (최근 30일)`}
      />

      {/* 핵심 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <BigCard
          label="총 매출 (Gross)"
          value={formatCurrency(summary?.gross_revenue)}
          icon={<TrendingUp size={18} />}
          tone="point"
        />
        <BigCard
          label="순매출 (Net)"
          value={formatCurrency(summary?.net_revenue)}
          icon={<Wallet size={18} />}
          tone="normal"
        />
        <BigCard
          label="환불액"
          value={`-${formatCurrency(summary?.refund_amount)}`}
          icon={<RefreshCcw size={18} />}
          tone="warn"
        />
        <BigCard
          label="결제 건수"
          value={`${formatNumber(summary?.payment_count)}건`}
          icon={<TrendingDown size={18} />}
        />
      </div>

      {/* 구독 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <SmallCard label="활성 구독자" value={formatNumber(summary?.active_subscribers)} icon={<Users size={14} />} />
        <SmallCard label="신규 가입" value={`+${formatNumber(summary?.new_subscribers)}`} icon={<TrendingUp size={14} />} tone="success" />
        <SmallCard label="재구독" value={`+${formatNumber(summary?.renewed_subscribers)}`} icon={<RefreshCcw size={14} />} />
        <SmallCard label="이탈" value={`-${formatNumber(summary?.churned_subscribers)}`} icon={<UserMinus size={14} />} tone="danger" />
      </div>

      {/* 일별 매출 차트 */}
      <div className="card mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="font-extrabold text-[14px]">📈 일별 매출 추이 (최근 30일)</div>
          <span className="text-[11px] text-text-soft">/api/admin/dashboard/chart/revenue</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={daily ?? []}>
            <defs>
              <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9686BF" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#9686BF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
            <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B6573' }} />
            <YAxis fontSize={10} tick={{ fill: '#6B6573' }} />
            <Tooltip formatter={(v) => formatCurrency(v as number)} />
            <Area type="monotone" dataKey="value" stroke="#7668A3" fill="url(#revenueArea)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 결제수단 + 플랜 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="card">
          <div className="font-extrabold text-[14px] mb-3">💳 결제수단별 매출</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={byMethod ?? []}
                dataKey="amount"
                nameKey="pg_provider"
                outerRadius={86}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label={(p: any) => `${p.pg_provider} ${p.share}%`}
                labelLine={false}
              >
                {(byMethod ?? []).map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="font-extrabold text-[14px] mb-3">📦 플랜별 매출</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byPlan ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
              <XAxis dataKey="plan_name" fontSize={9} tick={{ fill: '#6B6573' }} />
              <YAxis fontSize={10} tick={{ fill: '#6B6573' }} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Bar dataKey="amount" fill="#9686BF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

function BigCard({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'neutral' | 'point' | 'normal' | 'warn'
}) {
  const bg =
    tone === 'point' ? 'bg-point-softer text-point-dark' :
    tone === 'normal' ? 'bg-[#E8F3EC] text-success' :
    tone === 'warn' ? 'bg-[#FDF1E2] text-[#B68442]' :
    'bg-surface-alt text-text-sub'
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className="text-[12px] text-text-sub font-bold">{label}</div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${bg}`}>
          {icon}
        </div>
      </div>
      <div className="text-[24px] font-black mt-2">{value}</div>
    </div>
  )
}

function SmallCard({
  label,
  value,
  icon,
  tone = 'neutral',
}: {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: 'neutral' | 'success' | 'danger'
}) {
  const valueColor = tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-text'
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] text-text-sub font-bold">{label}</span>
        <span className="text-text-soft">{icon}</span>
      </div>
      <div className={`text-[18px] font-extrabold ${valueColor}`}>{value}</div>
    </div>
  )
}
