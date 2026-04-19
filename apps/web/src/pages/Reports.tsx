import { useState } from 'react'
import {
  useReports,
  useProcessReportMutation,
  useDismissReportMutation,
  formatDateTime,
  REPORT_STATUS,
  REPORT_TARGET_TYPE_LABEL,
  SUSPENSION_TYPE,
  calcSuspensionEndsAt,
  validators,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type { ReportStatus, Report, SuspensionType } from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import FilterChips from '../components/ui/FilterChips'
import Modal from '../components/ui/Modal'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import { ReportStatusBadge, Badge } from '../components/ui/Badge'

const STATUS_OPTIONS: { value: ReportStatus | undefined; label: string }[] = [
  { value: REPORT_STATUS.PENDING, label: '대기 중' },
  { value: REPORT_STATUS.PROCESSED, label: '처리됨' },
  { value: REPORT_STATUS.DISMISSED, label: '기각됨' },
  { value: undefined, label: '전체' },
]

export default function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus | undefined>('PENDING')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Report | null>(null)

  const { data, isLoading } = useReports({ status, page, size: 10 })

  return (
    <>
      <Topbar title="신고 처리" subtitle="신고 접수 건을 처리합니다." />

      <div className="card mb-4">
        <FilterChips value={status} onChange={(v) => { setStatus(v); setPage(0) }} options={STATUS_OPTIONS} />
      </div>

      {isLoading ? (
        <div className="p-10 text-center text-text-soft">불러오는 중...</div>
      ) : !data?.content?.length ? (
        <EmptyState title="처리할 신고가 없습니다." />
      ) : (
        <div className="space-y-3">
          {data.content.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {selected && <ReportDetailModal report={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function ReportCard({ report, onClick }: { report: Report; onClick: () => void }) {
  return (
    <button className="card w-full text-left hover:shadow-md transition" onClick={onClick}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="point">{REPORT_TARGET_TYPE_LABEL[report.target_type]}</Badge>
            <ReportStatusBadge status={report.status} />
            <span className="text-[11px] text-text-soft">
              {formatDateTime(report.create_time)}
            </span>
          </div>
          <div className="text-[13px] font-extrabold">
            신고 대상: {report.target_user_nickname ?? '-'}
          </div>
          {report.target_preview && (
            <div className="text-[12px] text-text-sub mt-1 line-clamp-2">
              "{report.target_preview}"
            </div>
          )}
          {report.reason && (
            <div className="text-[12px] text-text-sub mt-2">
              사유: {report.reason}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}

function ReportDetailModal({ report, onClose }: { report: Report; onClose: () => void }) {
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const processMutation = useProcessReportMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })
  const dismissMutation = useDismissReportMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleProcess = () => {
    setError(null)
    const check = validators.suspensionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    processMutation.mutate({
      id: report.id,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  return (
    <Modal open onClose={onClose} title="신고 상세" maxWidth={560}>
      <div className="space-y-4">
        <div className="bg-surface-alt rounded-md p-4 text-[12px]">
          <div className="text-text-soft font-bold mb-1">대상 콘텐츠</div>
          <div className="text-[13px]">"{report.target_preview ?? '-'}"</div>
          <div className="text-text-soft mt-2">
            작성자: {report.target_user_nickname ?? '-'} · 타입: {REPORT_TARGET_TYPE_LABEL[report.target_type]}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-text-soft font-bold">신고자</div>
          <div className="text-[13px]">{report.reporter_nickname ?? '(탈퇴)'}</div>
        </div>
        <div>
          <div className="text-[11px] text-text-soft font-bold">신고 사유</div>
          <div className="text-[13px]">{report.reason ?? '-'}</div>
        </div>

        {report.status === 'PENDING' && (
          <>
            <hr className="border-border" />
            <div>
              <label className="form-label">제재 유형</label>
              <div className="flex gap-2">
                {(Object.keys(SUSPENSION_TYPE) as SuspensionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${type === t ? 'active' : ''}`}
                    onClick={() => setType(t)}
                  >
                    {t === 'WARNING' ? '경고' : t === 'TEMPORARY' ? '일시정지' : '영구정지'}
                  </button>
                ))}
              </div>
            </div>
            {type === 'TEMPORARY' && (
              <div>
                <label className="form-label">기간</label>
                <div className="flex gap-2">
                  {TEMPORARY_DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.days}
                      type="button"
                      className={`chip ${durationDays === opt.days ? 'active' : ''}`}
                      onClick={() => setDurationDays(opt.days)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="form-label">처리 사유</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
            {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => dismissMutation.mutate({ id: report.id })}
                disabled={dismissMutation.isPending}
              >
                기각
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleProcess}
                disabled={processMutation.isPending}
              >
                제재 발동
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
