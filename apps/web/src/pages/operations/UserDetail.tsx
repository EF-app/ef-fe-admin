import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Ban,
  ShieldOff,
  Crown,
  Sparkles,
  Wallet,
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
} from 'lucide-react'
import {
  useUserDetail,
  useUserBalComments,
  usePostItsBe,
  useSuspendUserMutation,
  useLiftSuspensionMutation,
  useCancelWithdrawalMutation,
  useHidePostItBeMutation,
  formatDateTime,
  formatDate,
  formatCurrency,
  formatNumber,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
  POST_IT_CATEGORY_LABEL,
  REPORT_TARGET_TYPE_LABEL,
  REPORT_STATUS_LABEL,
  LOGIN_DEVICE_LABEL,
  LOGIN_FAILURE_REASON_LABEL,
  validators,
  calcSuspensionEndsAt,
  TEMPORARY_DURATION_OPTIONS,
} from '@ef-fe-admin/shared'
import type {
  SuspensionType,
  PostItCategory,
  ReportTargetType,
  ReportStatus,
  LoginDevice,
  LoginFailureReason,
  UserDetail as UserDetailType,
  PostItBe,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import Modal from '../../components/ui/Modal'
import { UserStatusBadge, Badge } from '../../components/ui/Badge'
import UserProfilePanel from '../../components/user/UserProfilePanel'

const PAGE_SIZE = 10

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
  const [profileOpen, setProfileOpen] = useState(false)

  const suspendMutation = useSuspendUserMutation({
    onSuccess: () => {
      setSuspendMode(false)
      setReason('')
    },
    onError: (e) => setError(e.message),
  })
  const liftMutation = useLiftSuspensionMutation({
    onSuccess: () => {
      setLiftMode(false)
      setLiftReason('')
    },
    onError: (e) => setError(e.message),
  })
  const cancelWithdrawalMutation = useCancelWithdrawalMutation()

  const handleSuspend = () => {
    setError(null)
    const reasonCheck = validators.suspensionReason(reason)
    if (!reasonCheck.valid) return setError(reasonCheck.message ?? '')
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

  const handleLift = () => {
    if (!user?.active_suspension) return
    setError(null)
    if (!liftReason.trim()) return setError('해제 사유를 입력해주세요.')
    liftMutation.mutate({
      id: user.active_suspension.id,
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
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/users')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 유저 목록
        </button>
      </div>

      <Topbar title="유저 상세 / 유저 활동" />

      {/* ===== 풀폭 배너들 ===== */}
      {user.is_withdraw && user.withdraw_date && (
        <WithdrawBanner
          withdrawDate={user.withdraw_date}
          onCancel={() => {
            if (
              confirm(
                '이 유저의 탈퇴 신청을 철회 처리합니다. 30일 유예가 종료되고 계정이 정상 복구됩니다. 계속할까요?'
              )
            ) {
              if (userId != null) cancelWithdrawalMutation.mutate({ uuid: userId })
            }
          }}
          isPending={cancelWithdrawalMutation.isPending}
        />
      )}

      {user.active_suspension && (
        <div className="card mb-4 border-l-4 border-l-danger">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
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
            {!liftMode && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setLiftMode(true)
                  setSuspendMode(false)
                }}
              >
                <ShieldOff size={13} /> 제재 해제
              </button>
            )}
          </div>
        </div>
      )}

      {/* 제재 발동/해제 인라인 패널 — 풀폭 */}
      {suspendMode && (
        <div className="card mb-4 bg-surface-alt">
          <div className="font-extrabold text-[14px] mb-3">제재 발동</div>
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
        <div className="card mb-4 bg-surface-alt">
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

      {/* ===== 사이드바 + 메인 2단 (유저상세웹뷰) ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5 items-start">
        <ProfileSidebar
          user={user}
          isPremiumActive={isPremiumActive}
          onOpenProfile={() => setProfileOpen(true)}
          onSuspend={() => setSuspendMode(true)}
          suspendMode={suspendMode}
        />
        <MainContent user={user} userId={user.id} />
      </div>

      {/* 프로필 패널 모달 */}
      <UserProfilePanel
        open={profileOpen}
        userId={user.id}
        onClose={() => setProfileOpen(false)}
      />
    </>
  )
}

/* ===== 좌측 sticky 사이드바 ===== */
function ProfileSidebar({
  user,
  isPremiumActive,
  onOpenProfile,
  onSuspend,
  suspendMode,
}: {
  user: UserDetailType
  isPremiumActive: boolean
  onOpenProfile: () => void
  onSuspend: () => void
  suspendMode: boolean
}) {
  return (
    <aside className="lg:sticky lg:top-4 space-y-3">
      {/* 프로필 카드 */}
      <div className="card p-4">
        <div className="flex flex-col items-center gap-3 pb-3 border-b border-border">
          <div className="w-28 h-28 rounded-full bg-point text-white flex items-center justify-center font-black text-[44px] flex-shrink-0 overflow-hidden">
            {user.photos && user.photos[0] ? (
              <img src={user.photos[0].url} alt="" className="w-full h-full object-cover" />
            ) : (
              user.nickname?.[0] ?? '?'
            )}
          </div>
          <div className="min-w-0 w-full text-center">
            <div className="font-extrabold text-[16px] truncate">{user.nickname}</div>
            <div className="flex items-center justify-center gap-1 flex-wrap mt-1.5">
              <UserStatusBadge status={user.status} />
              {isPremiumActive && (
                <Badge tone="warn">
                  <Crown size={9} className="inline" /> 프리미엄
                </Badge>
              )}
              {user.is_withdraw && <Badge tone="neutral">탈퇴</Badge>}
            </div>
          </div>
        </div>

        <dl className="pt-3 space-y-2 text-[12px]">
          <SidebarRow label="UUID" mono value={user.uuid} />
          <SidebarRow label="로그인 ID" value={user.login_id} />
          <SidebarRow label="나이" value={`${user.age}세`} />
          <SidebarRow label="지역" value={user.area ?? '미입력'} />
          <SidebarRow label="직업" value={user.job ?? '미입력'} />
        </dl>
      </div>

      <div className="card p-4">
        <div className="text-[10.5px] font-extrabold text-text-soft tracking-wider uppercase mb-3">
          결제 · 구독
        </div>
        <dl className="space-y-2.5 text-[12.5px]">
          <SidebarStat
            icon={<Wallet size={12} />}
            label="총 결제"
            value={formatCurrency(user.payment_total ?? 0)}
          />
          <SidebarStat
            icon={<Crown size={12} />}
            label="프리미엄"
            value={
              isPremiumActive ? `~ ${formatDate(user.premium_until!)}` : '미가입'
            }
            tone={isPremiumActive ? 'point' : undefined}
          />
          <SidebarStat
            icon={<Sparkles size={12} />}
            label="잉크"
            value={`${formatNumber(user.ink_balance ?? 0)}`}
          />
        </dl>
      </div>

      <div className="card p-4">
        <div className="text-[10.5px] font-extrabold text-text-soft tracking-wider uppercase mb-3">
          접속 / 가입
        </div>
        <dl className="space-y-2 text-[12px]">
          <SidebarRow label="가입" value={formatDateTime(user.create_time)} />
          <SidebarRow
            label="최근 접속"
            value={formatDateTime(user.last_login_time)}
          />
        </dl>
      </div>

      <div className="card p-4 space-y-2">
        <button
          className="btn btn-secondary btn-sm w-full justify-center"
          onClick={onOpenProfile}
        >
          <Eye size={13} /> 프로필 보기
        </button>
        {!user.active_suspension && !suspendMode && (
          <button
            className="btn btn-danger btn-sm w-full justify-center"
            onClick={onSuspend}
          >
            <Ban size={13} /> 제재 발동
          </button>
        )}
      </div>
    </aside>
  )
}

function SidebarRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-text-soft flex-shrink-0">{label}</dt>
      <dd
        className={`font-bold text-right break-all min-w-0 ${
          mono ? 'font-mono text-[11px]' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function SidebarStat({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'point'
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-1.5 text-text-soft">
        <span className="text-text-soft">{icon}</span>
        <span>{label}</span>
      </div>
      <div
        className={`font-extrabold text-right ${
          tone === 'point' ? 'text-point-dark' : ''
        }`}
      >
        {value}
      </div>
    </div>
  )
}

/* ===== 우측 메인 — 상단 탭 ===== */
type MainTab = 'matches' | 'content' | 'access' | 'reports'

function MainContent({
  user,
  userId,
}: {
  user: UserDetailType
  userId: number
}) {
  const [tab, setTab] = useState<MainTab>('matches')

  const matchCount = user.recent_matches?.length ?? 0

  return (
    <div className="card p-0">
      <div className="border-b border-border px-2 flex items-center flex-wrap">
        <TopTab
          active={tab === 'matches'}
          onClick={() => setTab('matches')}
          icon={<MessageSquare size={14} />}
          label="매칭 이력"
          suffix={`(${matchCount})`}
        />
        <TopTab
          active={tab === 'content'}
          onClick={() => setTab('content')}
          icon={<StickyNote size={14} />}
          label="작성한 글"
        />
        <TopTab
          active={tab === 'access'}
          onClick={() => setTab('access')}
          icon={<ShieldAlert size={14} />}
          label="접속·제재"
        />
        <TopTab
          active={tab === 'reports'}
          onClick={() => setTab('reports')}
          icon={<AlertTriangle size={14} />}
          label="신고·차단"
        />
      </div>

      <div className="p-5">
        {tab === 'matches' && (
          <MatchHistoryTable matches={user.recent_matches ?? []} />
        )}
        {tab === 'content' && (
          <WrittenContentTabs userId={userId} userNickname={user.nickname} />
        )}
        {tab === 'access' && (
          <AccessAndSuspensionTabs
            loginLogs={user.recent_login_logs ?? []}
            suspensions={user.suspensions ?? []}
          />
        )}
        {tab === 'reports' && (
          <ReportAndBlockTabs
            reports={user.recent_reports ?? []}
            madeReports={user.recent_made_reports ?? []}
            blocks={user.blocks ?? []}
            blockedBy={user.blocked_by ?? []}
          />
        )}
      </div>
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
                                  `밸런스 댓글 #${c.id} (${g.optionA} vs ${g.optionB}) — `
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
                          onClick={() => {
                            if (confirm('이 포스트잇을 숨김 처리할까요?')) {
                              hideMutation.mutate({ id: p.id })
                            }
                          }}
                        >
                          <EyeOff size={12} /> 숨김
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() =>
                          onSuspend(
                            `포스트잇 #${p.id} (${POST_IT_CATEGORY_LABEL[p.categoryCode as PostItCategory] ?? p.categoryCode}) — `
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
    </>
  )
}

/* ===== 작성글에서 호출되는 인라인 제재 모달 — 컨텍스트 자동 prefill ===== */
function SuspendInlineModal({
  userId,
  userNickname,
  contextPrefill,
  onClose,
}: {
  userId: number
  userNickname: string
  contextPrefill: string
  onClose: () => void
}) {
  const [type, setType] = useState<SuspensionType>('WARNING')
  const [durationDays, setDurationDays] = useState(7)
  const [reason, setReason] = useState(contextPrefill)
  const [error, setError] = useState<string | null>(null)

  const mutation = useSuspendUserMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    const check = validators.suspensionReason(reason)
    if (!check.valid) return setError(check.message ?? '')
    mutation.mutate({
      uuid: userId,
      payload: {
        suspension_type: type,
        reason,
        ends_at: calcSuspensionEndsAt(type, type === 'TEMPORARY' ? durationDays : undefined),
      },
    })
  }

  return (
    <Modal open onClose={onClose} title={`작성자 제재 — ${userNickname}`} maxWidth={520}>
      <div className="space-y-3">
        <div className="bg-surface-alt rounded-md p-3 text-[12px] text-text-sub">
          이 콘텐츠를 근거로 <strong>{userNickname}</strong> 에게 제재를 적용합니다.
        </div>
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
          <label className="form-label">사유 (유저 통보)</label>
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
    </Modal>
  )
}

/* ===== 안전 — 접속 이력 + 제재 ===== */
function AccessAndSuspensionTabs({
  loginLogs,
  suspensions,
}: {
  loginLogs: LoginLogs
  suspensions: Suspensions
}) {
  const [tab, setTab] = useState<'login' | 'sus'>('login')
  return (
    <>
      <InnerTabs
        tabs={[
          { value: 'login', label: `접속 이력 (${loginLogs.length})`, icon: <Monitor size={12} /> },
          { value: 'sus', label: `제재 (${suspensions.length})`, icon: <ShieldOff size={12} /> },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'login' && <LoginLogList items={loginLogs} />}
      {tab === 'sus' && <SuspensionList items={suspensions} />}
    </>
  )
}

/* ===== 안전 — 신고 + 차단 ===== */
function ReportAndBlockTabs({
  reports,
  madeReports,
  blocks,
  blockedBy,
}: {
  reports: RecentReports
  madeReports: MadeReports
  blocks: Blocks
  blockedBy: BlockedBy
}) {
  const [tab, setTab] = useState<'rep' | 'made' | 'blk' | 'bby'>('rep')
  return (
    <>
      <InnerTabs
        tabs={[
          { value: 'rep', label: `받은 신고 (${reports.length})`, icon: <AlertTriangle size={12} /> },
          { value: 'made', label: `낸 신고 (${madeReports.length})`, icon: <Send size={12} /> },
          { value: 'blk', label: `차단한 (${blocks.length})`, icon: <UserX size={12} /> },
          { value: 'bby', label: `차단당한 (${blockedBy.length})`, icon: <UserMinus size={12} /> },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'rep' && <ReceivedReportList items={reports} />}
      {tab === 'made' && <MadeReportList items={madeReports} />}
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
  const pager = useSearchPager(items, (s, kw) => s.reason.toLowerCase().includes(kw))
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
                <tr key={s.id}>
                  <td className="font-extrabold">{SUSPENSION_TYPE_LABEL[s.suspension_type]}</td>
                  <td className="text-text-sub">{s.reason}</td>
                  <td className="text-text-sub">{formatDateTime(s.starts_at)}</td>
                  <td className="text-text-sub">
                    {s.ends_at ? formatDateTime(s.ends_at) : '영구'}
                  </td>
                  <td>
                    {s.is_lifted ? (
                      <Badge tone="normal">해제됨</Badge>
                    ) : (
                      <Badge tone="warn">진행 중</Badge>
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
