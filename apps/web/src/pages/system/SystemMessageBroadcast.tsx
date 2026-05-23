import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { useBroadcastSystemMessageMutation } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function SystemMessageBroadcastPage() {
  const navigate = useNavigate()
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'ALL_CHATS' | 'PREMIUM_CHATS'>('ALL_CHATS')
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const mutation = useBroadcastSystemMessageMutation({
    onSuccess: (r) => {
      setResult(`✅ ${r.sent.toLocaleString()}개 채팅방에 발송되었습니다.`)
      setConfirmOpen(false)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/system-messages')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 시스템 메시지
        </button>
      </div>

      <Topbar
        title="시스템 메시지 일괄 발송"
        subtitle="활성 채팅방에 즉시 발송됩니다. 신중히 작성하세요."
      />

      <div className="card mb-4 space-y-3">
        <div className="bg-[#FDF1E2] border border-warn text-[#B68442] rounded-md p-3 text-[12px] font-bold">
          ⚠️ 발송 후 취소할 수 없습니다. 대상 채팅방의 모든 유저에게 시스템 메시지로 표시됩니다.
        </div>

        <div>
          <label className="form-label">대상</label>
          <div className="flex gap-2 flex-wrap">
            <button
              type="button"
              className={`chip ${target === 'ALL_CHATS' ? 'active' : ''}`}
              onClick={() => setTarget('ALL_CHATS')}
            >
              전체 활성 채팅
            </button>
            <button
              type="button"
              className={`chip ${target === 'PREMIUM_CHATS' ? 'active' : ''}`}
              onClick={() => setTarget('PREMIUM_CHATS')}
            >
              프리미엄 채팅만
            </button>
          </div>
        </div>

        <div>
          <label className="form-label">본문</label>
          <textarea
            className="form-textarea"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="공지 본문..."
            style={{ minHeight: 140 }}
          />
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
        {result && <div className="text-[12px] text-success font-bold">{result}</div>}

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/system-messages')}>
            {result ? '닫기' : '취소'}
          </button>
          {!result && (
            <button
              className="btn btn-primary btn-sm"
              disabled={mutation.isPending || !body.trim()}
              onClick={() => {
                setError(null)
                setConfirmOpen(true)
              }}
            >
              <Send size={13} /> {mutation.isPending ? '발송 중...' : '발송'}
            </button>
          )}
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="지금 일괄 발송하시겠습니까?"
          body={`${target === 'ALL_CHATS' ? '전체 활성 채팅' : '프리미엄 채팅만'}에 즉시 시스템 메시지가 전송됩니다. 취소할 수 없습니다.`}
          confirmLabel="예, 발송"
          tone="danger"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => mutation.mutate({ body, target })}
        />
      )}
    </>
  )
}
