import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useFaqDetail,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  formatDateTime,
  FAQ_CATEGORY,
  FAQ_CATEGORY_LABEL,
} from '@ef-fe-admin/shared'
import type { FaqCategory } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'

/** FAQ 등록·편집 페이지. /faqs/new 또는 /faqs/:id */
export default function FaqEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)
  const faqId = id ? Number(id) : undefined

  const { data: existing, isLoading } = useFaqDetail(faqId)

  const [category, setCategory] = useState<FaqCategory>('ACCOUNT')
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [displayOrder, setDisplayOrder] = useState(0)
  const [isPopular, setIsPopular] = useState(false)
  const [isActive, setIsActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing && isEdit) {
      setCategory(existing.category)
      setQuestion(existing.question)
      setAnswer(existing.answer)
      setDisplayOrder(existing.display_order)
      setIsPopular(existing.is_popular)
      setIsActive(existing.is_active)
    }
  }, [existing?.id, isEdit])

  const createMutation = useCreateFaqMutation({
    onSuccess: () => navigate('/policies?tab=faq'),
    onError: (e) => setError(e.message),
  })
  const updateMutation = useUpdateFaqMutation({
    onSuccess: () => navigate('/policies?tab=faq'),
    onError: (e) => setError(e.message),
  })
  const pending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = () => {
    setError(null)
    if (!question.trim()) return setError('질문을 입력해주세요.')
    if (!answer.trim()) return setError('답변을 입력해주세요.')
    const payload = {
      category,
      question: question.trim(),
      answer: answer.trim(),
      display_order: displayOrder,
      is_popular: isPopular,
      is_active: isActive,
    }
    if (isEdit && faqId != null) {
      updateMutation.mutate({ id: faqId, payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  if (isEdit && isLoading) {
    return (
      <>
        <Topbar title="FAQ" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/policies?tab=faq')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> FAQ·정책 목록
        </button>
      </div>

      <Topbar
        title={isEdit ? 'FAQ 편집' : 'FAQ 추가'}
        subtitle={
          isEdit && existing
            ? `${FAQ_CATEGORY_LABEL[existing.category]} · 수정 ${formatDateTime(existing.update_time)}`
            : 'code_faq 항목 — 카테고리, 질문, 답변, 정렬, 인기/활성 여부'
        }
      />

      <div className="card mb-4 space-y-3">
        <div>
          <label className="form-label">카테고리</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(FAQ_CATEGORY).map((c) => (
              <button
                key={c}
                type="button"
                className={`chip ${category === c ? 'active' : ''}`}
                onClick={() => setCategory(c)}
              >
                {FAQ_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">질문 (최대 500자)</label>
          <input
            className="form-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={500}
            placeholder="예) 비밀번호를 잊어버렸어요. 어떻게 하나요?"
          />
        </div>

        <div>
          <label className="form-label">답변</label>
          <textarea
            className="form-textarea"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{ minHeight: 200 }}
            placeholder="답변 내용을 입력하세요."
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="form-label">정렬 순서</label>
            <input
              type="number"
              className="form-input"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
              min={0}
            />
            <div className="text-[10.5px] text-text-soft mt-1">
              카테고리 내 정렬 (낮을수록 위)
            </div>
          </div>
          <label className="inline-flex items-center gap-2 cursor-pointer self-end pb-2">
            <input
              type="checkbox"
              checked={isPopular}
              onChange={(e) => setIsPopular(e.target.checked)}
              className="accent-[var(--color-point)] w-4 h-4"
            />
            <span className="text-[12.5px] font-bold">🔥 인기 FAQ</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer self-end pb-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-[var(--color-point)] w-4 h-4"
            />
            <span className="text-[12.5px] font-bold">활성 (유저에 노출)</span>
          </label>
        </div>

        {/* 미리보기 */}
        <div className="bg-surface-alt rounded-md p-3">
          <div className="text-[10.5px] text-text-soft font-bold mb-2 tracking-wider">
            미리보기 (유저 화면)
          </div>
          <div className="bg-surface rounded-md border border-border p-3">
            <div className="flex items-center gap-1.5 mb-2 flex-wrap">
              <Badge tone="point">{FAQ_CATEGORY_LABEL[category]}</Badge>
              {isPopular && <Badge tone="warn">🔥 인기</Badge>}
              {!isActive && <Badge tone="neutral">비활성</Badge>}
            </div>
            <div className="font-extrabold text-[13.5px] mb-2">
              Q. {question || '(질문 미입력)'}
            </div>
            <div className="text-[12.5px] text-text-sub whitespace-pre-wrap">
              {answer || '(답변 미입력)'}
            </div>
          </div>
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/policies?tab=faq')}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? '저장 중...' : isEdit ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}
