import { useState } from 'react'
import {
  useUserDetail,
  useSuspendUserMutation,
  formatDateTime,
  formatPhone,
  SUSPENSION_TYPE,
  validators,
  calcSuspensionEndsAt,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type { SuspensionType } from '@ef-fe-admin/shared'
import Modal from '../../components/ui/Modal'
import { UserStatusBadge } from '../../components/ui/Badge'

interface Props {
  userUuid: string
  onClose: () => void
}

export default function UserDetailModal({ userUuid, onClose }: Props) {
  const { data: user, isLoading } = useUserDetail(userUuid)
  const [suspendMode, setSuspendMode] = useState(false)
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setSuspendMode(false)
      setReason('')
      onClose()
    },
    onError: (e) => setError(e.message),
  })

  const handleSuspend = () => {
    setError(null)
    const reasonCheck = validators.suspensionReason(reason)
    if (!reasonCheck.valid) return setError(reasonCheck.message ?? '')
    suspendMutation.mutate({
      uuid: userUuid,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  return (
    <Modal open onClose={onClose} title="유저 상세" maxWidth={640}>
      {isLoading || !user ? (
        <div className="py-8 text-center text-text-soft">불러오는 중...</div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-point text-white flex items-center justify-center font-black text-[20px]">
              {user.nickname?.[0] ?? '?'}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="text-[16px] font-extrabold">
                  {user.nickname}
                  <span className="text-text-soft ml-1 text-[12px] font-normal">#{user.scode}</span>
                </div>
                <UserStatusBadge status={user.status} />
              </div>
              <div className="text-[11px] text-text-soft mt-1">UUID: {user.uuid}</div>
            </div>
            {!suspendMode && (
              <button className="btn btn-danger btn-sm" onClick={() => setSuspendMode(true)}>
                제재 발동
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <InfoRow label="로그인 ID" value={user.login_id} />
            <InfoRow label="전화번호" value={formatPhone(user.phone)} />
            <InfoRow label="나이" value={`${user.age}세`} />
            <InfoRow label="직업" value={user.job ?? '-'} />
            <InfoRow label="가입일" value={formatDateTime(user.create_time)} />
            <InfoRow label="최근 접속" value={formatDateTime(user.last_login_time)} />
            <InfoRow label="신고 이력" value={`${user.report_count ?? 0}건`} />
            <InfoRow label="총 결제" value={`${user.payment_total?.toLocaleString() ?? 0}원`} />
          </div>

          {user.active_suspension && (
            <div className="bg-danger-soft text-danger rounded-md px-4 py-3 text-[12px]">
              <div className="font-extrabold mb-1">현재 제재 중</div>
              <div>사유: {user.active_suspension.reason}</div>
              <div>종료: {formatDateTime(user.active_suspension.ends_at) || '영구'}</div>
            </div>
          )}

          {suspendMode && (
            <div className="border border-border-strong rounded-lg p-4 space-y-3 bg-surface-alt">
              <div className="font-extrabold text-[13px]">제재 발동</div>
              <div>
                <label className="form-label">제재 유형</label>
                <div className="flex gap-2">
                  {(Object.keys(SUSPENSION_TYPE) as SuspensionType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`chip ${type === t ? 'active' : ''}`}
                      onClick={() => setType(t)}
                    >
                      {t === 'WARNING' ? '경고' : t === 'TEMPORARY' ? '일시정지' : '영구정지'}
                    </button>
                  ))}
                </div>
              </div>
              {type === 'TEMPORARY' && (
                <div>
                  <label className="form-label">기간</label>
                  <div className="flex gap-2">
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
                <label className="form-label">사유</label>
                <textarea
                  className="form-textarea"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="제재 사유 (유저에게 통보됨)"
                />
              </div>
              {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setSuspendMode(false)}>
                  취소
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleSuspend}
                  disabled={suspendMutation.isPending}
                >
                  {suspendMutation.isPending ? '처리 중...' : '제재 발동'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className="text-text">{value}</div>
    </div>
  )
}
