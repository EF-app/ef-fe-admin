import { useState } from 'react'
import {
  usePayments,
  useRefundMutation,
  formatCurrency,
  formatDateTime,
  PAYMENT_STATUS,
  PAYMENT_TYPE_LABEL,
  REFUND_TYPE,
  REFUND_TYPE_LABEL,
  validators,
} from '@ef-fe-admin/shared'
import type { PaymentStatus, PaymentLog, RefundType } from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import FilterChips from '../components/ui/FilterChips'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { PaymentStatusBadge } from '../components/ui/Badge'

const STATUS_OPTIONS: { value: PaymentStatus | undefined; label: string }[] = [
  { value: PAYMENT_STATUS.SUCCESS, label: '결제 완료' },
  { value: PAYMENT_STATUS.REFUNDED, label: '환불됨' },
  { value: PAYMENT_STATUS.FAILED, label: '실패' },
  { value: PAYMENT_STATUS.PENDING, label: '대기' },
  { value: undefined, label: '전체' },
]

export default function RefundsPage() {
  const [status, setStatus] = useState<PaymentStatus | undefined>('SUCCESS')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<PaymentLog | null>(null)

  const { data, isLoading } = usePayments({ status, page, size: 12 })

  return (
    <>
      <Topbar title="환불·결제 관리" subtitle="결제 내역 조회와 환불을 처리합니다." />

      <div className="card mb-4">
        <FilterChips value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={STATUS_OPTIONS} />
      </div>

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="결제 내역이 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>주문번호</th>
                <th>유저</th>
                <th>유형</th>
                <th>금액</th>
                <th>결제일</th>
                <th>상태</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((p) => (
                <tr key={p.id}>
                  <td className="font-bold">{p.order_id}</td>
                  <td className="text-text-sub">{p.user_nickname ?? '(탈퇴)'}</td>
                  <td>{PAYMENT_TYPE_LABEL[p.payment_type]}</td>
                  <td className="font-extrabold">{formatCurrency(p.amount)}</td>
                  <td className="text-text-sub">{formatDateTime(p.paid_at)}</td>
                  <td><PaymentStatusBadge status={p.status} /></td>
                  <td>
                    {p.status === 'SUCCESS' && (
                      <button className="btn btn-danger btn-sm" onClick={() => setSelected(p)}>
                        환불
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {selected && <RefundModal payment={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function RefundModal({ payment, onClose }: { payment: PaymentLog; onClose: () => void }) {
  const [refundType, setRefundType] = useState<RefundType>('FULL')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useRefundMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    const check = validators.refundReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    mutation.mutate({
      id: payment.id,
      payload: { refund_type: refundType, refund_reason: reason, amount: payment.amount },
    })
  }

  return (
    <Modal open onClose={onClose} title="환불 처리" maxWidth={480}>
      <div className="space-y-4">
        <div className="bg-surface-alt rounded-md p-4 text-[12px]">
          <div className="flex justify-between">
            <span className="text-text-soft">주문번호</span>
            <span className="font-bold">{payment.order_id}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-text-soft">결제자</span>
            <span className="font-bold">{payment.user_nickname ?? '(탈퇴)'}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-text-soft">결제액</span>
            <span className="font-bold text-[14px]">{formatCurrency(payment.amount)}</span>
          </div>
        </div>

        <div>
          <label className="form-label">환불 유형</label>
          <div className="flex gap-2">
            {(Object.keys(REFUND_TYPE) as RefundType[]).map((t) => (
              <button
                key={t}
                type="button"
                className={`chip ${refundType === t ? 'active' : ''}`}
                onClick={() => setRefundType(t)}
              >
                {REFUND_TYPE_LABEL[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">환불 사유</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        <div className="flex justify-end gap-2 mt-4">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>취소</button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? '처리 중...' : '환불 승인'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
