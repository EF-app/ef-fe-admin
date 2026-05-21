import { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Zap, Pencil } from 'lucide-react'
import {
  useUserDetail,
  formatDate,
  formatDateTime,
  MATCH_PURPOSE_LABEL,
  USER_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  UserDetail,
  UserProfile,
  InterestTarget,
  ProfileKeywordSet,
} from '@ef-fe-admin/shared'

interface Props {
  open: boolean
  userId?: number
  onClose: () => void
  actions?: React.ReactNode
  headerExtra?: React.ReactNode
}

/**
 * 오른쪽에서 슬라이드 인 되는 유저 프로필 패널.
 * EF-FE features/my/screens/MyProfileScreen (회원가입 profile-creation 흐름) 의 모든 섹션을 어드민 톤으로 옮김.
 *
 *  - 완성도 바
 *  - Hero (대표 사진 + 닉네임/나이/위치/직업 + 관심 대상 뱃지)
 *  - 사진 갤러리
 *  - 한 줄 소개
 *  - 관심 대상
 *  - 관심사 키워드 (8 그룹 + 나만의 태그)
 *  - 생활 습관 (음주 + 주종 / 흡연 + 종류 / 타투)
 *  - 내 스타일 (외모 4 + 추가정보 6)
 *  - MBTI 카드
 *  - 이상형 (중요 포인트 + 스타일)
 *  - 나에 대해 (bio)
 *  - 기본 정보 (UUID/로그인/인증 등 어드민용)
 */
