import { useEffect } from 'react'

/**
 * 표준 확인 다이얼로그.
 *   "저장하시겠습니까?" / "예/아니오" 같은 patch·delete·update 직전 마지막 확인용.
 *
 * tone:
 *   - primary : 일반 저장/생성/예약 (파란 [예] 버튼)
 *   - danger  : 삭제·강제 비번 변경·일괄 broadcast 같은 즉시 실행되는 파괴적 액션 (빨간 [예])
 *   - warn    : 운영 영향 큰 토글 — 정책 비활성, 제재 해제, 일정 변경 등 (노란 [예])
 *
 * confirmLabel 은 "예" 만 두지 말고 "예, 저장" / "예, 삭제" 처럼 동사를 붙여 오작동을 줄인다.
 */
export interface ConfirmDialogProps {
  title: string
  body?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'primary' | 'danger' | 'warn'
  pending?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  title,
  body,
  confirmLabel = '예',
  cancelLabel = '아니오',
  tone = 'primary',
  pending = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (pending) return
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', handler)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = prev
    }
  }, [onCancel, pending])

  const confirmBtnClass =
    tone === 'danger'
      ? 'btn btn-danger btn-sm'
      : tone === 'warn'
        ? 'btn btn-warn btn-sm'
        : 'btn btn-primary btn-sm'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,39,48,0.5)] backdrop-blur-sm animate-[fadeIn_0.18s_ease]"
      onClick={pending ? undefined : onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-[420px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[17px] font-extrabold mb-2">{title}</div>
        {body && (
          <div className="text-[13px] text-text-sub leading-relaxed mb-5">{body}</div>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </button>
          <button className={confirmBtnClass} onClick={onConfirm} disabled={pending}>
            {pending ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
