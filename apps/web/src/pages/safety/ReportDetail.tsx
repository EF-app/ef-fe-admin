import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useReportDetail,
  useProcessReportMutation,
  useDismissReportMutation,
  formatDateTime,
  REPORT_TARGET_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge, ReportStatusBadge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SuspendInlineModal from '../../components/suspension/SuspendInlineModal'

/**
 * 신고 처리 흐름 (BE 2단계 워크플로우):
 *   1) 제재 부과 → POST /v1/admin/suspensions (SuspendInlineModal)
 *   2) 부과 응답의 suspension.id 로 신고 처리 → POST /v1/admin/reports/{id}/process
 *  또는
 *   - 제재 없이 처리 (PROCESSED, suspension_id=null)
 *   - 기각 (DISMISSED)
 */
export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reportId = id ? Number(id) : undefined
  const { data: report, isLoading } = useReportDetail(reportId)

  const [error, setError] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'process-without' | 'dismiss' | null>(null)
  const [suspendOpen, setSuspendOpen] = useState(false)

  const processMutation = useProcessReportMutation({
    onSuccess: () => navigate('/reports'),
    onError: (e) => setError(e.message),
  })
  const dismissMutation = useDismissReportMutation({
    onSuccess: () => navigate('/reports'),
    onError: (e) => setError(e.message),
  })

  if (isLoading || !report) {
    return (
      <>
        <Topbar title="신고 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  const executeProcessWithoutSuspension = () => {
    processMutation.mutate({ id: report.id, payload: { suspension_id: null } })
  }
  const executeDismiss = () => {
    dismissMutation.mutate({ id: report.id })
  }

  // 제재 부과 성공 시 호출됨 — 받은 suspension.id 로 신고 처리 연결.
  const handleSuspendSuccess = (suspension: { id: number }) => {
    processMutation.mutate({
      id: report.id,
      payload: { suspension_id: suspension.id },
    })
  }

  // 인라인 제재 모달용 — context prefill: 신고 사유 + 대상 콘텐츠 미리보기.
  const suspendContextPrefill = [
    `신고 #${report.id} (${REPORT_TARGET_TYPE_LABEL[report.target_type]})`,
    report.target_preview ? `대상 콘텐츠: "${report.target_preview}"` : null,
    report.reason ? `신고 사유: ${report.reason}` : null,
    `제재 사유: `,
  ]
    .filter(Boolean)
    .join('\n')

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
              disabled={!report.target_user_id}
              onClick={() =>
                report.target_user_id &&
                navigate(`/users/${report.target_user_id}`)
              }
              className="font-extrabold text-point-dark hover:underline disabled:text-text disabled:no-underline text-left"
            >
              @{report.target_user_nickname ?? '-'}
            </button>
            <div className="text-[11px] text-text-soft mt-0.5">
              {report.target_user_id != null && `#${report.target_user_id}`}
              {report.target_user_login_id && ` · #${report.target_user_login_id}`}
            </div>
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

        {/* 처리 후 연결된 제재 정보 */}
        {report.suspension_id != null && (
          <div className="bg-point-softer border border-point-light rounded-md p-3 text-[12.5px]">
            <div className="font-extrabold text-point-dark mb-1">연결된 제재</div>
            <button
              onClick={() =>
                navigate(`/suspensions/${report.suspension_id}`)
              }
              className="text-point-dark hover:underline"
            >
              제재 #{report.suspension_id} 상세 보기 →
            </button>
          </div>
        )}
      </div>

      {/* 처리 액션 — PENDING 일 때만 */}
      {report.status === 'PENDING' && (
        <div className="card mb-4 space-y-3">
          <div className="text-[14px] font-extrabold">처리</div>
          <div className="text-[12px] text-text-sub">
            제재 부과는 별도 단계입니다. 부과 후 자동으로 이 신고에 연결됩니다.
          </div>

          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

          <div className="flex justify-end gap-2 flex-wrap">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmKind('dismiss')}
              disabled={dismissMutation.isPending || processMutation.isPending}
            >
              {dismissMutation.isPending ? '처리 중...' : '기각'}
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmKind('process-without')}
              disabled={dismissMutation.isPending || processMutation.isPending}
            >
              제재 없이 처리
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={() => setSuspendOpen(true)}
              disabled={
                dismissMutation.isPending ||
                processMutation.isPending ||
                !report.target_user_id
              }
            >
              제재 부과 + 처리
            </button>
          </div>
        </div>
      )}

      {suspendOpen && report.target_user_id && (
        <SuspendInlineModal
          userId={report.target_user_id}
          userNickname={report.target_user_nickname ?? '대상 유저'}
          contextPrefill={suspendContextPrefill}
          onClose={() => setSuspendOpen(false)}
          onSuccess={handleSuspendSuccess}
        />
      )}

      {confirmKind === 'process-without' && (
        <ConfirmDialog
          title="제재 없이 처리하시겠습니까?"
          body={`#${report.id} 신고를 처리 완료(PROCESSED) 로 마킹합니다.\n신고 내용은 인정하되 제재는 부과하지 않습니다.`}
          confirmLabel="예, 처리"
          tone="warn"
          pending={processMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={executeProcessWithoutSuspension}
        />
      )}
      {confirmKind === 'dismiss' && (
        <ConfirmDialog
          title="신고를 기각하시겠습니까?"
          body={`#${report.id} 신고를 기각(DISMISSED) 처리합니다.`}
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
