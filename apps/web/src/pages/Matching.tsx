import { useState } from 'react'
import {
  useProfileReviews,
  useApproveProfileMutation,
  useRejectProfileMutation,
  useUserDetail,
  formatDateTime,
  validators,
} from '@ef-fe-admin/shared'
import type { User } from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'
import Modal from '../components/ui/Modal'

export default function MatchingPage() {
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<User | null>(null)

  const { data, isLoading } = useProfileReviews({ page, size: 12 })

  return (
    <>
      <Topbar title="매칭 운영 도구" subtitle="프로필 심사 · 매칭 풀 관리" />

      <div className="section-title">✓ 프로필 심사 대기</div>

      {isLoading ? (
        <div className="p-10 text-center text-text-soft">불러오는 중...</div>
      ) : !data?.content?.length ? (
        <EmptyState title="심사할 프로필이 없습니다." />
      ) : (
        <div className="grid grid-cols-3 gap-4">
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
                <div className="flex-1">
                  <div className="font-extrabold">
                    {u.nickname}
                    <span className="text-text-soft ml-1 text-[11px] font-normal">#{u.scode}</span>
                  </div>
                  <div className="text-[11px] text-text-soft mt-0.5">{u.age}세 · {u.job ?? '-'}</div>
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
        <ProfileReviewModal userUuid={selected.uuid} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function ProfileReviewModal({ userUuid, onClose }: { userUuid: string; onClose: () => void }) {
  const { data: user, isLoading } = useUserDetail(userUuid)
  const [rejectMode, setRejectMode] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const approve = useApproveProfileMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })
  const reject = useRejectProfileMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleReject = () => {
    setError(null)
    const check = validators.rejectionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    reject.mutate({ userUuid, reason })
  }

  return (
    <Modal open onClose={onClose} title="프로필 심사" maxWidth={560}>
      {isLoading || !user ? (
        <div className="py-8 text-center text-text-soft">불러오는 중...</div>
      ) : (
        <div className="space-y-4">
          {user.photos && user.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {user.photos.map((p) => (
                <img
                  key={p.id}
                  src={p.url}
                  alt=""
                  className="w-24 h-32 rounded-md object-cover flex-shrink-0 border border-border"
                />
              ))}
            </div>
          )}
          <div>
            <div className="font-extrabold text-[16px]">
              {user.nickname}
              <span className="text-text-soft ml-1 text-[12px] font-normal">#{user.scode}</span>
            </div>
            <div className="text-[12px] text-text-soft mt-1">
              {user.age}세 · {user.job ?? '-'}
            </div>
          </div>
          {user.profile?.bio_message && (
            <div className="bg-surface-alt rounded-md p-3 text-[13px]">
              "{user.profile.bio_message}"
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-[12.5px]">
            <InfoRow label="MBTI" value={user.profile?.mbti ?? '-'} />
            <InfoRow label="키" value={user.profile?.height ? `${user.profile.height}cm` : '-'} />
            <InfoRow label="음주" value={user.profile?.drinking ?? '-'} />
            <InfoRow label="흡연" value={user.profile?.smoking ?? '-'} />
          </div>

          {rejectMode ? (
            <div className="space-y-3 border border-border-strong rounded-lg p-3 bg-surface-alt">
              <label className="form-label">반려 사유 (유저에 노출)</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
              <div className="flex justify-end gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => setRejectMode(false)}>
                  취소
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleReject} disabled={reject.isPending}>
                  반려
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => setRejectMode(true)}>
                반려
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => approve.mutate(userUuid)}
                disabled={approve.isPending}
              >
                {approve.isPending ? '처리 중...' : '승인'}
              </button>
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
      <div>{value}</div>
    </div>
  )
}