export default function UserProfilePanel({
  open,
  userId,
  onClose,
  actions,
  headerExtra,
}: Props) {
  const { data: user, isLoading } = useUserDetail(userId)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[rgba(43,39,48,0.45)] backdrop-blur-[2px]" />

      <div
        className="absolute top-0 right-0 bottom-0 w-full sm:w-[480px] md:w-[540px] bg-bg shadow-lg flex flex-col animate-[slideInRight_0.22s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border bg-surface flex-shrink-0">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-surface-alt hover:bg-bg flex items-center justify-center"
            title="닫기"
          >
            <ChevronRight size={16} className="text-text-sub" />
          </button>
          <div className="font-extrabold text-[15px]">유저 프로필</div>
          {headerExtra}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-md hover:bg-surface-alt text-text-soft"
            aria-label="닫기"
          >
            <X size={16} />
          </button>
        </div>

        {/* 본문 — 길게 스크롤 */}
        <div className="flex-1 overflow-y-auto bg-bg">
          {isLoading || !user ? (
            <div className="p-10 text-center text-text-soft">불러오는 중...</div>
          ) : (
            <ProfileBody user={user} />
          )}
        </div>

        {actions && (
          <div className="flex-shrink-0 border-t border-border bg-surface px-5 py-3">
            {actions}
          </div>
        )}

        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(12px); opacity: 0.6; }
            to   { transform: translateX(0); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

/* ===== 메인 본문 ===== */

function ProfileBody({ user }: { user: UserDetail }) {
  const p = user.profile

  return (
    <div className="px-4 py-5 space-y-3.5">
      {/* 완성도 바 */}
      {p?.completion != null && (
        <CompletionBar value={p.completion} hint={p.completion_hint} />
      )}

      {/* Hero */}
      <Hero user={user} />

      {/* 관심 대상 — 미입력이어도 항목은 항상 노출 */}
      <Section label="관심 대상">
        {p?.interest_target ? (
          <div className="bg-surface rounded-[18px] px-4 py-3.5 border border-border flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[20px]"
              style={{ backgroundColor: 'rgba(150,134,191,0.18)' }}
            >
              {interestEmoji(p.interest_target)}
            </div>
            <div className="font-extrabold text-[14px]">
              {interestLabel(p.interest_target)}
            </div>
          </div>
        ) : (
          <EmptyCard />
        )}
      </Section>

      {/* 한 줄 소개 */}
      <Section label="한 줄 소개">
        {p?.bio_message ? (
          <div className="bg-surface rounded-[18px] px-4 py-3.5 text-[13.5px] border border-border leading-relaxed">
            "{p.bio_message}"
          </div>
        ) : (
          <EmptyCard />
        )}
      </Section>

      {/* 관심사 키워드 */}
      <Section label="관심사 키워드">
        <KeywordsCard keywords={p?.keywords} myTags={p?.my_tags} />
      </Section>

      {/* 생활 습관 */}
      <Section label="생활 습관">
        <HabitsCard profile={p} />
      </Section>

      {/* 내 스타일 */}
      <Section label="내 스타일">
        <StyleCard profile={p} job={user.job} />
      </Section>

      {/* MBTI */}
      <Section label="MBTI">
        {p?.mbti ? (
          <MbtiCard mbti={p.mbti} desc={p.mbti_desc} emoji={p.mbti_emoji} />
        ) : (
          <EmptyCard />
        )}
      </Section>

      {/* 이상형 */}
      <Section label="이상형">
        <IdealCard profile={p} />
      </Section>

      {/* 기본 정보 (어드민) */}
      <Section label="기본 정보">
        <div className="bg-surface rounded-[18px] border border-border px-4 py-2">
          <MetaRow label="UUID" value={user.uuid} mono />
          <MetaRow label="로그인 ID" value={user.login_id} />
          <MetaRow label="지역" value={user.area ?? '-'} />
          <MetaRow
            label="본인 인증"
            value={
              user.identity_verified_at
                ? formatDate(user.identity_verified_at)
                : '미인증'
            }
          />
          <MetaRow label="가입일" value={formatDateTime(user.create_time)} />
          <MetaRow label="상태" value={USER_STATUS_LABEL[user.status]} />
        </div>
      </Section>
    </div>
  )
}

/* ===== Hero ===== */

function Hero({ user }: { user: UserDetail }) {
  const photos = user.photos ?? []
  const [photoIdx, setPhotoIdx] = useState(0)
  const safeIdx = Math.min(photoIdx, Math.max(0, photos.length - 1))
  const currentPhoto = photos[safeIdx]
  const hasMultiple = photos.length > 1

  const prev = () => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)
  const next = () => setPhotoIdx((i) => (i + 1) % photos.length)

  return (
    <div
      className="rounded-[18px] overflow-hidden"
      style={{
        boxShadow: '0 6px 28px rgba(150,134,191,0.14)',
      }}
    >
      {/* 사진 영역 */}
      <div
        className="relative w-full select-none"
        style={{ height: 240, backgroundColor: '#9686BF' }}
      >
        {currentPhoto?.url && (
          <img
            src={currentPhoto.url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-opacity"
          />
        )}

        {/* 좌우 화살표 — 사진 2장 이상일 때만 */}
        {hasMultiple && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white/40"
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.32)',
              }}
              aria-label="이전 사진"
            >
              <ChevronLeft size={18} className="text-white" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition hover:bg-white/40"
              style={{
                backgroundColor: 'rgba(255,255,255,0.25)',
                border: '1px solid rgba(255,255,255,0.32)',
              }}
              aria-label="다음 사진"
            >
              <ChevronRight size={18} className="text-white" />
            </button>
            {/* 우상단 카운터 */}
            <div
              className="absolute top-3 right-3 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold text-white"
              style={{
                backgroundColor: 'rgba(0,0,0,0.32)',
                border: '1px solid rgba(255,255,255,0.18)',
              }}
            >
              {safeIdx + 1} / {photos.length}
            </div>
          </>
        )}

        {/* 관심 대상 뱃지 (좌상단) */}
        {user.profile?.interest_target && (
          <div
            className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              backgroundColor: 'rgba(255,255,255,0.22)',
              border: '1px solid rgba(255,255,255,0.28)',
            }}
          >
            <span className="text-[11px]">
              {interestEmoji(user.profile.interest_target)}
            </span>
            <span className="text-[11px] font-extrabold text-white">
              {interestLabel(user.profile.interest_target)}
            </span>
          </div>
        )}

        {/* 부스트 뱃지 — 사진 단일일 때만 우상단 (멀티일 땐 카운터 자리 차지) */}
        {!hasMultiple &&
          user.profile?.boost_expires_at &&
          new Date(user.profile.boost_expires_at) > new Date() && (
            <div
              className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2.5 py-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.22)',
                border: '1px solid rgba(255,255,255,0.28)',
              }}
            >
              <Zap size={11} className="text-white" />
              <span className="text-[10.5px] font-extrabold text-white">부스트</span>
            </div>
          )}

        {/* 사진 dots — 클릭 가능 */}
        {hasMultiple && (
          <div className="absolute bottom-3 left-4 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPhotoIdx(i)}
                aria-label={`사진 ${i + 1} 보기`}
                style={{
                  width: i === safeIdx ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor:
                    i === safeIdx ? '#fff' : 'rgba(255,255,255,0.45)',
                  transition: 'width 0.2s, background-color 0.2s',
                  cursor: 'pointer',
                  border: 0,
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}

        {/* 큰 이니셜 */}
        <div
          className="absolute font-extrabold pointer-events-none"
          style={{
            bottom: 8,
            right: 12,
            fontSize: 64,
            color: 'rgba(255,255,255,0.16)',
            letterSpacing: -2.5,
          }}
        >
          {user.nickname?.slice(1)}
        </div>
      </div>

      {/* 기본 정보 바 */}
      <div className="bg-surface px-5 py-3.5">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <div className="text-[19px] font-extrabold tracking-tight">
            {user.nickname}
          </div>
          <div className="text-[13px] text-text-soft">{user.age}세</div>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-text-sub">
          {user.profile?.mbti && (
            <span className="font-bold">🧬 {user.profile.mbti}</span>
          )}
          <span>📍 {user.area ?? '-'}</span>
          <span>💼 {user.job ?? '직업 미입력'}</span>
        </div>
      </div>
    </div>
  )
}

/* ===== 완성도 ===== */

function CompletionBar({ value, hint }: { value: number; hint?: string }) {
  return (
    <div className="bg-surface rounded-[12px] px-4 py-3 border border-border">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12px] font-bold text-text-sub">프로필 완성도</span>
        <span
          className="text-[17px] font-extrabold tracking-tight"
          style={{ color: '#9686BF' }}
        >
          {value}%
        </span>
      </div>
      <div className="h-[5px] rounded-[3px] bg-bg overflow-hidden">
        <div
          className="h-full rounded-[3px]"
          style={{ width: `${value}%`, backgroundColor: '#9686BF' }}
        />
      </div>
      {hint && (
        <div className="text-[11px] text-text-soft mt-1.5">{hint}</div>
      )}
    </div>
  )
}

