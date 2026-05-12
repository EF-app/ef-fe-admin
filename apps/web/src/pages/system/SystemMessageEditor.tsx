import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useSystemMessages,
  useUpdateSystemMessageMutation,
  formatDateTime,
  SYSTEM_MESSAGE_EVENT_LABEL,
} from '@ef-fe-admin/shared'
import type { SystemMessageTemplate, SystemMessageEvent } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'

/**
 * 시스템 메시지 템플릿 편집 페이지.
 * /system-messages/:uuid
 */
export default function SystemMessageEditorPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const navigate = useNavigate()
  const { data: list } = useSystemMessages({ size: 50 })
  const template: SystemMessageTemplate | undefined = list?.content.find(
    (m) => m.uuid === uuid
  )

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setBody(template.body)
      setIsActive(template.is_active)
    }
  }, [template?.uuid])

  const mutation = useUpdateSystemMessageMutation({
    onSuccess: () => navigate('/system-messages'),
    onError: (e) => setError(e.message),
  })

  if (!template) {
    return (
      <>
        <Topbar title="시스템 메시지 편집" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/system-messages')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 시스템 메시지
        </button>
      </div>

      <Topbar
        title="시스템 메시지 편집"
        subtitle={`${SYSTEM_MESSAGE_EVENT_LABEL[template.event_code]} · 발송 ${template.send_count.toLocaleString()}회`}
      />

      <div className="card mb-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="point">
            {SYSTEM_MESSAGE_EVENT_LABEL[template.event_code]}
          </Badge>
          <span className="text-[11px] text-text-soft">
            마지막 수정 {formatDateTime(template.update_time)} ·{' '}
            {template.update_user_name ?? '-'}
          </span>
        </div>

        <div>
          <label className="form-label">제목 (인앱 표시)</label>
          <input className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="form-label">본문</label>
          <textarea
            className="form-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="accent-[var(--color-point)] w-4 h-4"
          />
          <span className="text-[12.5px] font-bold">활성화 (이벤트 발생 시 자동 발송)</span>
        </label>

        <div className="bg-surface-alt rounded-md p-3 text-[11.5px] text-text-sub">
          <div className="font-bold mb-1">📋 미리보기</div>
          <div className="bg-surface border border-border rounded-md p-3">
            <div className="text-[10px] text-text-soft mb-1">시스템</div>
            <div className="text-[12.5px] font-bold">{title}</div>
            <div className="text-[12px] mt-0.5 whitespace-pre-wrap">{body}</div>
          </div>
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/system-messages')}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                uuid: template.uuid,
                payload: {
                  event_code: template.event_code as SystemMessageEvent,
                  title,
                  body,
                  is_active: isActive,
                },
              })
            }
          >
            {mutation.isPending ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </>
  )
}
