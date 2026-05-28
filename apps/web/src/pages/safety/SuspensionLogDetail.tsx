import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useSuspensionLogDetail,
  useLiftSuspensionMutation,
  formatDateTime,
  SUSPENSION_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import type { SuspensionType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function SuspensionLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const logId = id ? Number(id) : undefined
  const { data: log, isLoading } = useSuspensionLogDetail(logId)
  const [liftReason, setLiftReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const liftMutation = useLiftSuspensionMutation({
    onSuccess: () => navigate('/suspensions'),
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  if (isLoading || !log) {
    return (
      <>
        <Topbar title="제재 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  const handleLiftClick = () => {
    setError(null)
    if (!liftReason.trim()) return setError('해제 사유를 입력해주세요.')
    setConfirmOpen(true)
  }
  const executeLift = () => {
    liftMutation.mutate({ id: log.id, payload: { lifted_reason: liftReason } })
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/suspensions')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 제재 관리
        </button>
      </div>
      <Topbar
        title="제재 상세"
        subtitle={`#${log.id} · ${log.user_nickname ?? '-'} 에게 발동된 제재`}
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[13px]">
          <Field label="대상 유저">
            <button
              onClick={() => navigate(`/users/${log.user_id}`)}
              className="font-extrabold text-point-dark hover:underline text-left"
            >
              {log.user_nickname ?? '-'}
            </button>
            <div className="text-[11px] text-text-soft mt-0.5">
              #{log.user_id} · @{log.user_login_id ?? '-'}
            </div>
          </Field>
          <Field label="유형">
            <SuspensionTypeBadge type={log.suspension_type} />
          </Field>
          <Field label="상태">
            {!log.is_lifted ? (
              <Badge tone="warn">진행 중</Badge>
            ) : log.lifted_by_admin_id == null ? (
              <Badge tone="neutral">자동 만료</Badge>
            ) : (
              <Badge tone="normal">수동 해제</Badge>
            )}
          </Field>
          <Field label="시작">{formatDateTime(log.starts_at)}</Field>
          <Field label="종료">
            {log.ends_at ? formatDateTime(log.ends_at) : '영구'}
          </Field>
          <Field label="제재한 관리자">
            {log.created_by_admin_id && log.created_by_admin_id > 0 ? (
              <button
                onClick={() => navigate(`/admin/account/${log.created_by_admin_id}`)}
                className="font-extrabold text-point-dark hover:underline text-left"
              >
                {log.created_by_admin_name ?? '-'}
              </button>
            ) : (
              <span>{log.created_by_admin_name ?? '-'}</span>
            )}
          </Field>
        </div>
      </div>

      <div className="card mb-4">
        <div className="text-[11px] text-text-soft font-bold mb-2">제재 사유</div>
        <div className="bg-surface-alt rounded-md p-4 text-[13px] whitespace-pre-wrap">
          {log.reason}
        </div>
      </div>

      {log.is_lifted ? (
        <div className="card mb-4">
          <div className="text-[11px] text-text-soft font-bold mb-2">
            {log.lifted_by_admin_id == null ? '자동 만료 정보' : '수동 해제 정보'}
          </div>
          <div className="bg-surface-alt rounded-md p-4 text-[12.5px] space-y-1.5">
            <div>
              해제 시각: <strong>{log.lifted_at ? formatDateTime(log.lifted_at) : '-'}</strong>
            </div>
            {log.lifted_by_admin_id == null ? (
              <div className="text-text-soft">
                ends_at 도달로 배치가 자동 해제했습니다.
              </div>
            ) : (
              <>
                <div>
                  해제한 관리자:{' '}
                  {log.lifted_by_admin_id ? (
                    <button
                      onClick={() => navigate(`/admin/account/${log.lifted_by_admin_id}`)}
                      className="font-extrabold text-point-dark hover:underline"
                    >
                      {log.lifted_by_admin_name ?? '-'}
                    </button>
                  ) : (
                    <strong>{log.lifted_by_admin_name ?? '-'}</strong>
                  )}
                </div>
                <div className="whitespace-pre-wrap">
                  사유: {log.lifted_reason ?? '-'}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="card mb-4 space-y-3">
          <div className="text-[14px] font-extrabold">제재 해제</div>
          <div>
            <label className="form-label">해제 사유</label>
            <textarea
              className="form-textarea"
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              placeholder="이의 신청 수용, 오인 신고 확인 등"
            />
          </div>
          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/suspensions')}
            >
              닫기
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleLiftClick}
              disabled={liftMutation.isPending}
            >
              {liftMutation.isPending ? '처리 중...' : '제재 해제'}
            </button>
          </div>
        </div>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="제재를 해제하시겠습니까?"
          body={`#${log.id} ${log.user_nickname ?? ''} 의 ${SUSPENSION_TYPE_LABEL[log.suspension_type]} 제재를 해제합니다.`}
          confirmLabel="예, 해제"
          tone="warn"
          pending={liftMutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={executeLift}
        />
      )}
    </>
  )
}

function SuspensionTypeBadge({ type }: { type: SuspensionType }) {
  const tone = type === 'WARNING' ? 'warn' : type === 'TEMPORARY' ? 'point' : 'danger'
  return <Badge tone={tone}>{SUSPENSION_TYPE_LABEL[type]}</Badge>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-[13px]">{children}</div>
    </div>
  )
}
