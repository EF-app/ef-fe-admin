import { useState } from 'react'
import { Search, Crown, RefreshCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  usePremiumMembers,
  formatCurrency,
  formatDate,
  formatDateTime,
  PREMIUM_PLAN_LABEL,
} from '@ef-fe-admin/shared'
import type { PremiumPlanCode } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const PLAN_OPTIONS: { value: PremiumPlanCode | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'BASIC', label: 'Basic' },
  { value: 'PRO', label: 'Pro' },
  { value: 'TRIAL', label: '체험' },
]

export default function PremiumPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [plan, setPlan] = useState<PremiumPlanCode | undefined>(undefined)
  const [page, setPage] = useState(0)
  const { data, isLoading } = usePremiumMembers({
    keyword: keyword || undefined,
    plan_code: plan,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar
        title="프리미엄 회원"
        subtitle="활성 구독자의 사용 일수·아이템 소비를 조회합니다."
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-[280px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="닉네임 / UUID"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={plan}
            onChange={(v) => {
              setPlan(v)
              setPage(0)
            }}
            options={PLAN_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="프리미엄 회원이 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>플랜</th>
                <th>시작일</th>
                <th>만료일</th>
                <th>자동 갱신</th>
                <th>사용일수</th>
                <th>별 사용</th>
                <th>슈퍼라이크</th>
                <th>되감기</th>
                <th>총 결제액</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((m) => (
                <tr
                  key={m.user_id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${m.user_uuid}`)}
                >
                  <td className="font-extrabold">
                    <Crown size={11} className="inline mr-1 text-warn" />
                    {m.nickname}
                  </td>
                  <td>
                    <Badge tone={m.plan_code === 'PRO' ? 'point' : m.plan_code === 'TRIAL' ? 'neutral' : 'normal'}>
                      {PREMIUM_PLAN_LABEL[m.plan_code]}
                    </Badge>
                  </td>
                  <td className="text-text-sub">{formatDate(m.started_at)}</td>
                  <td className="text-text-sub">
                    <ExpiryCell expiresAt={m.expires_at} />
                  </td>
                  <td>
                    {m.is_auto_renew ? (
                      <Badge tone="normal">
                        <RefreshCcw size={10} /> ON
                      </Badge>
                    ) : (
                      <Badge tone="neutral">OFF</Badge>
                    )}
                  </td>
                  <td className="text-text-sub">{m.days_used}일</td>
                  <td className="text-text-sub">{m.star_used}</td>
                  <td className="text-text-sub">{m.super_like_used}</td>
                  <td className="text-text-sub">{m.rewind_used}</td>
                  <td className="font-extrabold">{formatCurrency(m.total_paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}

function ExpiryCell({ expiresAt }: { expiresAt: string }) {
  const d = new Date(expiresAt)
  const daysLeft = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const soon = daysLeft <= 3
  return (
    <span className={soon ? 'text-danger font-bold' : ''}>
      {formatDateTime(expiresAt)}
      {soon && ` (D-${daysLeft})`}
    </span>
  )
}
