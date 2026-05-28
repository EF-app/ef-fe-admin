/**
 * 작성자/유저 제재 부과 인라인 모달 — 공용.
 *
 * 사용처:
 *   - 유저 상세 > 작성글 탭의 글별 "제재" 진입
 *   - 콘텐츠 > 포스트잇 / 밸런스댓글 상세에서 "제재" 진입
 *
 * 특징:
 *   - useUserDetail(userId) 로 recent_warning_count / last_temporary_duration_days / active_suspension 자동 로드
 *   - WARNING 부과 시 임계치 도달이면 에스컬레이션 강한 경고 모달
 *   - 그 외 부과 시 일반 "제재하시겠습니까" 확인 모달
 *   - 활성 차단 제재가 있는 유저면 "이미 N일까지 제재 중" 안내 분기
 *   - isAnonymous: 익명 글 작성자에게 부과한다는 경고 메시지
 *   - contextPrefill: 사유 textarea 초기값 (글 본문/메타 prefill 용)
 */
import { useState } from 'react'
import {
  useUserDetail,
  useSuspendUserMutation,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  TEMPORARY_DURATION_OPTIONS,
  calcSuspensionEndsAt,
  previewWarningEscalation,
  WARNING_WINDOW_DAYS,
  WARNING_THRESHOLD,
  formatDateTime,
  validators,
} from '@ef-fe-admin/shared'
import type { SuspensionType, UserSuspension } from '@ef-fe-admin/shared'
import Modal from '../ui/Modal'
import ConfirmDialog from '../ui/ConfirmDialog'

interface SuspendInlineModalProps {
  userId: number
  userNickname: string
  /** 사유 textarea 초기값 — 작성글 메타 등 prefill */
  contextPrefill?: string
  /** 익명 글 작성자에게 부과하는 케이스 — 경고 메시지 표시 */
  isAnonymous?: boolean
  onClose: () => void
  /** 부과 성공 시 호출. 부과된 user_suspension 객체 전달 — 신고 처리에서 id 활용 가능. */
  onSuccess?: (suspension: UserSuspension) => void
}

export default function SuspendInlineModal({
  userId,
  userNickname,
  contextPrefill = '',
  isAnonymous,
  onClose,
  onSuccess,
}: SuspendInlineModalProps) {
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [reason, setReason] = useState(contextPrefill)
  const [error, setError] = useState<string | null>(null)
  const [escalateConfirmOpen, setEscalateConfirmOpen] = useState(false)
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false)

  const { data: user } = useUserDetail(userId)
  const escalation = previewWarningEscalation(
    user?.recent_warning_count ?? 0,
    user?.last_temporary_duration_days ?? null,
  )

  const mutation = useSuspendUserMutation({
    onSuccess: (suspension) => {
      setEscalateConfirmOpen(false)
      setSuspendConfirmOpen(false)
      onSuccess?.(suspension)
      onClose()
    },
    onError: (e) => {
      setError(e.message)
      setEscalateConfirmOpen(false)
      setSuspendConfirmOpen(false)
    },
  })

  const submit = () => {
    mutation.mutate({
      uuid: userId,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  const handleSubmit = () => {
    setError(null)
    const check = validators.suspensionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    if (type === 'WARNING' && escalation.willEscalate) {
      setEscalateConfirmOpen(true)
      return
    }
    setSuspendConfirmOpen(true)
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`작성자 제재 — ${userNickname}${isAnonymous ? ' (익명 글 작성자)' : ''}`}
      maxWidth={540}
    >
      <div className="space-y-3">
        <div className="bg-surface-alt rounded-md p-3 text-[12px] text-text-sub">
          <strong>{userNickname}</strong> 에게 제재를 적용합니다.
          {isAnonymous && (
            <div className="text-warn-dark text-[11.5px] font-bold mt-1">
              ⚠ 익명 글이지만 실제 작성자에게 제재가 적용됩니다.
            </div>
          )}
        </div>

        {(user?.recent_warning_count ?? 0) > 0 && (
          <div className="text-[12px] text-text-sub bg-warn-soft rounded-md px-3 py-2">
            최근 {WARNING_WINDOW_DAYS}일 경고{' '}
            <strong className="text-warn-dark">{user!.recent_warning_count}</strong>회
            {' · '}
            임계치 {WARNING_THRESHOLD}회 누적 시 자동 일시정지
            {type === 'WARNING' && escalation.willEscalate && (
              <div className="mt-1 text-warn-dark font-bold">
                ⚠ 이번 부과 시 자동 에스컬레이션:{' '}
                {escalation.nextType === 'PERMANENT'
                  ? '영구정지'
                  : `${escalation.days}일 일시정지`}
              </div>
            )}
          </div>
        )}

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
          <label className="form-label">사유 (유저에게 통보)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>
            취소
          </button>
          <button
            className="btn btn-danger btn-sm"
            disabled={mutation.isPending}
            onClick={handleSubmit}
          >
            {mutation.isPending ? '처리 중...' : '제재 발동'}
          </button>
        </div>
      </div>

      {escalateConfirmOpen && escalation.willEscalate && (
        <ConfirmDialog
          title="이 WARNING 부과는 자동 에스컬레이션을 일으킵니다"
          body={
            `이번 부과로 최근 ${WARNING_WINDOW_DAYS}일 누적 경고가 ${WARNING_THRESHOLD}회에 도달합니다.\n` +
            `자동으로 ${
              escalation.nextType === 'PERMANENT'
                ? '영구정지'
                : `${escalation.days}일 일시정지`
            }가 추가 부과됩니다.\n\n그래도 부과하시겠습니까?`
          }
          confirmLabel="예, 부과"
          tone="danger"
          pending={mutation.isPending}
          onCancel={() => setEscalateConfirmOpen(false)}
          onConfirm={submit}
        />
      )}

      {suspendConfirmOpen && (
        <ConfirmDialog
          title={
            user?.active_suspension
              ? '이미 제재 중인 유저입니다'
              : '제재하시겠습니까?'
          }
          body={
            user?.active_suspension
              ? `${userNickname} 은(는) 이미 ${
                  user.active_suspension.ends_at
                    ? `${formatDateTime(user.active_suspension.ends_at)}까지`
                    : '영구'
                } ${
                  SUSPENSION_TYPE_LABEL[user.active_suspension.suspension_type]
                } 상태입니다.\n새로운 ${SUSPENSION_TYPE_LABEL[type]}${
                  type === 'TEMPORARY' ? ` ${durationDays}일` : ''
                } 을(를) 추가 등록하시겠습니까?\n사유: ${reason}`
              : `${userNickname} 에게 ${SUSPENSION_TYPE_LABEL[type]}${
                  type === 'TEMPORARY' ? ` ${durationDays}일` : ''
                } 을(를) 부과합니다.\n사유: ${reason}`
          }
          confirmLabel="예, 부과"
          tone="danger"
          pending={mutation.isPending}
          onCancel={() => setSuspendConfirmOpen(false)}
          onConfirm={submit}
        />
      )}
    </Modal>
  )
}
