import { useState } from 'react'
import { Zap } from 'lucide-react'
import {
  useProfileReviews,
  useApproveProfileMutation,
  useRejectProfileMutation,
  formatDateTime,
  validators,
} from '@ef-fe-admin/shared'
import type { User } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import UserProfilePanel from '../../components/user/UserProfilePanel'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function ProfileReviewsPage() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<User | null>(null)

  const { data, isLoading } = useProfileReviews({ page, size: 12 })

  return (
    <>
      <Topbar
        title="프로필 관리"
        subtitle="가입자 프로필 검수 · 부스트 부여로 노출을 끌어올립니다."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
        <SummaryCard
          label="검수 대기"
          value={`${data?.totalElements ?? 0}건`}
          tone="warn"
        />
        <SummaryCard label="오늘 승인" value="14건" />
        <SummaryCard label="오늘 반려" value="3건" />
      </div>

      <div className="section-title">검수 대기 프로필</div>

      {isLoading ? (
        <div className="card p-10 text-center text-text-soft">불러오는 중...</div>
      ) : !data?.content?.length ? (
        <EmptyState title="검수할 프로필이 없습니다." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {data.content.map((u) => (
            <button
              key={u.id}
              className="card text-left hover:shadow-md transition"
              onClick={() => setSelected(u)}
            >
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-point text-white flex items-center justify-center font-black text-[16px]">
                  {u.nickname?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-extrabold truncate">{u.nickname}</div>
                  <div className="text-[11px] text-text-soft mt-0.5">
                    {u.age}세 · {u.job ?? '-'}
                  </div>
                  <div className="text-[11px] text-text-soft mt-0.5">
                    가입: {formatDateTime(u.create_time)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />

      {selected && (
        <ProfileReviewSidePanel
          user={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

/* ===== 검수 사이드 패널 — UserProfilePanel + 승인/반려/부스트 액션 ===== */
function ProfileReviewSidePanel({
  user,
  onClose,
}: {
  user: User
  onClose: () => void
}) {
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [boostNote, setBoostNote] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'approve' | 'reject' | null>(null)

  const approve = useApproveProfileMutation({
    onSuccess: () => {
      setConfirmKind(null)
      onClose()
    },
    onError: (e) => {
      setError(e.message)
      setConfirmKind(null)
    },
  })
  const reject = useRejectProfileMutation({
    onSuccess: () => {
      setConfirmKind(null)
      onClose()
    },
    onError: (e) => {
      setError(e.message)
      setConfirmKind(null)
    },
  })

  const handleRejectClick = () => {
    setError(null)
    const check = validators.rejectionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    setConfirmKind('reject')
  }

  const handleBoost = () => {
    setBoostNote('✨ 24시간 부스트가 부여되었습니다.')
    setTimeout(() => setBoostNote(null), 2400)
  }

  const actions = (
    <div className="space-y-2">
      {boostNote && (
        <div className="bg-point-softer text-point-dark rounded-md p-2 text-[12.5px] font-bold">
          {boostNote}
        </div>
      )}
      {rejectMode ? (
        <div className="space-y-2">
          <label className="form-label text-[11px]">반려 사유 (유저에 노출)</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="예) 프로필 사진이 신원 확인 불가"
            style={{ minHeight: 80 }}
          />
          {error && (
            <div className="text-[12px] text-danger font-bold">{error}</div>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setRejectMode(false)}
            >
              취소
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleRejectClick}
              disabled={reject.isPending}
            >
              {reject.isPending ? '처리 중...' : '반려'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleBoost}
            title="이 유저에게 24시간 노출 부스트를 부여합니다"
          >
            <Zap size={13} /> 부스트 부여
          </button>
          <div className="flex-1" />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setRejectMode(true)}
          >
            반려
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setConfirmKind('approve')}
            disabled={approve.isPending}
          >
            {approve.isPending ? '처리 중...' : '승인'}
          </button>
        </div>
      )}
      {confirmKind === 'approve' && (
        <ConfirmDialog
          title="프로필을 승인하시겠습니까?"
          body={`@${user.nickname ?? user.uuid} 의 프로필이 정상 노출됩니다.`}
          confirmLabel="예, 승인"
          pending={approve.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => approve.mutate(user.uuid)}
        />
      )}
      {confirmKind === 'reject' && (
        <ConfirmDialog
          title="프로필을 반려하시겠습니까?"
          body="반려 사유가 유저에게 노출됩니다."
          confirmLabel="예, 반려"
          tone="danger"
          pending={reject.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => reject.mutate({ userUuid: user.uuid, reason })}
        />
      )}
    </div>
  )

  return (
    <UserProfilePanel
      open
      userId={user.id}
      onClose={onClose}
      actions={actions}
      headerExtra={<Badge tone="warn">검수 대기</Badge>}
    />
  )
}

function SummaryCard({
  label,
  value,
  tone = 'neutral',
}: {
  label: string
  value: string
  tone?: 'neutral' | 'warn' | 'danger'
}) {
  const color = tone === 'warn' ? 'text-warn' : tone === 'danger' ? 'text-danger' : 'text-text'
  return (
    <div className="card">
      <div className="text-[11px] text-text-soft font-bold">{label}</div>
      <div className={`text-[20px] sm:text-[22px] font-extrabold mt-1 ${color}`}>
        {value}
      </div>
    </div>
  )
}
