import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuditLogs, formatDateTime } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'

/**
 * 감사 로그 상세 — before/after JSON 스냅샷 비교
 * BE 단건 조회 endpoint 가 없으므로 list 에서 찾는 방식 (mock 모드)
 */
export default function AuditLogDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const targetId = id ? Number(id) : undefined

  const { data, isLoading } = useAuditLogs({ size: 200 })
  const log = data?.content.find((l) => l.id === targetId)

  if (isLoading || !log) {
    return (
      <>
        <Topbar title="감사 로그 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/audit')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 감사 로그
        </button>
      </div>

      <Topbar
        title="감사 로그 상세"
        subtitle={`#${log.id} · ${formatDateTime(log.create_time)}`}
      />

      <div className="card mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-[13px]">
          <Field label="시각">{formatDateTime(log.create_time)}</Field>
          <Field label="관리자">
            <button
              onClick={() => navigate(`/admin/account/${log.admin_id}`)}
              className="font-extrabold text-point-dark hover:underline"
            >
              {log.admin_name ?? `#${log.admin_id}`}
            </button>
          </Field>
          <Field label="액션">
            <Badge tone="point">{log.action}</Badge>
          </Field>
          <Field label="대상 타입">{log.target_type}</Field>
          <Field label="대상 ID">{log.target_id}</Field>
          <Field label="IP">{log.ip_address}</Field>
          {log.user_agent && <Field label="User Agent">{log.user_agent}</Field>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-[13px] font-extrabold mb-2">변경 전 (before)</div>
          <pre className="bg-surface-alt rounded-md p-3 text-[11.5px] font-mono whitespace-pre-wrap break-all overflow-auto max-h-[420px]">
            {log.before_json
              ? JSON.stringify(log.before_json, null, 2)
              : <span className="text-text-soft">(없음)</span>}
          </pre>
        </div>
        <div className="card">
          <div className="text-[13px] font-extrabold mb-2">변경 후 (after)</div>
          <pre className="bg-surface-alt rounded-md p-3 text-[11.5px] font-mono whitespace-pre-wrap break-all overflow-auto max-h-[420px]">
            {log.after_json
              ? JSON.stringify(log.after_json, null, 2)
              : <span className="text-text-soft">(없음)</span>}
          </pre>
        </div>
      </div>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-[13px] break-all">{children}</div>
    </div>
  )
}
