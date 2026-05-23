import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Send, X, Bell } from 'lucide-react'
import {
  usePushes,
  useSendPushNowMutation,
  useCancelPushMutation,
  formatDateTime,
  formatNumber,
  PUSH_TARGET_LABEL,
  PUSH_KIND_LABEL,
  PUSH_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type { PushStatus, PushKind } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const STATUS_OPTIONS: { value: PushStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'DRAFT', label: '임시저장' },
  { value: 'SCHEDULED', label: '예약' },
  { value: 'SENT', label: '발송 완료' },
  { value: 'CANCELED', label: '취소' },
]

const KIND_OPTIONS: { value: PushKind | undefined; label: string }[] = [
  { value: undefined, label: '전체 종류' },
  { value: 'NOTICE_LINK', label: '공지 연동' },
  { value: 'MARKETING', label: '마케팅' },
  { value: 'EMERGENCY', label: '긴급' },
  { value: 'CUSTOM', label: '일반' },
]

export default function PushesPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<PushStatus | 'ALL'>('ALL')
  const [kind, setKind] = useState<PushKind | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = usePushes({ status, kind, page, size: 15 })
  const sendNow = useSendPushNowMutation()
  const cancel = useCancelPushMutation()
  const [confirm, setConfirm] = useState<{ kind: 'send' | 'cancel'; id: number } | null>(null)

  const rows = useMemo(() => data?.content ?? [], [data?.content])

  return (
    <>
      <Topbar
        title="푸시 발송"
        subtitle="공지·마케팅·긴급 푸시를 발송 대상과 시점을 지정해 관리합니다."
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
            options={STATUS_OPTIONS}
          />
          <div className="w-px h-5 bg-border" />
          <FilterChips
            value={kind}
            onChange={(v) => {
              setKind(v)
              setPage(0)
            }}
            options={KIND_OPTIONS}
          />
          <div className="flex-1" />
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/pushes/new')}>
            <Plus size={13} /> 새 푸시 작성
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !rows.length ? (
          <EmptyState title="조건에 맞는 푸시가 없습니다." />
        ) : (
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th>종류</th>
                <th className="w-[36%]">제목 / 본문</th>
                <th>대상</th>
                <th>상태</th>
                <th>발송/예약</th>
                <th>발송 인원</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/pushes/${p.id}`)}
                >
                  <td>
                    <Badge tone={kindTone(p.kind)}>{PUSH_KIND_LABEL[p.kind]}</Badge>
                  </td>
                  <td>
                    <div className="font-extrabold text-[13px] line-clamp-1">
                      <Bell size={11} className="inline mr-1 text-text-soft" />
                      {p.title}
                    </div>
                    <div className="text-[11.5px] text-text-soft line-clamp-1 mt-0.5">
                      {p.body}
                    </div>
                    {p.linkedNoticeId != null && (
                      <div className="text-[10.5px] text-point-dark font-bold mt-0.5">
                        ↳ 공지 #{p.linkedNoticeId} 연동
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-[12px]">{PUSH_TARGET_LABEL[p.target]}</div>
                    {p.target === 'SEGMENT' && p.segmentDesc && (
                      <div className="text-[10.5px] text-text-soft mt-0.5">
                        {p.segmentDesc}
                      </div>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="text-text-sub text-[12px]">
                    {p.sentAt
                      ? formatDateTime(p.sentAt)
                      : p.scheduledAt
                        ? <span className="text-point-dark">예약 · {formatDateTime(p.scheduledAt)}</span>
                        : <span className="text-text-soft">-</span>}
                  </td>
                  <td className="text-text-sub text-[12px]">
                    {p.status === 'SENT' ? (
                      <>
                        <span className="font-bold">{formatNumber(p.sentCount)}</span>
                        <span className="text-text-soft"> / {formatNumber(p.targetCount)}</span>
                      </>
                    ) : (
                      <span className="text-text-soft">예상 {formatNumber(p.targetCount)}</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {p.status === 'SCHEDULED' && (
                      <div className="flex gap-1">
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={sendNow.isPending}
                          onClick={() => setConfirm({ kind: 'send', id: p.id })}
                        >
                          <Send size={12} /> 즉시 발송
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={cancel.isPending}
                          onClick={() => setConfirm({ kind: 'cancel', id: p.id })}
                        >
                          <X size={12} /> 취소
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {confirm?.kind === 'send' && (
        <ConfirmDialog
          title="지금 즉시 발송하시겠습니까?"
          body="예약을 무시하고 곧바로 푸시가 전송됩니다."
          confirmLabel="예, 발송"
          tone="danger"
          pending={sendNow.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            sendNow.mutate(
              { id: confirm.id },
              { onSettled: () => setConfirm(null) }
            )
          }
        />
      )}
      {confirm?.kind === 'cancel' && (
        <ConfirmDialog
          title="예약을 취소하시겠습니까?"
          body="이 푸시는 예약된 시각에 발송되지 않습니다."
          confirmLabel="예, 취소"
          tone="warn"
          pending={cancel.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            cancel.mutate(
              { id: confirm.id },
              { onSettled: () => setConfirm(null) }
            )
          }
        />
      )}
    </>
  )
}

function StatusBadge({ status }: { status: PushStatus }) {
  const tone =
    status === 'SENT' ? 'normal' :
    status === 'SCHEDULED' ? 'point' :
    status === 'SENDING' ? 'point' :
    status === 'FAILED' ? 'danger' :
    status === 'CANCELED' ? 'neutral' :
    'warn'
  return <Badge tone={tone}>{PUSH_STATUS_LABEL[status]}</Badge>
}

function kindTone(kind: PushKind): 'point' | 'warn' | 'danger' | 'neutral' {
  switch (kind) {
    case 'EMERGENCY': return 'danger'
    case 'MARKETING': return 'warn'
    case 'NOTICE_LINK': return 'point'
    default: return 'neutral'
  }
}