/* ===== 관심사 키워드 ===== */

const KEYWORD_GROUPS: {
  key: keyof ProfileKeywordSet
  title: string
  tone: 'purple' | 'green' | 'amber' | 'neutral'
}[] = [
  { key: 'lifestyle', title: '🌿 라이프스타일', tone: 'purple' },
  { key: 'hobby', title: '🎨 취미', tone: 'green' },
  { key: 'outdoor', title: '🗺️ 외부 여가', tone: 'amber' },
  { key: 'self_improve', title: '📚 자기계발', tone: 'purple' },
  { key: 'food', title: '🍽️ 음식', tone: 'amber' },
  { key: 'sports', title: '🏃 스포츠', tone: 'green' },
  { key: 'music', title: '🎵 음악', tone: 'neutral' },
  { key: 'game', title: '🎮 게임', tone: 'purple' },
]

function KeywordsCard({
  keywords,
  myTags,
}: {
  keywords?: ProfileKeywordSet
  myTags?: string[]
}) {
  const hasAny =
    (keywords != null &&
      KEYWORD_GROUPS.some((g) => (keywords[g.key]?.length ?? 0) > 0)) ||
    (myTags != null && myTags.length > 0)
  if (!hasAny) return <EmptyCard />
  return (
    <div className="bg-surface rounded-[18px] border border-border px-4 py-4 space-y-3.5">
      {KEYWORD_GROUPS.map((g) => {
        const chips = keywords?.[g.key]
        if (!chips || chips.length === 0) return null
        return (
          <div key={g.key}>
            <div className="text-[11px] font-bold text-text-soft mb-2 tracking-wider">
              {g.title}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <Chip key={c} label={c} tone={g.tone} />
              ))}
            </div>
          </div>
        )
      })}
      {myTags && myTags.length > 0 && (
        <div>
          <div className="text-[11px] font-bold text-text-soft mb-2 tracking-wider">
            ✨ 나만의 태그
          </div>
          <div className="flex flex-wrap gap-1.5">
            {myTags.map((t) => (
              <Chip key={t} label={t} tone="purple" />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ===== 생활 습관 ===== */

function HabitsCard({ profile }: { profile?: UserProfile }) {
  if (!profile) return <EmptyCard />
  return (
    <div className="bg-surface rounded-[18px] border border-border overflow-hidden">
      <HabitBlock
        icon="🍷"
        label="음주"
        freq={profile.drinking ?? '-'}
        types={profile.drink_types ?? []}
      />
      <div className="h-px bg-border mx-4" />
      <HabitBlock
        icon="🌿"
        label="흡연"
        freq={profile.smoking ?? '-'}
        types={profile.smoke_types ?? []}
      />
      <div className="h-px bg-border mx-4" />
      <div className="flex items-center gap-3 px-4 py-3.5">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: '#F5F3F1' }}
        >
          <span className="text-[16px]">🖊️</span>
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold text-text-soft">타투</div>
          <div className="text-[13.5px] font-extrabold mt-0.5">
            {profile.tattoo ?? '-'}
          </div>
        </div>
      </div>
    </div>
  )
}

function HabitBlock({
  icon,
  label,
  freq,
  types,
}: {
  icon: string
  label: string
  freq: string
  types: string[]
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'rgba(150,134,191,0.10)' }}
        >
          <span className="text-[16px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold text-text-soft">{label}</div>
          <div className="text-[13.5px] font-extrabold mt-0.5">{freq}</div>
        </div>
      </div>
      {types.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2 ml-12">
          {types.map((t) => (
            <span
              key={t}
              className="rounded-full px-2 py-0.5 text-[11px] font-bold border"
              style={{
                backgroundColor: '#F5F3F1',
                borderColor: 'rgba(150,134,191,0.18)',
                color: '#6B6573',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

/* ===== 내 스타일 ===== */

function StyleCard({
  profile,
  job,
}: {
  profile?: UserProfile
  job?: string | null
}) {
  if (!profile) return <EmptyCard />
  return (
    <div className="bg-surface rounded-[18px] border border-border px-4 py-4">
      {/* 외모 4종 */}
      <div className="text-[11px] font-bold text-text-soft mb-2 tracking-wider">
        외모
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {profile.hair_style && <Chip label={`💇 ${profile.hair_style}`} />}
        {profile.body_type && (
          <Chip label={`👤 ${profile.body_type}`} tone="green" />
        )}
        {profile.height && (
          <Chip label={`📏 ${profile.height}`} tone="amber" />
        )}
        {profile.vibe && <Chip label={`💬 ${profile.vibe}`} tone="purple" />}
      </div>

      {/* 추가 정보 */}
      <div className="text-[11px] font-bold text-text-soft mb-1 tracking-wider">
        추가 정보
      </div>
      <MetaRow icon="💼" label="직업" value={job ?? '-'} />
      {profile.daily_type && (
        <MetaRow icon="🏠" label="일상 유형" value={profile.daily_type} />
      )}
      {profile.religion && (
        <MetaRow icon="🙏" label="종교" value={profile.religion} />
      )}
      {profile.friends_around && (
        <MetaRow
          icon="👥"
          label="주변 친구"
          value={profile.friends_around}
        />
      )}
      {profile.coming_out && (
        <MetaRow icon="🌈" label="커밍아웃" value={profile.coming_out} />
      )}
      {profile.fashion && (
        <MetaRow icon="👗" label="패션" value={profile.fashion} />
      )}
      {profile.grooming && (
        <MetaRow icon="💄" label="꾸미기" value={profile.grooming} last />
      )}
    </div>
  )
}

/* ===== MBTI ===== */

function MbtiCard({
  mbti,
  desc,
  emoji,
}: {
  mbti: string
  desc?: string
  emoji?: string
}) {
  return (
    <div
      className="rounded-[18px] px-5 py-4 relative overflow-hidden"
      style={{
        backgroundColor: '#9686BF',
        boxShadow: '0 6px 22px rgba(150,134,191,0.30)',
      }}
    >
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          top: -30,
          right: -30,
          width: 90,
          height: 90,
          backgroundColor: 'rgba(255,255,255,0.07)',
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          bottom: -20,
          left: 20,
          width: 60,
          height: 60,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }}
      />
      <div className="text-[10px] font-bold mb-1 text-white/70 tracking-wider">
        MBTI
      </div>
      <div className="text-[28px] font-extrabold text-white tracking-tight">
        {mbti}
      </div>
      {desc && (
        <div className="text-[12px] text-white/80 mt-0.5">{desc}</div>
      )}
      {emoji && (
        <div
          className="absolute"
          style={{ right: 18, top: '50%', fontSize: 32, marginTop: -16 }}
        >
          {emoji}
        </div>
      )}
    </div>
  )
}

/* ===== 이상형 ===== */

function IdealCard({ profile }: { profile?: UserProfile }) {
  const hasAny =
    profile != null &&
    ((profile.important_points?.length ?? 0) > 0 ||
      !!profile.ideal_hair ||
      !!profile.ideal_body ||
      !!profile.ideal_height ||
      !!profile.ideal_vibe ||
      !!profile.match_purpose ||
      !!profile.important_factor)
  if (!profile || !hasAny) return <EmptyCard />
  return (
    <div className="bg-surface rounded-[18px] border border-border px-4 py-4">
      {profile.important_points && profile.important_points.length > 0 && (
        <>
          <div className="text-[11px] font-bold text-text-soft mb-2 tracking-wider">
            가장 중요한 포인트
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {profile.important_points.map((p) => (
              <Chip key={p} label={p} tone="purple" />
            ))}
          </div>
        </>
      )}
      <div className="text-[11px] font-bold text-text-soft mb-1 tracking-wider">
        이상형 스타일
      </div>
      {profile.ideal_hair && (
        <MetaRow icon="💇" label="머리 길이" value={profile.ideal_hair} />
      )}
      {profile.ideal_body && (
        <MetaRow icon="👤" label="체형" value={profile.ideal_body} />
      )}
      {profile.ideal_height && (
        <MetaRow icon="📏" label="키" value={profile.ideal_height} />
      )}
      {profile.ideal_vibe && (
        <MetaRow icon="💬" label="성향" value={profile.ideal_vibe} last />
      )}
      {profile.match_purpose && (
        <MetaRow
          icon="💞"
          label="매칭 목적"
          value={MATCH_PURPOSE_LABEL[profile.match_purpose]}
          last
        />
      )}
      {profile.important_factor && (
        <MetaRow
          icon="🌱"
          label="중요 가치"
          value={profile.important_factor}
          last
        />
      )}
    </div>
  )
}

/* ===== 작은 컴포넌트 ===== */

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2 px-1">
        <div
          className="w-[5px] h-[5px] rounded-full"
          style={{ backgroundColor: '#9686BF' }}
        />
        <div className="text-[11px] font-bold text-text-soft tracking-wider uppercase">
          {label}
        </div>
        <div className="flex-1" />
        <button
          type="button"
          className="text-[11px] font-bold text-text-soft hover:text-point-dark inline-flex items-center gap-0.5 cursor-default opacity-50"
          tabIndex={-1}
          title="어드민 화면에서는 직접 편집 불가 — 유저 앱에서 수정"
        >
          <Pencil size={10} />
        </button>
      </div>
      {children}
    </div>
  )
}

/** 유저가 해당 항목을 작성하지 않았을 때 표시되는 빈 카드 — 항목(카테고리) 자체는 항상 노출. */
function EmptyCard({ text = '미입력' }: { text?: string }) {
  return (
    <div className="bg-surface rounded-[18px] px-4 py-4 border border-border border-dashed text-[12.5px] text-text-soft text-center">
      {text}
    </div>
  )
}

const CHIP_TONE = {
  purple: {
    bg: 'rgba(150,134,191,0.10)',
    border: 'rgba(150,134,191,0.22)',
    color: '#9686BF',
  },
  green: {
    bg: 'rgba(91,185,140,0.10)',
    border: 'rgba(91,185,140,0.20)',
    color: '#5BB98C',
  },
  amber: {
    bg: 'rgba(196,136,90,0.10)',
    border: 'rgba(196,136,90,0.20)',
    color: '#C4885A',
  },
  neutral: {
    bg: '#F5F3F1',
    border: '#EAE7E3',
    color: '#6B6670',
  },
} as const

function Chip({
  label,
  tone = 'purple',
}: {
  label: string
  tone?: keyof typeof CHIP_TONE
}) {
  const t = CHIP_TONE[tone]
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[12px] font-bold border"
      style={{ backgroundColor: t.bg, borderColor: t.border, color: t.color }}
    >
      {label}
    </span>
  )
}

function MetaRow({
  icon,
  label,
  value,
  mono,
  last,
}: {
  icon?: string
  label: string
  value: React.ReactNode
  mono?: boolean
  last?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between py-2.5 ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-[14px]">{icon}</span>}
        <span className="text-[12px] font-bold text-text-soft">{label}</span>
      </div>
      <span
        className={`font-extrabold text-right max-w-[62%] break-keep ${
          mono ? 'font-mono text-[11.5px]' : 'text-[13px]'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

/* ===== helpers ===== */

function interestEmoji(t: InterestTarget): string {
  if (t === 'ACQUAINTANCE') return '👫'
  if (t === 'LOVER') return '💕'
  return '💑'
}
function interestLabel(t: InterestTarget): string {
  if (t === 'ACQUAINTANCE') return '지인 — 새로운 친구를 만나고 싶어요'
  if (t === 'LOVER') return '애인 — 사랑을 찾고 싶어요'
  return '모두 — 친구도 연인도 OK!'
}
