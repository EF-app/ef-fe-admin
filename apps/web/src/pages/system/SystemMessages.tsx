import { useNavigate } from 'react-router-dom'
import { Send, MessageSquare } from 'lucide-react'
import {
  useSystemMessages,
  formatDateTime,
  formatNumber,
  SYSTEM_MESSAGE_EVENT_LABEL,
} from '@ef-fe-admin/shared'
import type { SystemMessageTemplate } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

export default function SystemMessagesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useSystemMessages({ size: 50 })

  return (
    <>
      <Topbar
        title="시스템 메시지"
        subtitle="채팅방에 자동 노출되는 시스템 메시지 템플릿 · 브로드캐스트 발송"
      />

      <div className="flex items-center justify-end mb-3">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/system-messages/broadcast')}
        >
          <Send size={13} /> 일괄 발송
        </button>
      </div>

      {isLoading ? (
        <div className="card p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
      ) : !data?.content?.length ? (
        <EmptyState title="등록된 템플릿이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.content.map((m) => (
            <TemplateCard
              key={m.id}
              template={m}
              onClick={() => navigate(`/system-messages/${m.uuid}`)}
            />
          ))}
        </div>
      )}
    </>
  )
}

function TemplateCard({
  template,
  onClick,
}: {
  template: SystemMessageTemplate
  onClick: () => void
}) {
  return (
    <button onClick={onClick} className="card text-left hover:shadow-md transition w-full">
      <div className="flex items-center justify-between mb-2">
        <Badge tone="point">{SYSTEM_MESSAGE_EVENT_LABEL[template.event_code]}</Badge>
        {template.is_active ? (
          <Badge tone="normal">활성</Badge>
        ) : (
          <Badge tone="neutral">비활성</Badge>
        )}
      </div>
      <div className="font-extrabold text-[14px] mb-1 break-keep">{template.title}</div>
      <div className="text-[12.5px] text-text-sub line-clamp-2 mb-3">{template.body}</div>
      <div className="flex items-center justify-between text-[10.5px] text-text-soft flex-wrap gap-1">
        <span>
          <MessageSquare size={10} className="inline mr-0.5" />
          {formatNumber(template.send_count)} 회 발송
        </span>
        <span>마지막 발송 {formatDateTime(template.last_sent_at)}</span>
      </div>
    </button>
  )
}
