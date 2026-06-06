import { parseInt0, useUrlFilters } from '../../hooks/useUrlFilters'
import { useScrollRestoration } from '../../hooks/useScrollRestoration'
import {
  usePayments,
  formatCurrency,
  formatDateTime,
  PAYMENT_STATUS,
  PAYMENT_TYPE_LABEL,
  REFUND_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'

/**
 * 환불 내역 (읽기 전용)
 * - 사용자 안내: 환불은 PG/스토어에서 처리되며 운영자가 직접 처리하지 않음
 * - 이 화면은 환불된 트랜잭션 모니터링용
 */
export default function RefundsPage() {
  useScrollRestoration()
  const [filters, setFilters] = useUrlFilters<{ page: number }>({
    page: { default: 0, parse: parseInt0 },
  })
  const { page } = filters
  const setPage = (p: number) => setFilters({ page: p })
  const { data, isLoading } = usePayments({
    status: PAYMENT_STATUS.REFUNDED,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar
        title="환불 내역"
        subtitle="PG/스토어에서 환불 처리된 트랜잭션 모니터링 — 운영자가 직접 환불하지 않습니다."
      />

      <div className="card mb-4 bg-point-softer border-point-soft text-[12px] text-point-dark flex items-start gap-2">
        <span>ℹ️</span>
        <div>
          환불은 결제 후 7일 내·미사용 조건으로 <strong>유저가 앱에서 직접</strong> 신청하거나
          PG/스토어에서 처리됩니다. 운영자는 결과만 조회하며 거절/승인 액션은 없습니다.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <SummaryCard
          label="누적 환불 건수"
          value={`${data?.totalElements ?? 0}건`}
        />
        <SummaryCard
          label="이번달 환불액"
          value={formatCurrency(
            (data?.content ?? []).reduce((sum, p) => sum + p.amount, 0)
          )}
        />
        <SummaryCard label="환불률" value="5.7%" hint="결제 대비" />
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="환불 내역이 없습니다." />
        ) : (
          <table className="data-table min-w-[840px]">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>유저</th>
                <th>유형</th>
                <th>금액</th>
                <th>결제일</th>
                <th>환불일</th>
                <th>환불 유형</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold font-mono text-[11.5px]">{p.order_id}</td>
                  <td className="text-text-sub">{p.user_nickname ?? '(탈퇴)'}</td>
                  <td>{PAYMENT_TYPE_LABEL[p.payment_type]}</td>
                  <td className="font-extrabold">{formatCurrency(p.amount)}</td>
                  <td className="text-text-sub">{formatDateTime(p.paid_at)}</td>
                  <td className="text-text-sub">{formatDateTime(p.refunded_at)}</td>
                  <td>
                    {p.refund_type && (
                      <Badge tone="warn">{REFUND_TYPE_LABEL[p.refund_type]}</Badge>
                    )}
                  </td>
                  <td className="text-text-sub">
                    <div className="line-clamp-1 max-w-[240px]">
                      {p.refund_reason ?? '-'}
                    </div>
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

function SummaryCard({
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
      <div className="text-[11px] text-text-soft font-bold">{label}</div>
      <div className="text-[22px] font-extrabold mt-1">{value}</div>
      {hint && <div className="text-[11px] text-text-soft mt-0.5">{hint}</div>}
    </div>
  )
}
