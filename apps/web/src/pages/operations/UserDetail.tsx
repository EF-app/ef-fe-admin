import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  ShieldOff,
  Crown,
  MessageSquare,
  StickyNote,
  Scale,
  ShieldAlert,
  AlertTriangle,
  UserX,
  UserMinus,
  Eye,
  EyeOff,
  Search,
  Send,
  UserCog,
  Monitor,
  Smartphone,
  CheckCircle2,
  XCircle,
  Zap,
} from 'lucide-react'
import {
  useUserDetail,
  useUserBalComments,
  usePostItsBe,
  useSuspendUserMutation,
  useLiftAllSuspensionsForUserMutation,
  useCancelWithdrawalMutation,
  useHidePostItBeMutation,
  useApproveProfileMutation,
  useRejectProfileMutation,
  formatDateTime,
  formatDate,
  formatCurrency,
  formatNumber,
  PROFILE_STATUS_LABEL,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  POST_IT_CATEGORY_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  REPORT_STATUS_LABEL,
  LOGIN_DEVICE_LABEL,
  LOGIN_FAILURE_REASON_LABEL,
  validators,
  calcSuspensionEndsAt,
  previewWarningEscalation,
  WARNING_WINDOW_DAYS,
  WARNING_THRESHOLD,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type {
  SuspensionType,
  PostItCategory,
  ReportTargetType,
  ReportStatus,
  LoginDevice,
  LoginFailureReason,
  ProfileStatus,
  UserDetail as UserDetailType,
  UserPhoto,
  PostItBe,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { UserStatusBadge, Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import SuspendInlineModal from '../../components/suspension/SuspendInlineModal'
import UserProfilePanel from '../../components/user/UserProfilePanel'

const PAGE_SIZE = 10

/** 긴 본문을 max 글자로 자르고 … 추가. */
function truncate(s: string | null | undefined, max: number): string {
  if (!s) return ''
  return s.length > max ? `${s.slice(0, max)}…` : s
}

/** Integer YYYYMMDD (예: 19980314) → "1998-03-14". 0/null/유효성 안 맞으면 '미입력'. */
function formatBirth(birth?: number | null): string {
  if (birth == null || birth <= 0) return '미입력'
  const s = String(birth)
  if (s.length !== 8) return '미입력'
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

type MatchHistory = NonNullable<UserDetailType['recent_matches']>
type Suspensions = NonNullable<UserDetailType['suspensions']>
type RecentReports = NonNullable<UserDetailType['recent_reports']>
type MadeReports = NonNullable<UserDetailType['recent_made_reports']>
type Blocks = NonNullable<UserDetailType['blocks']>
type BlockedBy = NonNullable<UserDetailType['blocked_by']>
type BalComments = NonNullable<UserDetailType['recent_bal_comments']>
type LoginLogs = NonNullable<UserDetailType['recent_login_logs']>

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const userId = id ? Number(id) : undefined
  const navigate = useNavigate()
  const { data: user, isLoading } = useUserDetail(userId)

  const [suspendMode, setSuspendMode] = useState(false)
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState<number>(7)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [liftReason, setLiftReason] = useState('')
  const [liftMode, setLiftMode] = useState(false)

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setSuspendMode(false)
      setReason('')
      setEscalateConfirmOpen(false)
      setSuspendConfirmOpen(false)
    },
    onError: (e) => {
      setError(e.message)
      setEscalateConfirmOpen(false)
      setSuspendConfirmOpen(false)
    },
  })
  const [escalateConfirmOpen, setEscalateConfirmOpen] = useState(false)
  const escalation = previewWarningEscalation(
    user?.recent_warning_count ?? 0,
    user?.last_temporary_duration_days ?? null,
  )
  const liftMutation = useLiftAllSuspensionsForUserMutation({
    onSuccess: () => {
      setLiftMode(false)
      setLiftReason('')
    },
    onError: (e) => setError(e.message),
  })
  const cancelWithdrawalMutation = useCancelWithdrawalMutation()
  const [confirmCancelWithdrawOpen, setConfirmCancelWithdrawOpen] = useState(false)
  const [suspendConfirmOpen, setSuspendConfirmOpen] = useState(false)

  const submitSuspension = () => {
    if (userId == null) return
    suspendMutation.mutate({
      uuid: userId,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  const handleSuspend = () => {
    setError(null)
    const reasonCheck = validators.suspensionReason(reason)
    if (!reasonCheck.valid) return setError(reasonCheck.message ?? '')
    if (userId == null) return
    // 에스컬레이션 케이스면 강한 경고 모달, 그 외엔 일반 부과 확인 모달
    if (type === 'WARNING' && escalation.willEscalate) {
      setEscalateConfirmOpen(true)
      return
    }
    setSuspendConfirmOpen(true)
  }

  const handleLift = () => {
    if (!user?.active_suspension || userId == null) return
    setError(null)
    if (!liftReason.trim()) return setError('해제 사유를 입력해주세요.')
    // WARNING 제외, TEMPORARY/PERMANENT 모두 일괄 해제
    liftMutation.mutate({
      userId,
      payload: { lifted_reason: liftReason },
    })
  }

  if (isLoading || !user) {
    return (
      <>
        <Topbar title="유저 상세" />
        <div className="card text-center py-12 text-text-soft text-[13px]">
          불러오는 중...
        </div>
      </>
    )
  }

  const isPremiumActive =
    !!user.is_premium &&
    !!user.premium_until &&
    new Date(user.premium_until) > new Date()

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate('/users')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 유저 목록으로
        </button>
      </div>

      {/* ===== 상단 풀폭 헤더 — 아바타 / 이름 / 식별자 / 액션 ===== */}
      <UserHeader
        user={user}
        isPremiumActive={isPremiumActive}
        onWithdrawCancelClick={() => setConfirmCancelWithdrawOpen(true)}
        withdrawCancelPending={cancelWithdrawalMutation.isPending}
        onSuspendClick={() => {
          setSuspendMode(true)
          setLiftMode(false)
        }}
        onLiftClick={() => {
          setLiftMode(true)
          setSuspendMode(false)
        }}
      />

      {/* ===== 통계 5컬럼 스트립 ===== */}
      <StatsStrip user={user} isPremiumActive={isPremiumActive} />

      {/* ===== 활성 제재 안내 — 헤더 액션과 별개로 상세 안내 ===== */}
      {user.active_suspension && (
        <div className="card mb-3 border-l-4 border-l-danger">
          <div className="text-[13px] font-extrabold text-danger mb-1">
            현재 제재 중 ·{' '}
            {SUSPENSION_TYPE_LABEL[user.active_suspension.suspension_type]}
          </div>
          <div className="text-[12.5px]">사유: {user.active_suspension.reason}</div>
          <div className="text-[11.5px] text-text-soft mt-1">
            {formatDateTime(user.active_suspension.starts_at)} →{' '}
            {user.active_suspension.ends_at
              ? formatDateTime(user.active_suspension.ends_at)
              : '영구'}
          </div>
        </div>
      )}

      {/* ===== 탈퇴 배너 ===== */}
      {user.is_withdraw && user.withdraw_date && (
        <WithdrawBanner
          withdrawDate={user.withdraw_date}
          onCancel={() => setConfirmCancelWithdrawOpen(true)}
          isPending={cancelWithdrawalMutation.isPending}
        />
      )}

      {/* ===== 제재 발동/해제 인라인 폼 ===== */}
      {suspendMode && (
        <div className="card mb-3 bg-surface-alt">
          <div className="font-extrabold text-[14px] mb-3">제재 발동</div>
          {(user.recent_warning_count ?? 0) > 0 && (
            <div className="mb-3 text-[12px] text-text-sub bg-warn-soft rounded-md px-3 py-2">
              최근 {WARNING_WINDOW_DAYS}일 경고{' '}
              <strong className="text-warn-dark">{user.recent_warning_count}</strong>회
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
          <div className="mb-3">
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
            <div className="mb-3">
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
          <div className="mb-3">
            <label className="form-label">사유 (유저에게 통보됨)</label>
            <textarea
              className="form-textarea"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="제재 사유"
            />
          </div>
          {error && <div className="text-[12px] text-danger font-bold mb-2">{error}</div>}
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

      {liftMode && user.active_suspension && (
        <div className="card mb-3 bg-surface-alt">
          <div className="font-extrabold text-[14px] mb-3">제재 해제</div>
          <div className="mb-3">
            <label className="form-label">해제 사유</label>
            <textarea
              className="form-textarea"
              value={liftReason}
              onChange={(e) => setLiftReason(e.target.value)}
              placeholder="이의 신청 수용, 오인 신고 확인 등"
            />
          </div>
          {error && <div className="text-[12px] text-danger font-bold mb-2">{error}</div>}
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => setLiftMode(false)}>
              취소
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleLift}
              disabled={liftMutation.isPending}
            >
              {liftMutation.isPending ? '처리 중...' : '해제'}
            </button>
          </div>
        </div>
      )}

      {/* ===== 탭 + 컨텐츠 ===== */}
      <MainContent user={user} userId={user.id} isPremiumActive={isPremiumActive} />

      {confirmCancelWithdrawOpen && (
        <ConfirmDialog
          title="탈퇴 신청을 철회 처리하시겠습니까?"
          body="30일 유예가 종료되고 계정이 정상 복구됩니다."
          confirmLabel="예, 철회"
          tone="warn"
          pending={cancelWithdrawalMutation.isPending}
          onCancel={() => setConfirmCancelWithdrawOpen(false)}
          onConfirm={() => {
            if (userId != null) {
              cancelWithdrawalMutation.mutate(
                { uuid: userId },
                { onSettled: () => setConfirmCancelWithdrawOpen(false) }
              )
            }
          }}
        />
      )}

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
          pending={suspendMutation.isPending}
          onCancel={() => setEscalateConfirmOpen(false)}
          onConfirm={submitSuspension}
        />
      )}

      {suspendConfirmOpen && (
        <ConfirmDialog
          title="제재하시겠습니까?"
          body={
            `${user.nickname ?? ''} 에게 ${SUSPENSION_TYPE_LABEL[type]}${
              type === 'TEMPORARY' ? ` ${durationDays}일` : ''
            } 을(를) 부과합니다.\n사유: ${reason}`
          }
          confirmLabel="예, 부과"
          tone="danger"
          pending={suspendMutation.isPending}
          onCancel={() => setSuspendConfirmOpen(false)}
          onConfirm={submitSuspension}
        />
      )}
    </>
  )
}

/* ===== 상단 헤더 — 아바타 / 이름 / 식별자 / 액션 ===== */
function UserHeader({
  user,
  isPremiumActive,
  onWithdrawCancelClick,
  withdrawCancelPending,
  onSuspendClick,
  onLiftClick,
}: {
  user: UserDetailType
  isPremiumActive: boolean
  onWithdrawCancelClick: () => void
  withdrawCancelPending: boolean
  onSuspendClick: () => void
  onLiftClick: () => void
}) {
  const initial = user.nickname?.[0] ?? '?'
  const mainPhoto = (user.photos ?? []).find((p) => p.is_main) ?? user.photos?.[0]

  return (
    <div className="card mb-3">
      <div className="flex items-start gap-4 flex-wrap">
        {/* 아바타 — 메인 사진 우선, 없으면 이니셜 */}
        <div className="w-16 h-16 rounded-full bg-point text-white flex items-center justify-center font-black text-[28px] flex-shrink-0 overflow-hidden">
          {mainPhoto ? (
            <img src={mainPhoto.url} alt="" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* 이름 + 상태 배지 */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-extrabold text-[18px] truncate">{user.nickname}</div>
            <UserStatusBadge status={user.status} />
            {isPremiumActive && (
              <Badge tone="warn">
                <Crown size={9} className="inline" /> 프리미엄
              </Badge>
            )}
            {user.is_withdraw && <Badge tone="neutral">탈퇴</Badge>}
          </div>

          {/* ID + UUID */}
          <div className="flex items-center gap-3 text-[12px] text-text-soft mt-1 flex-wrap">
            <span>
              <span className="text-text-soft">ID</span>{' '}
              <span className="font-bold text-text-sub">#{user.id}</span>
            </span>
            <span className="text-text-soft">·</span>
            <span className="font-mono text-[11.5px]" title={user.uuid}>
              {user.uuid}
            </span>
            <span className="text-text-soft">·</span>
            <span className="text-text-sub">@{user.login_id}</span>
          </div>
        </div>

        {/* 우측 액션 영역 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user.is_withdraw && (
            <button
              className="btn btn-warn btn-sm"
              onClick={onWithdrawCancelClick}
              disabled={withdrawCancelPending}
            >
              <UserCog size={13} /> 탈퇴 철회
            </button>
          )}
          {user.active_suspension ? (
            <button className="btn btn-secondary btn-sm" onClick={onLiftClick}>
              <ShieldOff size={13} /> 제재 해제
            </button>
          ) : (
            <button className="btn btn-danger btn-sm" onClick={onSuspendClick}>
              <Ban size={13} /> 제재 발동
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* ===== 통계 5컬럼 스트립 ===== */
function StatsStrip({
  user,
  isPremiumActive,
}: {
  user: UserDetailType
  isPremiumActive: boolean
}) {
  return (
    <div className="card mb-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCell label="가입일" value={formatDate(user.create_time)} />
        <StatCell label="최근 접속" value={formatDateTime(user.last_login_time)} />
        <StatCell label="잉크 잔액" value={`${formatNumber(user.ink_balance ?? 0)}`} />
        <StatCell
          label="총 결제 금액"
          value={formatCurrency(user.payment_total ?? 0)}
        />
        <StatCell
          label="프리미엄"
          value={
            isPremiumActive
              ? `~ ${formatDate(user.premium_until!)}`
              : '미가입'
          }
          tone={isPremiumActive ? 'point' : undefined}
        />
      </div>
    </div>
  )
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'point'
}) {
  return (
    <div>
      <div className="text-[11px] text-text-soft font-bold mb-1">{label}</div>
      <div
        className={`text-[14px] font-extrabold break-all ${
          tone === 'point' ? 'text-point-dark' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

/**
 * 프로필 탭용 — 큰 정사각형 메인 + 가로 썸네일 스트립.
 * is_main = true 사진을 우선 노출. 사진 없으면 닉네임 이니셜 fallback.
 */
function ProfilePhotoBlock({
  photos,
  nickname,
}: {
  photos: UserPhoto[]
  nickname?: string
}) {
  // is_main 우선, 동순위는 order_no 오름차순으로 정렬
  const sorted = [...photos].sort((a, b) => {
    if (a.is_main !== b.is_main) return a.is_main ? -1 : 1
    return (a.order_no ?? 0) - (b.order_no ?? 0)
  })
  const [idx, setIdx] = useState(0)
  const safeIdx = Math.min(idx, Math.max(0, sorted.length - 1))
  const current = sorted[safeIdx]

  if (sorted.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg bg-point text-white flex items-center justify-center font-black text-[64px] overflow-hidden">
        {nickname?.[0] ?? '?'}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="w-full aspect-square rounded-lg overflow-hidden bg-surface-alt">
        <img
          src={current.url}
          alt=""
          className="w-full h-full object-cover transition-opacity"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-1.5 overflow-x-auto">
          {sorted.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition ${
                i === safeIdx
                  ? 'border-point ring-1 ring-point/30'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              title={p.is_main ? '대표 사진' : `사진 ${i + 1}`}
            >
              <img src={p.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function InfoRow({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-[12.5px]">
      <dt className="text-text-soft flex-shrink-0">{label}</dt>
      <dd className="font-bold text-right break-all min-w-0">{value}</dd>
    </div>
  )
}

/* ===== 메인 — 풀폭 탭 ===== */
type MainTab =
  | 'profile'
  | 'matches'
  | 'content'
  | 'access'
  | 'suspensions'
  | 'reports'
  | 'blocks'

function MainContent({
  user,
  userId,
  isPremiumActive,
}: {
  user: UserDetailType
  userId: number
  isPremiumActive: boolean
}) {
  const [tab, setTab] = useState<MainTab>('profile')

  const matchCount = user.recent_matches?.length ?? 0
  const reports = user.recent_reports ?? []
  const madeReports = user.recent_made_reports ?? []
  const blocks = user.blocks ?? []
  const blockedBy = user.blocked_by ?? []
  const suspensions = user.suspensions ?? []
  const loginLogs = user.recent_login_logs ?? []

  return (
    <>
      {/* 탭 행 (별도 카드) */}
      <div className="card mb-3 p-0">
        <div className="px-2 flex items-center flex-wrap">
          <TopTab
            active={tab === 'profile'}
            onClick={() => setTab('profile')}
            icon={<UserCog size={14} />}
            label="프로필"
          />
          <TopTab
            active={tab === 'matches'}
            onClick={() => setTab('matches')}
            icon={<MessageSquare size={14} />}
            label="매칭이력"
            suffix={`(${matchCount})`}
          />
          <TopTab
            active={tab === 'content'}
            onClick={() => setTab('content')}
            icon={<StickyNote size={14} />}
            label="작성한글"
          />
          <TopTab
            active={tab === 'access'}
            onClick={() => setTab('access')}
            icon={<Monitor size={14} />}
            label="접속이력"
          />
          <TopTab
            active={tab === 'suspensions'}
            onClick={() => setTab('suspensions')}
            icon={<ShieldAlert size={14} />}
            label="제재이력"
            suffix={`(${suspensions.length})`}
          />
          <TopTab
            active={tab === 'reports'}
            onClick={() => setTab('reports')}
            icon={<AlertTriangle size={14} />}
            label="신고이력"
            suffix={`(${reports.length + madeReports.length})`}
          />
          <TopTab
            active={tab === 'blocks'}
            onClick={() => setTab('blocks')}
            icon={<UserX size={14} />}
            label="차단이력"
            suffix={`(${blocks.length + blockedBy.length})`}
          />
        </div>
      </div>

      {/* 탭 컨텐츠 (별도 카드) */}
      <div className="card">
        {tab === 'profile' && <ProfileTab user={user} isPremiumActive={isPremiumActive} />}
        {tab === 'matches' && (
          <MatchHistoryTable matches={user.recent_matches ?? []} />
        )}
        {tab === 'content' && (
          <WrittenContentTabs userId={userId} userNickname={user.nickname} />
        )}
        {tab === 'access' && <LoginLogList items={loginLogs} />}
        {tab === 'suspensions' && <SuspensionList items={suspensions} />}
        {tab === 'reports' && (
          <ReportTabs reports={reports} madeReports={madeReports} />
        )}
        {tab === 'blocks' && (
          <BlockTabs blocks={blocks} blockedBy={blockedBy} />
        )}
      </div>
    </>
  )
}

/* ===== 프로필 탭 — 좌(사진 + BIO + 프로필 보기 + 기본정보) / 우(결제·구독) ===== */
function ProfileTab({
  user,
  isPremiumActive,
}: {
  user: UserDetailType
  isPremiumActive: boolean
}) {
  const profile = user.profile
  const [profileOpen, setProfileOpen] = useState(false)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
      {/* 좌측: [프로필 보기] → 사진 (BIO 는 우측 정보 영역 아래로 이동) */}
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="btn btn-secondary btn-sm w-full justify-center"
        >
          프로필 보기
        </button>

        <ProfilePhotoBlock photos={user.photos ?? []} nickname={user.nickname} />

        <UserProfilePanel
          open={profileOpen}
          userId={user.id}
          onClose={() => setProfileOpen(false)}
          actions={
            <ProfileReviewActions
              userId={user.id}
              currentStatus={user.profile_status}
            />
          }
        />
      </div>

      {/* 우측: (위) 기본정보 / 결제·구독+접속·가입 2단  →  (아래) BIO 전체 폭 */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* 좌: 기본 정보 */}
          <section>
            <SectionHeader>기본 정보</SectionHeader>
            <dl className="space-y-4">
              <InfoRow label="UUID" value={<span className="font-mono text-[11.5px]">{user.uuid}</span>} />
              <InfoRow label="상태" value={<UserStatusBadge status={user.status} />} />
              <InfoRow label="닉네임" value={user.nickname} />
              <InfoRow label="로그인 ID" value={user.login_id} />
              <InfoRow label="나이" value={`${user.age}세`} />
              <InfoRow label="생일" value={formatBirth(user.birth)} />
              <InfoRow label="이메일" value={user.email ?? '미입력'} />
              <InfoRow label="지역" value={user.area ?? '미입력'} />
              <InfoRow label="전화번호" value={user.phone || '미입력'} />
              {user.is_withdraw && (
                <InfoRow
                  label="탈퇴일"
                  value={user.withdraw_date ? formatDateTime(user.withdraw_date) : '-'}
                />
              )}
            </dl>
          </section>

          {/* 우: 결제·구독 + 접속·가입 (세로 스택) */}
          <div className="space-y-5">
            <section>
              <SectionHeader>결제 · 구독</SectionHeader>
              <dl className="space-y-4">
                <InfoRow
                  label="총 결제 금액"
                  value={formatCurrency(user.payment_total ?? 0)}
                />
                <InfoRow
                  label="프리미엄"
                  value={
                    isPremiumActive
                      ? `~ ${formatDate(user.premium_until!)}`
                      : '미가입'
                  }
                />
                <InfoRow
                  label="잉크 잔액"
                  value={`${formatNumber(user.ink_balance ?? 0)}`}
                />
              </dl>
            </section>

            <section>
              <SectionHeader>접속 / 가입</SectionHeader>
              <dl className="space-y-4">
                <InfoRow label="가입" value={formatDateTime(user.create_time)} />
                <InfoRow label="최근 접속" value={formatDateTime(user.last_login_time)} />
              </dl>
            </section>
          </div>
        </div>

        {/* BIO — 우측 영역 전체 폭, 정보 카드들 아래 */}
        <section>
          <SectionHeader>BIO</SectionHeader>
          <div className="bg-surface-alt rounded-md p-3 text-[12.5px] whitespace-pre-wrap break-words min-h-[60px]">
            {profile?.bio_message || '미입력'}
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-extrabold text-text-soft tracking-wider uppercase mb-3">
      {children}
    </div>
  )
}

function TopTab({
  active,
  onClick,
  icon,
  label,
  suffix,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  suffix?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-extrabold whitespace-nowrap transition border-b-2 -mb-px ${
        active
          ? 'border-point text-point-dark'
          : 'border-transparent text-text-soft hover:text-point-dark'
      }`}
    >
      {icon}
      {label}
      {suffix && (
        <span className="text-[10.5px] font-bold text-text-soft">{suffix}</span>
      )}
    </button>
  )
}

/* ===== 박스 내 검색·페이지네이션 헬퍼 ===== */
function useSearchPager<T>(
  items: T[],
  matcher: (item: T, kw: string) => boolean,
  pageSize: number = PAGE_SIZE
) {
  const [keyword, setKeyword] = useState('')
  const [page, setPage] = useState(0)

  const filtered = useMemo(() => {
    if (!keyword.trim()) return items
    const kw = keyword.toLowerCase()
    return items.filter((i) => matcher(i, kw))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, keyword])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const slice = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)

  return {
    keyword,
    setKeyword: (v: string) => {
      setKeyword(v)
      setPage(0)
    },
    page: safePage,
    setPage,
    totalPages,
    slice,
    totalElements: filtered.length,
  }
}

function SearchBar({
  value,
  onChange,
  placeholder,
  total,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  total: number
}) {
  return (
    <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
      <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-1.5 border border-border-strong flex-1 min-w-[180px] max-w-[280px]">
        <Search size={12} className="text-text-soft" />
        <input
          placeholder={placeholder}
          className="bg-transparent outline-none flex-1 text-[12px]"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <span className="text-[10.5px] text-text-soft">총 {total}건</span>
    </div>
  )
}

function ScrollBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface overflow-hidden [&_tbody>tr:last-child>td]:border-b-0">
      <div>{children}</div>
    </div>
  )
}

/* ===== 매칭 이력 ===== */
function MatchHistoryTable({ matches }: { matches: MatchHistory }) {
  const pager = useSearchPager(matches, (m, kw) =>
    m.partner_nickname.toLowerCase().includes(kw)
  )
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="상대 닉네임 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="매칭 이력이 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>상대 닉네임</th>
                <th>매칭 시각</th>
                <th>최근 메시지</th>
                <th>대화 수</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((m) => (
                <tr key={m.id}>
                  <td className="font-extrabold flex items-center gap-1">
                    <MessageSquare size={12} className="text-text-soft" />
                    {m.partner_nickname}
                  </td>
                  <td className="text-text-sub">{formatDateTime(m.matched_at)}</td>
                  <td className="text-text-sub">
                    {m.last_message_at ? formatDateTime(m.last_message_at) : '-'}
                  </td>
                  <td className="text-text-sub">{m.message_count}</td>
                  <td>
                    {m.is_active ? (
                      <Badge tone="normal">활성</Badge>
                    ) : (
                      <Badge tone="neutral">종료</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination
        page={pager.page}
        totalPages={pager.totalPages}
        onChange={pager.setPage}
      />
    </>
  )
}

/* ===== 작성 글 ===== */
// 밸런스 댓글 / 포스트잇은 콘텐츠 도메인 API 를 별도 호출 (유저 상세 응답에 포함 안 됨).
function WrittenContentTabs({
  userId,
  userNickname,
}: {
  userId: number
  userNickname: string
}) {
  const [tab, setTab] = useState<'bal' | 'post'>('bal')
  // 인라인 제재 모달 — 어떤 콘텐츠에서 호출됐는지 컨텍스트 전달
  const [suspendContext, setSuspendContext] = useState<string | null>(null)

  // 탭 라벨 개수 — BalCommentList/PostItList 와 동일 queryKey 라 캐시 공유 (중복 fetch 없음)
  const { data: balData } = useUserBalComments(userId)
  const balComments = balData ?? []
  const balGameCount = new Set(balComments.map((c) => c.game_id)).size
  const { data: postData } = usePostItsBe({ userId, size: 100 })
  const postCount = postData?.content?.length ?? 0

  return (
    <>
      <InnerTabs
        tabs={[
          {
            value: 'bal',
            label: `밸런스 댓글 ${balGameCount}(${balComments.length})`,
            icon: <Scale size={12} />,
          },
          {
            value: 'post',
            label: `포스트잇 ${postCount}`,
            icon: <StickyNote size={12} />,
          },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'bal' ? (
        <BalCommentList
          userId={userId}
          onSuspend={(ctx) => setSuspendContext(ctx)}
        />
      ) : (
        <PostItList
          userId={userId}
          onSuspend={(ctx) => setSuspendContext(ctx)}
        />
      )}

      {suspendContext != null && (
        <SuspendInlineModal
          userId={userId}
          userNickname={userNickname}
          contextPrefill={suspendContext}
          onClose={() => setSuspendContext(null)}
        />
      )}
    </>
  )
}

type BalComment = BalComments[number]

interface BalCommentGroup {
  gameId: number
  optionA: string
  optionB: string
  /** create_time ASC (오래된 댓글 먼저) */
  comments: BalComment[]
  /** 그룹 정렬용 — 그룹 내 가장 최근 댓글 시각 */
  latest: string
}

/** 같은 밸런스 게임끼리 묶음 — 그룹은 최신순(DESC), 그룹 내 댓글은 오래된순(ASC) */
function buildBalCommentGroups(comments: BalComments): BalCommentGroup[] {
  const map = new Map<number, BalComment[]>()
  for (const c of comments) {
    const arr = map.get(c.game_id) ?? []
    arr.push(c)
    map.set(c.game_id, arr)
  }
  const groups = Array.from(map.entries()).map(([gameId, list]) => {
    const sorted = [...list].sort((a, b) =>
      a.create_time.localeCompare(b.create_time)
    )
    return {
      gameId,
      optionA: sorted[0].game_option_a,
      optionB: sorted[0].game_option_b,
      comments: sorted,
      latest: sorted[sorted.length - 1].create_time,
    }
  })
  groups.sort((a, b) => b.latest.localeCompare(a.latest))
  return groups
}

function BalCommentList({
  userId,
  onSuspend,
}: {
  userId: number
  onSuspend: (contextPrefill: string) => void
}) {
  const { data } = useUserBalComments(userId)
  const comments: BalComments = data ?? []
  const groups = useMemo(() => buildBalCommentGroups(comments), [comments])
  // 게임 그룹 단위 페이지네이션 — 한 페이지에 게임 3개
  const pager = useSearchPager(
    groups,
    (g, kw) =>
      g.optionA.toLowerCase().includes(kw) ||
      g.optionB.toLowerCase().includes(kw) ||
      g.comments.some((c) => c.content.toLowerCase().includes(kw)),
    2
  )
  const [hidden, setHidden] = useState<Set<number>>(new Set())
  const toggleHide = (id: number) => {
    setHidden((s) => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="댓글 내용 / 옵션 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="작성한 밸런스 댓글이 없습니다." />
        ) : (
          <div className="divide-y divide-border">
            {pager.slice.map((g) => (
              <div key={g.gameId} className="p-3 bg-surface">
                {/* 게임 헤더 */}
                <div
                  className="flex items-center justify-between gap-2 mb-3 flex-wrap rounded-xl px-3 py-2.5 border"
                  style={{
                    backgroundColor: 'rgba(150,134,191,0.10)',
                    borderColor: 'rgba(150,134,191,0.22)',
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="rounded-lg px-2.5 py-1 text-[13.5px] font-extrabold break-keep"
                      style={{
                        backgroundColor: 'rgba(150,134,191,0.16)',
                        color: '#6A579A',
                      }}
                    >
                      {g.optionA}
                    </span>
                    <span className="text-[11px] font-extrabold text-white bg-point rounded-md px-2 py-1 shadow-point flex-shrink-0">
                      VS
                    </span>
                    <span
                      className="rounded-lg px-2.5 py-1 text-[13.5px] font-extrabold break-keep"
                      style={{
                        backgroundColor: 'rgba(150,134,191,0.28)',
                        color: '#6A579A',
                      }}
                    >
                      {g.optionB}
                    </span>
                  </div>
                  <span className="text-[11px] text-point-dark font-extrabold flex-shrink-0">
                    #{g.gameId} · 댓글 {g.comments.length}
                  </span>
                </div>
                {/* 댓글 — 같은 게임 내 오래된순 */}
                <div className="ml-1.5 pl-3 border-l-2 border-border space-y-3">
                  {g.comments.map((c) => {
                    const isHidden = hidden.has(c.id)
                    return (
                      <div key={c.id}>
                        <div className="flex items-center gap-2 mb-1 text-[11px] text-text-soft flex-wrap">
                          {c.vote_choice && (
                            <span className="text-[10.5px] font-bold text-point-dark">
                              투표: {c.vote_choice}
                            </span>
                          )}
                          {isHidden && <Badge tone="warn">숨김</Badge>}
                          <span className="ml-auto">{formatDateTime(c.create_time)}</span>
                        </div>
                        <div
                          className={`text-[13px] font-bold break-words ${
                            isHidden ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          {c.content}
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <div className="text-[11px] text-text-soft">
                            ❤ {c.like_count} · 💬 {c.reply_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className={`btn btn-sm ${isHidden ? 'btn-primary' : 'btn-danger'}`}
                              onClick={() => {
                                if (isHidden) {
                                  toggleHide(c.id)
                                } else if (confirm('이 댓글을 숨김 처리할까요?')) {
                                  toggleHide(c.id)
                                }
                              }}
                            >
                              {isHidden ? (
                                <>
                                  <Eye size={12} /> 해제
                                </>
                              ) : (
                                <>
                                  <EyeOff size={12} /> 숨김
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() =>
                                onSuspend(
                                  `밸런스 댓글 #${c.id} (${g.optionA} vs ${g.optionB})\n본문: "${truncate(c.content, 200)}"\n사유: `
                                )
                              }
                            >
                              <Ban size={12} /> 제재
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function PostItList({
  userId,
  onSuspend,
}: {
  userId: number
  onSuspend: (contextPrefill: string) => void
}) {
  // 콘텐츠 도메인 API 재사용 — GET /v1/admin/post-its?userId=
  const { data } = usePostItsBe({ userId, size: 100 })
  const postIts: PostItBe[] = data?.content ?? []
  const pager = useSearchPager(postIts, (p, kw) =>
    p.content.toLowerCase().includes(kw)
  )
  const hideMutation = useHidePostItBeMutation()
  const [confirmHideId, setConfirmHideId] = useState<number | null>(null)

  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="포스트잇 본문 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="작성한 포스트잇이 없습니다." />
        ) : (
          <div className="divide-y divide-border">
            {pager.slice.map((p) => (
              <div key={p.id} className="p-3 bg-surface">
                <div className="flex items-center gap-1.5 flex-wrap mb-1">
                  <Badge tone="point">
                    {POST_IT_CATEGORY_LABEL[p.categoryCode as PostItCategory] ??
                      p.categoryCode}
                  </Badge>
                  {p.hidden && <Badge tone="danger">숨김</Badge>}
                  {p.deleted && <Badge tone="neutral">삭제</Badge>}
                  {p.reportCount > 0 && (
                    <Badge tone="warn">신고 {p.reportCount}</Badge>
                  )}
                </div>
                <div className="text-[13px] break-words">{p.content}</div>
                <div className="flex items-center justify-between mt-2">
                  <div className="text-[11px] text-text-soft">
                    {formatDateTime(p.createTime)} · 답글 {p.replyCount}
                  </div>
                  {!p.deleted && (
                    <div className="flex items-center gap-1">
                      {!p.hidden && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={hideMutation.isPending}
                          onClick={() => setConfirmHideId(p.id)}
                        >
                          <EyeOff size={12} /> 숨김
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          onSuspend(
                            `포스트잇 #${p.id} (${POST_IT_CATEGORY_LABEL[p.categoryCode as PostItCategory] ?? p.categoryCode})\n본문: "${truncate(p.content, 200)}"\n사유: `
                          )
                        }
                      >
                        <Ban size={12} /> 제재
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />

      {confirmHideId != null && (
        <ConfirmDialog
          title="포스트잇을 숨김 처리하시겠습니까?"
          body="유저 화면에서 즉시 가려집니다."
          confirmLabel="예, 숨김"
          tone="danger"
          pending={hideMutation.isPending}
          onCancel={() => setConfirmHideId(null)}
          onConfirm={() =>
            hideMutation.mutate(
              { id: confirmHideId },
              { onSettled: () => setConfirmHideId(null) }
            )
          }
        />
      )}
    </>
  )
}

/* ===== 신고 — 받은 + 낸 ===== */
function ReportTabs({
  reports,
  madeReports,
}: {
  reports: RecentReports
  madeReports: MadeReports
}) {
  const [tab, setTab] = useState<'rep' | 'made'>('rep')
  return (
    <>
      <InnerTabs
        tabs={[
          { value: 'rep', label: `받은 신고 (${reports.length})`, icon: <AlertTriangle size={12} /> },
          { value: 'made', label: `낸 신고 (${madeReports.length})`, icon: <Send size={12} /> },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'rep' && <ReceivedReportList items={reports} />}
      {tab === 'made' && <MadeReportList items={madeReports} />}
    </>
  )
}

/* ===== 차단 — 차단한 + 차단당한 ===== */
function BlockTabs({
  blocks,
  blockedBy,
}: {
  blocks: Blocks
  blockedBy: BlockedBy
}) {
  const [tab, setTab] = useState<'blk' | 'bby'>('blk')
  return (
    <>
      <InnerTabs
        tabs={[
          { value: 'blk', label: `차단한 (${blocks.length})`, icon: <UserX size={12} /> },
          { value: 'bby', label: `차단당한 (${blockedBy.length})`, icon: <UserMinus size={12} /> },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'blk' && <BlockedUsersList items={blocks} />}
      {tab === 'bby' && <BlockedByList items={blockedBy} />}
    </>
  )
}

function MadeReportList({ items }: { items: MadeReports }) {
  const navigate = useNavigate()
  const pager = useSearchPager(items, (r, kw) =>
    (r.reason ?? '').toLowerCase().includes(kw) ||
    (r.target_user_nickname ?? '').toLowerCase().includes(kw)
  )
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="대상 닉네임 / 사유"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="낸 신고가 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>신고 대상 유저</th>
                <th>대상 유형</th>
                <th>사유</th>
                <th>상태</th>
                <th>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      type="button"
                      disabled={!r.target_user_uuid}
                      onClick={() =>
                        r.target_user_uuid && navigate(`/users/${r.target_user_uuid}`)
                      }
                      className="font-extrabold hover:text-point-dark hover:underline disabled:text-text disabled:no-underline text-left"
                    >
                      {r.target_user_nickname ?? '-'}
                    </button>
                  </td>
                  <td>
                    {REPORT_TARGET_TYPE_LABEL[r.target_type as ReportTargetType] ??
                      r.target_type}
                  </td>
                  <td className="text-text-sub">{r.reason ?? '-'}</td>
                  <td>
                    {REPORT_STATUS_LABEL[r.status as ReportStatus] ?? r.status}
                  </td>
                  <td className="text-text-sub">{formatDateTime(r.create_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function SuspensionList({ items }: { items: Suspensions }) {
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<SuspensionType | undefined>(undefined)
  const filtered = useMemo(
    () => (typeFilter ? items.filter((s) => s.suspension_type === typeFilter) : items),
    [items, typeFilter],
  )
  const pager = useSearchPager(filtered, (s, kw) => s.reason.toLowerCase().includes(kw))
  return (
    <>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="text-[12px] text-text-soft">유형:</span>
        {([undefined, 'WARNING', 'TEMPORARY', 'PERMANENT'] as const).map((t) => (
          <button
            key={t ?? 'all'}
            type="button"
            className={`chip ${typeFilter === t ? 'active' : ''}`}
            onClick={() => setTypeFilter(t)}
          >
            {t == null ? '전체' : SUSPENSION_TYPE_LABEL[t]}
          </button>
        ))}
      </div>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="사유 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="제재 이력이 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>유형</th>
                <th>사유</th>
                <th>시작</th>
                <th>종료</th>
                <th>해제</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/suspensions/${s.id}`)}
                >
                  <td className="font-extrabold">{SUSPENSION_TYPE_LABEL[s.suspension_type]}</td>
                  <td className="text-text-sub">{s.reason}</td>
                  <td className="text-text-sub">{formatDateTime(s.starts_at)}</td>
                  <td className="text-text-sub">
                    {s.ends_at ? formatDateTime(s.ends_at) : '영구'}
                  </td>
                  <td>
                    {!s.is_lifted ? (
                      <Badge tone="warn">진행 중</Badge>
                    ) : s.lifted_by_admin_id == null ? (
                      <Badge tone="neutral">자동 만료</Badge>
                    ) : (
                      <Badge tone="normal">수동 해제</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function ReceivedReportList({ items }: { items: RecentReports }) {
  const pager = useSearchPager(items, (r, kw) => (r.reason ?? '').toLowerCase().includes(kw))
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="사유 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="받은 신고가 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>대상</th>
                <th>사유</th>
                <th>상태</th>
                <th>접수 시각</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((r) => (
                <tr key={r.id}>
                  <td className="font-extrabold">
                    {REPORT_TARGET_TYPE_LABEL[r.target_type as ReportTargetType] ??
                      r.target_type}
                  </td>
                  <td className="text-text-sub">{r.reason ?? '-'}</td>
                  <td>{REPORT_STATUS_LABEL[r.status as ReportStatus] ?? r.status}</td>
                  <td className="text-text-sub">{formatDateTime(r.create_time)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function BlockedUsersList({ items }: { items: Blocks }) {
  const navigate = useNavigate()
  const pager = useSearchPager(items, (b, kw) =>
    b.blocked_user_nickname.toLowerCase().includes(kw)
  )
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="피차단자 닉네임"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="차단한 유저가 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>차단 시각</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className="font-extrabold hover:text-point-dark hover:underline disabled:text-text"
                      onClick={() =>
                        b.blocked_user_uuid && navigate(`/users/${b.blocked_user_uuid}`)
                      }
                      disabled={!b.blocked_user_uuid}
                    >
                      {b.blocked_user_nickname}
                    </button>
                  </td>
                  <td className="text-text-sub">{formatDateTime(b.blocked_at)}</td>
                  <td className="text-text-sub">{b.reason ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function BlockedByList({ items }: { items: BlockedBy }) {
  const navigate = useNavigate()
  const pager = useSearchPager(items, (b, kw) =>
    b.blocker_user_nickname.toLowerCase().includes(kw)
  )
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="차단한 유저 닉네임"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="차단당한 기록이 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>차단한 유저</th>
                <th>차단당한 시각</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((b) => (
                <tr key={b.id}>
                  <td>
                    <button
                      className="font-extrabold hover:text-point-dark hover:underline disabled:text-text"
                      onClick={() =>
                        b.blocker_user_uuid && navigate(`/users/${b.blocker_user_uuid}`)
                      }
                      disabled={!b.blocker_user_uuid}
                    >
                      {b.blocker_user_nickname}
                    </button>
                  </td>
                  <td className="text-text-sub">{formatDateTime(b.blocked_at)}</td>
                  <td className="text-text-sub">{b.reason ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

/* ===== 박스 내 탭 ===== */
interface InnerTabSpec {
  value: string
  label: string
  icon?: React.ReactNode
}

function InnerTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: InnerTabSpec[]
  active: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (v: any) => void
}) {
  return (
    <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
      {tabs.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[12px] font-extrabold whitespace-nowrap transition border ${
            active === t.value
              ? 'bg-point text-white border-point shadow-point'
              : 'bg-surface text-text-sub border-border-strong hover:border-point hover:text-point-dark'
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ===== 탈퇴 신청 배너 ===== */
function WithdrawBanner({
  withdrawDate,
  onCancel,
  isPending,
}: {
  withdrawDate: string
  onCancel: () => void
  isPending: boolean
}) {
  const requested = new Date(withdrawDate)
  const purgeDate = new Date(requested.getTime() + 30 * 24 * 60 * 60 * 1000)
  const msDay = 24 * 60 * 60 * 1000
  const remainingDays = Math.ceil((purgeDate.getTime() - Date.now()) / msDay)
  const elapsed = remainingDays < 0
  return (
    <div
      className={`card mb-4 border-l-4 ${
        elapsed ? 'border-l-text-soft bg-surface-alt/60' : 'border-l-warn bg-[#FDF8EF]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-2 min-w-0">
          <UserX size={16} className={elapsed ? 'text-text-soft mt-0.5' : 'text-warn mt-0.5'} />
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold mb-0.5">
              {elapsed
                ? '탈퇴 신청 — 30일 유예 경과'
                : `탈퇴 신청 중 · D-${remainingDays}`}
            </div>
            <div className="text-[12px] text-text-sub">
              신청 {formatDateTime(withdrawDate)} · 영구 삭제 예정{' '}
              <strong>{formatDate(purgeDate.toISOString())}</strong>
              {elapsed
                ? ' (이미 경과 — 일괄 파기 큐 대기 중일 수 있음)'
                : ' (그 전까지는 본인이 앱 재로그인 시 자동 철회됨)'}
            </div>
          </div>
        </div>
        {!elapsed && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={isPending}
            onClick={onCancel}
            title="이의 신청 수용·오류 등으로 탈퇴를 어드민이 직접 철회"
          >
            <UserCog size={13} /> {isPending ? '처리 중...' : '탈퇴 철회 처리'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ===== 접속 이력 (로그인 로그) ===== */
function LoginLogList({ items }: { items: LoginLogs }) {
  const pager = useSearchPager(
    items,
    (l, kw) =>
      l.ip.toLowerCase().includes(kw) ||
      (l.device_label ?? '').toLowerCase().includes(kw) ||
      (l.location ?? '').toLowerCase().includes(kw)
  )
  return (
    <>
      <SearchBar
        value={pager.keyword}
        onChange={pager.setKeyword}
        placeholder="IP · 디바이스 · 위치 검색"
        total={pager.totalElements}
      />
      <ScrollBox>
        {!pager.slice.length ? (
          <EmptyState title="접속 이력이 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>시각</th>
                <th>결과</th>
                <th>디바이스</th>
                <th>IP</th>
                <th>위치</th>
              </tr>
            </thead>
            <tbody>
              {pager.slice.map((l) => (
                <tr key={l.id}>
                  <td className="text-text-sub">{formatDateTime(l.time)}</td>
                  <td>
                    {l.success ? (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-success">
                        <CheckCircle2 size={12} /> 성공
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[12px] font-bold text-danger">
                        <XCircle size={12} />{' '}
                        {l.failure_reason
                          ? LOGIN_FAILURE_REASON_LABEL[l.failure_reason as LoginFailureReason] ??
                            l.failure_reason
                          : '실패'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1 text-[12px]">
                      <DeviceIcon device={l.device} />
                      <span className="font-bold">{LOGIN_DEVICE_LABEL[l.device]}</span>
                    </div>
                    {l.device_label && (
                      <div className="text-[10.5px] text-text-soft mt-0.5">
                        {l.device_label}
                      </div>
                    )}
                  </td>
                  <td className="text-text-sub font-mono text-[11.5px]">{l.ip}</td>
                  <td className="text-text-sub">{l.location ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ScrollBox>
      <Pagination page={pager.page} totalPages={pager.totalPages} onChange={pager.setPage} />
    </>
  )
}

function DeviceIcon({ device }: { device: LoginDevice }) {
  if (device === 'WEB') return <Monitor size={11} className="text-text-soft" />
  return <Smartphone size={11} className="text-text-soft" />
}

/* ===== 프로필 심사 액션 — UserProfilePanel 의 footer 영역에 주입 ===== */
function ProfileReviewActions({
  userId,
  currentStatus,
}: {
  userId: number
  currentStatus?: ProfileStatus
}) {
  const [rejectMode, setRejectMode] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmKind, setConfirmKind] = useState<'approve' | 'reject' | null>(null)

  const approve = useApproveProfileMutation({
    onSuccess: () => setConfirmKind(null),
    onError: (e) => {
      setError(e.message)
      setConfirmKind(null)
    },
  })
  const reject = useRejectProfileMutation({
    onSuccess: () => {
      setConfirmKind(null)
      setRejectMode(false)
      setRejectReason('')
    },
    onError: (e) => {
      setError(e.message)
      setConfirmKind(null)
    },
  })

  const handleRejectClick = () => {
    setError(null)
    if (!rejectReason.trim()) {
      setError('반려 사유를 입력해주세요. (유저에게 노출됨)')
      return
    }
    setConfirmKind('reject')
  }

  return (
    <div className="space-y-2">
      {currentStatus && (
        <div className="text-[11.5px] text-text-soft">
          현재 상태:{' '}
          <strong className="text-text-sub">
            {PROFILE_STATUS_LABEL[currentStatus]}
          </strong>
        </div>
      )}

      {rejectMode ? (
        // 인라인 반려 사유 입력 폼
        <div className="space-y-2">
          <label className="form-label text-[11px]">반려 사유 (유저에 노출)</label>
          <textarea
            className="form-textarea"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="예) 프로필 사진이 규정에 맞지 않습니다"
            style={{ minHeight: 80 }}
          />
          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
          <div className="flex justify-end gap-2">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setRejectMode(false)
                setRejectReason('')
                setError(null)
              }}
              disabled={reject.isPending}
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
            className="btn btn-secondary btn-sm opacity-50 cursor-not-allowed"
            title="부스트 기능은 추후 구현 예정"
            disabled
          >
            <Zap size={13} /> 부스트 부여
          </button>
          <div className="flex-1" />
          <button
            className="btn btn-danger btn-sm"
            onClick={() => setRejectMode(true)}
            disabled={currentStatus === 'REJECTED'}
          >
            반려
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setConfirmKind('approve')}
            disabled={approve.isPending || currentStatus === 'APPROVED'}
          >
            {approve.isPending ? '처리 중...' : '승인'}
          </button>
        </div>
      )}

      {confirmKind === 'approve' && (
        <ConfirmDialog
          title="프로필을 승인하시겠습니까?"
          body="유저의 프로필이 정상 노출됩니다."
          confirmLabel="예, 승인"
          pending={approve.isPending}
          onCancel={() => setConfirmKind(null)}
          onConfirm={() => approve.mutate(userId)}
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
          onConfirm={() => reject.mutate({ userId, reason: rejectReason })}
        />
      )}
    </div>
  )
}
