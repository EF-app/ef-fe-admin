import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useReportDetail,
  useProcessReportMutation,
  useDismissReportMutation,
  formatDateTime,
  REPORT_TARGET_TYPE_LABEL,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  calcSuspensionEndsAt,
  validators,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type { SuspensionType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge, ReportStatusBadge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reportId = id ? Number(id) : undefined
  const { data: report, isLoading } = useReportDetail(reportId)

  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'process' | 'dismiss' | null>(null)

  const processMutation = useProcessReportMutation({
    onSuccess: () => navigate('/reports'),
    onError: (e) => setError(e.message),
  })
  const dismissMutation = useDismissReportMutation({
    onSuccess: () => navigate('/reports'),
    onError: (e) => setError(e.message),
  })

  const handleProcessClick = () => {
    if (!report) return
    setError(null)
    const check = validators.suspensionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    setConfirmKind('process')
  }
  const executeProcess = () => {
    if (!report) return
    processMutation.mutate({
      id: report.id,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }
  const executeDismiss = () => {
    if (!report) return
    dismissMutation.mutate({ id: report.id })
  }

  if (isLoading || !report) {
    return (
      <>
        <Topbar title="신고 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/reports')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 신고 목록
        </button>
      </div>
      <Topbar
        title="신고 상세"
        subtitle={`#${report.id} · ${REPORT_TARGET_TYPE_LABEL[report.target_type]}`}
      />

      <div className="card mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="point">{REPORT_TARGET_TYPE_LABEL[report.target_type]}</Badge>
          <ReportStatusBadge status={report.status} />
          <span className="text-[11.5px] text-text-soft ml-auto">
            {formatDateTime(report.create_time)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
          <Field label="신고 대상">
            <button
              disabled={!report.target_user_uuid}
              onClick={() =>
                report.target_user_uuid &&
                navigate(`/users/${report.target_user_uuid}`)
              }
              className="font-extrabold text-point-dark hover:underline disabled:text-text disabled:no-underline text-left"
            >
              {report.target_user_nickname ?? '-'}
            </button>
          </Field>
          <Field label="신고자">{report.reporter_nickname ?? '(탈퇴)'}</Field>
          <Field label="처리 시각">
            {report.admin_processed_at ? formatDateTime(report.admin_processed_at) : '-'}
          </Field>
        </div>

        {report.target_preview && (
          <div>
            <div className="text-[11px] text-text-soft font-bold mb-1">대상 콘텐츠</div>
            <div className="bg-surface-alt rounded-md p-3 text-[13px] whitespace-pre-wrap break-words">
              "{report.target_preview}"
            </div>
          </div>
        )}

        <div>
          <div className="text-[11px] text-text-soft font-bold mb-1">신고 사유</div>
          <div className="bg-surface-alt rounded-md p-3 text-[13px] whitespace-pre-wrap break-words">
            {report.reason ?? '-'}
          </div>
        </div>
      </div>

      {/* 처리 — PENDING 일 때만 */}
      {report.status === 'PENDING' && (
        <div className="card mb-4 space-y-3">
          <div className="text-[14px] font-extrabold">처리</div>

          <div>
            <label className="form-label">제재 유형</label>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(SUSPENSION_TYPE) as SuspensionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`chip ${type === t ? 'active' : ''}`}
                  onClick={() => setType(t)}
                >
                  {SUSPENSION_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          {type === 'TEMPORARY' && (
            <div>
              <label className="form-label">기간</label>
              <div className="flex gap-2 flex-wrap">
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
            <label className="form-label">처리 사유 (유저 통보)</label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예) 욕설 사용으로 7일 일시정지"
            />
          </div>

          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmKind('dismiss')}
              disabled={dismissMutation.isPending}
            >
              {dismissMutation.isPending ? '처리 중...' : '기각'}
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleProcessClick}
              disabled={processMutation.isPending}
            >
              {processMutation.isPending ? '처리 중...' : '제재 발동'}
            </button>
          </div>
        </div>
      )}

      {confirmKind === 'process' && (
        <ConfirmDialog
          title="제재를 발동하시겠습니까?"
          body={`#${report.id} 신고에 ${SUSPENSION_TYPE_LABEL[type]} 제재를 적용합니다.`}
          confirmLabel="예, 발동"
          tone="danger"
          pending={processMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={executeProcess}
        />
      )}
      {confirmKind === 'dismiss' && (
        <ConfirmDialog
          title="신고를 기각하시겠습니까?"
          body={`#${report.id} 신고를 기각 처리합니다.`}
          confirmLabel="예, 기각"
          tone="warn"
          pending={dismissMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={executeDismiss}
        />
      )}
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-[12.5px]">{children}</div>
    </div>
  )
}
