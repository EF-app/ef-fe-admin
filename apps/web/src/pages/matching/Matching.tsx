import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { Heart, Clock, MessageSquare, Activity, Filter } from 'lucide-react'
import {
  useMatchingFunnel,
  useMatchingDailyChart,
  formatNumber,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'

export default function MatchingPage() {
  const navigate = useNavigate()
  const { data: funnel } = useMatchingFunnel()
  const { data: daily } = useMatchingDailyChart(14)

  const rate24h = funnel
    ? Math.round((funnel.with_first_msg_in_24h / funnel.matches) * 1000) / 10
    : 0
  const rate7d = funnel
    ? Math.round((funnel.with_first_msg_in_7d / funnel.matches) * 1000) / 10
    : 0
  const respRate = funnel ? Math.round(funnel.first_msg_response_rate * 1000) / 10 : 0
  const retain7d = funnel
    ? Math.round((funnel.active_after_7d / funnel.matches) * 1000) / 10
    : 0

  return (
    <>
      <Topbar
        title="매칭 대시보드"
        subtitle="매칭 깔때기 지표 — 매칭 → 대화 → 유지로 이어지는 전환을 추적합니다."
      />

      <div className="flex items-center justify-end mb-3">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/matching/rates')}
        >
          <Filter size={13} /> 매칭률 가중치 조정
        </button>
      </div>

      {/* 깔때기 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <FunnelCard
          step="STEP 1"
          label="매칭 성사"
          value={formatNumber(funnel?.matches ?? 0)}
          rate={100}
          icon={<Heart size={16} />}
        />
        <FunnelCard
          step="STEP 2"
          label="24h 내 첫 메시지"
          value={formatNumber(funnel?.with_first_msg_in_24h ?? 0)}
          rate={rate24h}
          icon={<MessageSquare size={16} />}
          tone="point"
        />
        <FunnelCard
          step="STEP 3"
          label="첫 메시지 응답"
          value={`${respRate}%`}
          rate={respRate}
          icon={<Activity size={16} />}
          tone="point"
        />
        <FunnelCard
          step="STEP 4"
          label="7일 후 활성"
          value={formatNumber(funnel?.active_after_7d ?? 0)}
          rate={retain7d}
          icon={<Clock size={16} />}
          tone="warn"
        />
      </div>

      {/* 보조 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <Metric label="7일 내 첫 메시지" value={`${rate7d}%`} hint="매칭 후 7일 안에 대화 시작" />
        <Metric
          label="첫 메시지 평균 소요"
          value={`${funnel?.avg_first_msg_minutes ?? 0}분`}
          hint="매칭 → 첫 메시지까지의 중앙값"
        />
        <Metric
          label="3일 후 활성 매칭"
          value={formatNumber(funnel?.active_after_3d ?? 0)}
          hint="3일 후에도 메시지가 오간 매칭"
        />
      </div>

      {/* 차트 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold text-[14px]">최근 14일 매칭 수</div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={daily ?? []}>
              <defs>
                <linearGradient id="matchGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9686BF" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#9686BF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B6573' }} />
              <YAxis fontSize={10} tick={{ fill: '#6B6573' }} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="total_matches"
                stroke="#7668A3"
                fill="url(#matchGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <div className="font-extrabold text-[14px]">대화 시작률 추이</div>
            <span className="text-[11px] text-text-soft">매칭 대비 대화 시작 비율</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart
              data={(daily ?? []).map((d) => ({
                date: d.date,
                value: Math.round(d.chat_started_rate * 100),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ECE8E3" />
              <XAxis dataKey="date" fontSize={10} tick={{ fill: '#6B6573' }} />
              <YAxis fontSize={10} tick={{ fill: '#6B6573' }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#E8B76B"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}

function FunnelCard({
  step,
  label,
  value,
  rate,
  icon,
  tone = 'normal',
}: {
  step: string
  label: string
  value: string
  rate: number
  icon?: React.ReactNode
  tone?: 'normal' | 'point' | 'warn'
}) {
  const barColor =
    tone === 'point' ? 'bg-point' : tone === 'warn' ? 'bg-warn' : 'bg-success'
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-extrabold text-text-soft tracking-wider">
          {step}
        </span>
        <span className="text-text-soft">{icon}</span>
      </div>
      <div className="text-[12px] text-text-sub font-bold">{label}</div>
      <div className="text-[24px] font-black mt-1">{value}</div>
      <div className="mt-2 h-1.5 bg-bg rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor}`}
          style={{ width: `${Math.min(100, rate)}%` }}
        />
      </div>
      <div className="text-[10.5px] font-bold text-text-soft mt-1">
        매칭 대비 {rate}%
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="card">
      <div className="text-[12px] text-text-sub font-bold">{label}</div>
      <div className="text-[22px] font-extrabold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-text-soft mt-0.5">{hint}</div>}
    </div>
  )
}
