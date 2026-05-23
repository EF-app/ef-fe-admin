import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Power,
  PowerOff,
  CheckCircle2,
  Clock,
  CircleOff,
  CircleDot,
} from 'lucide-react'
import {
  usePolicies,
  usePolicyDetail,
  useActivatePolicyMutation,
  useTogglePolicyActiveMutation,
  formatDateTime,
  formatDate,
  POLICY_KIND_LABEL,
  POLICY_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type { PolicyDoc, PolicyStatus } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

function deriveStatus(p: PolicyDoc): PolicyStatus {
  const now = Date.now()
  const eff = new Date(p.effective_date).getTime()
  const exp = p.expires_at ? new Date(p.expires_at).getTime() : null
  if (!p.is_active) return 'INACTIVE'
  if (exp != null && exp < now) return 'EXPIRED'
  if (eff > now) return 'SCHEDULED'
  return 'ACTIVE'
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  const tone =
    status === 'ACTIVE'
      ? 'normal'
      : status === 'SCHEDULED'
        ? 'point'
        : status === 'EXPIRED'
          ? 'neutral'
          : 'warn'
  return <Badge tone={tone}>{POLICY_STATUS_LABEL[status]}</Badge>
}

/**
 * 약관·정책 상세 (readOnly) + 같은 타입 버전 타임라인 + "새 버전 작성" 액션.
 *
 * UNIQUE(policy_type, version) 이므로 본문/타입/버전 수정 불가.
 * 활성/비활성 토글, 활성 스왑(같은 타입 다른 버전 자동 비활성), 새 버전 등록만 가능.
 */
export default function PolicyDetailPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const { data: doc, isLoading } = usePolicyDetail(uuid)
  const { data: listData } = usePolicies({ size: 200 })

  const siblings = useMemo(() => {
    if (!doc) return []
    return (listData?.content ?? [])
      .filter((p) => p.policy_type === doc.policy_type)
      .sort((a, b) => b.update_time.localeCompare(a.update_time))
  }, [doc?.uuid, listData?.content])

  const activateMutation = useActivatePolicyMutation()
  const toggleMutation = useTogglePolicyActiveMutation()
  const [confirmKind, setConfirmKind] = useState<'activate' | 'deactivate' | null>(null)

  if (isLoading || !doc) {
    return <Topbar title="정책 문서" subtitle="불러오는 중..." />
  }

  const status = deriveStatus(doc)

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/policies')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 정책 목록
        </button>
      </div>

      <Topbar
        title={`${POLICY_KIND_LABEL[doc.policy_type]} · ${doc.version}`}
        subtitle={`${POLICY_STATUS_LABEL[status]} · ${formatDateTime(doc.update_time)} 최종 수정`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">
        {/* 본문 */}
        <div className="space-y-4">
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12.5px]">
              <Field label="분류">
                <Badge tone="point">{POLICY_KIND_LABEL[doc.policy_type]}</Badge>
              </Field>
              <Field label="버전">{doc.version}</Field>
              <Field label="상태">
                <StatusBadge status={status} />
              </Field>
              <Field label="발효일">{formatDateTime(doc.effective_date)}</Field>
              <Field label="만료일">
                {doc.expires_at ? formatDateTime(doc.expires_at) : '-'}
              </Field>
              <Field label="필수 / 재동의">
                {doc.is_required ? '필수' : '선택'} ·{' '}
                {doc.requires_reagreement ? '재동의 요청' : '없음'}
              </Field>
              <Field label="동의 수">
                {(doc.consent_count ?? 0).toLocaleString()}
              </Field>
              <Field label="작성">
                {doc.create_user_name ?? `#${doc.create_user}`} ·{' '}
                {formatDateTime(doc.create_time)}
              </Field>
            </div>

            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-border">
              {!doc.is_active && (
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={activateMutation.isPending}
                  onClick={() => setConfirmKind('activate')}
                >
                  <Power size={13} /> 이 버전 활성화 (다른 버전 자동 비활성)
                </button>
              )}
              {doc.is_active && (
                <button
                  className="btn btn-danger btn-sm"
                  disabled={toggleMutation.isPending}
                  onClick={() => setConfirmKind('deactivate')}
                >
                  <PowerOff size={13} /> 비활성화
                </button>
              )}
              <button
                className="btn btn-primary btn-sm"
                onClick={() => navigate(`/policies/new?from=${doc.uuid}`)}
              >
                <Plus size={13} /> 새 버전 작성
              </button>
            </div>
          </div>

          {doc.summary && (
            <div className="card">
              <div className="text-[10.5px] text-text-soft font-bold mb-1">요약</div>
              <div className="text-[13px] leading-relaxed">{doc.summary}</div>
            </div>
          )}

          <div className="card">
            <div className="text-[10.5px] text-text-soft font-bold mb-2">제목</div>
            <div className="text-[15px] font-extrabold mb-4">{doc.title}</div>
            <div className="text-[10.5px] text-text-soft font-bold mb-2">본문</div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap text-text-sub">
              {doc.content}
            </div>
          </div>
        </div>

        {/* 사이드: 같은 타입 버전 타임라인 */}
        <aside className="card p-0 overflow-hidden h-fit sticky top-4">
          <div className="px-4 py-3 border-b border-border bg-surface-alt/40">
            <div className="text-[11.5px] font-extrabold">버전 이력</div>
            <div className="text-[10.5px] text-text-soft mt-0.5">
              {POLICY_KIND_LABEL[doc.policy_type]} · {siblings.length}개
            </div>
          </div>
          <div className="p-2 space-y-0.5 max-h-[480px] overflow-y-auto">
            {siblings.map((v, idx) => (
              <TimelineRow
                key={v.uuid}
                version={v}
                isCurrent={v.uuid === doc.uuid}
                status={deriveStatus(v)}
                isLast={idx === siblings.length - 1}
                onClick={() => navigate(`/policies/${v.uuid}`)}
              />
            ))}
          </div>
        </aside>
      </div>

      {confirmKind === 'activate' && (
        <ConfirmDialog
          title="이 버전을 활성화하시겠습니까?"
          body="같은 타입의 다른 활성 버전은 자동으로 비활성화됩니다."
          confirmLabel="예, 활성화"
          tone="warn"
          pending={activateMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() =>
            activateMutation.mutate(
              { uuid: doc.uuid },
              { onSettled: () => setConfirmKind(null) }
            )
          }
        />
      )}
      {confirmKind === 'deactivate' && (
        <ConfirmDialog
          title="활성 버전을 비활성화하시겠습니까?"
          body="사용자 화면에 노출되는 활성 정책이 없게 됩니다."
          confirmLabel="예, 비활성화"
          tone="danger"
          pending={toggleMutation.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() =>
            toggleMutation.mutate(
              { uuid: doc.uuid, is_active: false },
              { onSettled: () => setConfirmKind(null) }
            )
          }
        />
      )}
    </>
  )
}

function TimelineRow({
  version,
  isCurrent,
  status,
  isLast,
  onClick,
}: {
  version: PolicyDoc
  isCurrent: boolean
  status: PolicyStatus
  isLast: boolean
  onClick: () => void
}) {
  const Icon =
    status === 'ACTIVE'
      ? CheckCircle2
      : status === 'SCHEDULED'
        ? Clock
        : status === 'INACTIVE' || status === 'EXPIRED'
          ? CircleOff
          : CircleDot
  const iconColor =
    status === 'ACTIVE'
      ? 'text-success'
      : status === 'SCHEDULED'
        ? 'text-point-dark'
        : 'text-text-soft'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-start gap-2 w-full text-left px-2 py-2 rounded-md transition ${
        isCurrent
          ? 'bg-point-softer ring-1 ring-point/30'
          : 'hover:bg-surface-alt'
      }`}
    >
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <Icon size={13} className={iconColor} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[14px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="font-mono font-extrabold text-[11.5px]">{version.version}</span>
          <StatusBadge status={status} />
        </div>
        <div className="text-[10.5px] text-text-soft mt-0.5">
          발효 {formatDate(version.effective_date)}
        </div>
      </div>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-[12.5px]">{children}</div>
    </div>
  )
}
