import { useState } from 'react'
import { Search } from 'lucide-react'
import {
  usePayments,
  formatCurrency,
  formatDateTime,
  PAYMENT_STATUS,
  PAYMENT_TYPE,
  PAYMENT_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import type { PaymentStatus, PaymentType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { PaymentStatusBadge } from '../../components/ui/Badge'

const STATUS_OPTIONS: { value: PaymentStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: PAYMENT_STATUS.SUCCESS, label: '결제 완료' },
  { value: PAYMENT_STATUS.PENDING, label: '대기' },
  { value: PAYMENT_STATUS.FAILED, label: '실패' },
  { value: PAYMENT_STATUS.REFUNDED, label: '환불됨' },
]

const TYPE_OPTIONS: { value: PaymentType | undefined; label: string }[] = [
  { value: undefined, label: '전체 유형' },
  { value: PAYMENT_TYPE.SUBSCRIPTION, label: '구독' },
  { value: PAYMENT_TYPE.STAR_CHARGE, label: '별 충전' },
]

export default function PaymentsPage() {
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<PaymentStatus | undefined>(undefined)
  const [type, setType] = useState<PaymentType | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = usePayments({
    status,
    payment_type: type,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar title="결제 내역" subtitle="전체 결제 트랜잭션 조회 — 환불 처리는 환불 내역 페이지에서." />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-[260px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="주문번호 / 닉네임"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={type}
            onChange={(v) => {
              setType(v)
              setPage(0)
            }}
            options={TYPE_OPTIONS}
          />
          <FilterChips
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="결제 내역이 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>유저</th>
                <th>유형</th>
                <th>PG</th>
                <th>금액</th>
                <th>결제일</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold font-mono text-[11.5px]">{p.order_id}</td>
                  <td className="text-text-sub">{p.user_nickname ?? '(탈퇴)'}</td>
                  <td>{PAYMENT_TYPE_LABEL[p.payment_type]}</td>
                  <td className="text-text-sub">{p.pg_provider}</td>
                  <td className="font-extrabold">{formatCurrency(p.amount)}</td>
                  <td className="text-text-sub">{formatDateTime(p.paid_at ?? p.create_time)}</td>
                  <td>
                    <PaymentStatusBadge status={p.status} />
                  </td>
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
