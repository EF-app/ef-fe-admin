import { useNavigate } from 'react-router-dom'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { AlertTriangle, CreditCard, TrendingUp, TrendingDown, Users, Heart, DollarSign } from 'lucide-react'
import {
  useDashboardMetrics,
  useDashboardAlerts,
  useDauChart,
  useRevenueChart,
  useNotices,
  formatCurrency,
  formatNumber,
  formatDateTime,
} from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import dayjs from 'dayjs'

export default function DashboardPage() {
  const navigate = useNavigate()
  const today = dayjs().format('YYYY년 M월 D일 (ddd)')

  const { data: metrics } = useDashboardMetrics()
  const { data: alerts } = useDashboardAlerts({ refetchInterval: 60_000 })
  const { data: dauChart } = useDauChart(30)
  const { data: revenueChart } = useRevenueChart(14)
  const { data: recentNotices } = useNotices({ status: 'SENT', size: 5 })

  return (
    <>
      <Topbar title="대시보드" subtitle={`서비스 전반의 핵심 지표 — ${today}`} />

      {/* 대기 중 긴급 건 */}
      <div className="section-title flex items-center gap-2">
        <AlertTriangle size={15} className="text-warn" /> 대기 중 긴급 건
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate('/reports')}
          className="card flex items-center gap-4 hover:shadow-md transition text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-danger-soft text-danger flex items-center justify-center">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-text-sub font-bold">신고 대기</div>
            <div className="text-[26px] font-black mt-1">
              {alerts?.pending_reports ?? 0}
              <span className="text-[13px] font-bold text-text-sub ml-1">건</span>
            </div>
          </div>
        </button>
        <button
          onClick={() => navigate('/refunds')}
          className="card flex items-center gap-4 hover:shadow-md transition text-left"
        >
          <div className="w-12 h-12 rounded-lg bg-point-softer text-point-dark flex items-center justify-center">
            <CreditCard size={20} />
          </div>
          <div className="flex-1">
            <div className="text-[12px] text-text-sub font-bold">환불 대기</div>
            <div className="text-[26px] font-black mt-1">
              {alerts?.pending_refunds ?? 0}
              <span className="text-[13px] font-bold text-text-sub ml-1">건</span>
            </div>
          </div>
        </button>
      </div>

      {/* 오늘의 지표 */}
      <div className="section-title">📊 오늘의 지표</div>
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="DAU"
          value={formatNumber(metrics?.dau)}
          diff={metrics?.dau_diff}
          icon={<Users size={16} />}
        />
        <MetricCard
          label="신규 가입자"
          value={metrics ? `${metrics.new_users} 명` : '-'}
          diff={metrics?.new_users_diff}
          icon={<TrendingUp size={16} />}
        />
        <MetricCard
          label="오늘 매출"
          value={formatCurrency(metrics?.today_revenue)}
          diff={metrics?.today_revenue_diff}
          icon={<DollarSign size={16} />}
        />
        <MetricCard
          label="매칭 수"
          value={formatNumber(metrics?.match_count)}
          diff={metrics?.match_count_diff}
          icon={<Heart size={16} />}
        />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-extrabold text-[14px]">최근 30일 DAU 추이</div>
            <span className="text-[11px] text-text-soft">/api/admin/dashboard/chart/dau</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={dauChart ?? []}>
              <defs>
                <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9686BF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#9686BF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B6573' }} />
              <YAxis fontSize={10} tick={{ fill: '#6B6573' }} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#7668A3" fill="url(#dauGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="font-extrabold text-[14px]">최근 14일 매출</div>
            <span className="text-[11px] text-text-soft">/api/admin/dashboard/chart/revenue</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueChart ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B6573' }} />
              <YAxis fontSize={10} tick={{ fill: '#6B6573' }} />
              <Tooltip formatter={(v) => formatCurrency(v as number)} />
              <Bar dataKey="value" fill="#9686BF" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 공지 */}
      <div className="section-title">📢 최근 발송된 공지</div>
      <div className="card p-0">
        {recentNotices?.content?.length ? (
          <div>
            {recentNotices.content.map((n) => (
              <div
                key={n.id}
                className="flex items-center justify-between px-5 py-4 border-b border-border last:border-b-0"
              >
                <div>
                  <div className="font-extrabold text-[13px]">{n.title}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">
                    {formatDateTime(n.sent_at)}
                  </div>
                </div>
                <div className="text-[11px] text-text-sub text-right">
                  <div>발송 {formatNumber(n.sent_count)}</div>
                  <div>읽음 {formatNumber(n.read_count)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-text-soft text-[12px]">최근 발송된 공지가 없습니다.</div>
        )}
      </div>
    </>
  )
}

function MetricCard({
  label,
  value,
  diff,
  icon,
}: {
  label: string
  value: string
  diff?: number
  icon?: React.ReactNode
}) {
  const up = (diff ?? 0) > 0
  const down = (diff ?? 0) < 0
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] text-text-sub font-bold">{label}</div>
        <div className="text-text-soft">{icon}</div>
      </div>
      <div className="text-[26px] font-black">{value}</div>
      {diff != null && (
        <div
          className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${
            up ? 'text-success' : down ? 'text-danger' : 'text-text-soft'
          }`}
        >
          {up ? <TrendingUp size={12} /> : down ? <TrendingDown size={12} /> : null}
          {up ? '▲' : down ? '▼' : ''} {Math.abs(diff)}% vs 어제
        </div>
      )}
    </div>
  )
}
