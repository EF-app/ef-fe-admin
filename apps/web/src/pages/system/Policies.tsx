import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Plus,
  FileText,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle2,
  CircleDot,
  CircleOff,
} from 'lucide-react'
import {
  usePolicies,
  useFaqs,
  useDeleteFaqMutation,
  formatDateTime,
  formatDate,
  POLICY_TYPE,
  POLICY_KIND_LABEL,
  POLICY_STATUS_LABEL,
  FAQ_CATEGORY_LABEL,
} from '@ef-fe-admin/shared'
import type {
  PolicyKind,
  PolicyStatus,
  PolicyDoc,
  FaqCategory,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

type Tab = 'policy' | 'faq'

const FAQ_CATEGORY_OPTIONS: { value: FaqCategory | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'ACCOUNT', label: '계정' },
  { value: 'MATCHING', label: '매칭' },
  { value: 'MESSAGE', label: '메시지' },
  { value: 'PAYMENT', label: '결제' },
  { value: 'REPORT', label: '신고·차단' },
  { value: 'ETC', label: '기타' },
]

/** 정책 표시용 상태 계산 */
function deriveStatus(p: PolicyDoc): PolicyStatus {
  const now = Date.now()
  const eff = new Date(p.effective_date).getTime()
  const exp = p.expires_at ? new Date(p.expires_at).getTime() : null
  if (!p.is_active) return 'INACTIVE'
  if (exp != null && exp < now) return 'EXPIRED'
  if (eff > now) return 'SCHEDULED'
  return 'ACTIVE'
}

/** 같은 타입 안에서 표시할 대표 버전 선택.
 * 1순위 ACTIVE, 2순위 SCHEDULED(가까운 발효일), 3순위 최신 update_time
 */
function pickRepresentative(versions: PolicyDoc[]): PolicyDoc | null {
  if (!versions.length) return null
  const withStatus = versions.map((v) => ({ v, s: deriveStatus(v) }))
  const active = withStatus.find((x) => x.s === 'ACTIVE')
  if (active) return active.v
  const scheduled = withStatus
    .filter((x) => x.s === 'SCHEDULED')
    .sort((a, b) => a.v.effective_date.localeCompare(b.v.effective_date))[0]
  if (scheduled) return scheduled.v
  return versions
    .slice()
    .sort((a, b) => b.update_time.localeCompare(a.update_time))[0]
}

export default function PoliciesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab: Tab = searchParams.get('tab') === 'faq' ? 'faq' : 'policy'
  const [tab, setTabState] = useState<Tab>(initialTab)

  const setTab = (next: Tab) => {
    setTabState(next)
    const params = new URLSearchParams(searchParams)
    if (next === 'faq') params.set('tab', 'faq')
    else params.delete('tab')
    setSearchParams(params, { replace: true })
  }

  return (
    <>
      <Topbar
        title="FAQ·약관·정책"
        subtitle="이용약관·개인정보 등 정책 마스터(버전 관리) / FAQ 게시물 관리"
      />

      <div className="card mb-4 p-0 overflow-hidden">
        <div className="flex border-b border-border">
          <TabButton
            active={tab === 'policy'}
            onClick={() => setTab('policy')}
            icon={<FileText size={14} />}
            label="약관·정책"
          />
          <TabButton
            active={tab === 'faq'}
            onClick={() => setTab('faq')}
            icon={<HelpCircle size={14} />}
            label="FAQ"
          />
        </div>
      </div>

      {tab === 'policy' ? <PolicyTab /> : <FaqTab />}
    </>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-3 text-[13px] font-extrabold transition border-b-2 -mb-px ${
        active
          ? 'border-point text-point-dark'
          : 'border-transparent text-text-soft hover:text-text-sub'
      }`}
    >
      {icon} {label}
    </button>
  )
}

/* ===== 약관·정책 탭 — 타입별 대표 버전 + 펼침 이력 ===== */
function PolicyTab() {
  const navigate = useNavigate()
  const { data, isLoading } = usePolicies({ size: 200 })
  const [expanded, setExpanded] = useState<Set<PolicyKind>>(new Set())

  const groups = useMemo(() => {
    const all = data?.content ?? []
    const byType = new Map<PolicyKind, PolicyDoc[]>()
    all.forEach((p) => {
      const arr = byType.get(p.policy_type) ?? []
      arr.push(p)
      byType.set(p.policy_type, arr)
    })
    byType.forEach((arr) =>
      arr.sort((a, b) => b.update_time.localeCompare(a.update_time))
    )
    const ordered: { type: PolicyKind; versions: PolicyDoc[] }[] = []
    Object.values(POLICY_TYPE).forEach((t) => {
      const versions = byType.get(t)
      if (versions && versions.length) ordered.push({ type: t, versions })
    })
    return ordered
  }, [data?.content])

  const toggle = (t: PolicyKind) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(t)) next.delete(t)
      else next.add(t)
      return next
    })
  }

  return (
    <>
      <div className="card mb-4 flex items-center justify-between flex-wrap gap-3">
        <div className="text-[12px] text-text-soft">
          한 타입당 한 시점에 활성 버전 하나. 새 버전 작성 시 이전 활성 버전은 자동 비활성으로 전환됩니다.
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => navigate('/policies/new')}
        >
          <Plus size={13} /> 새 정책 등록
        </button>
      </div>

      {isLoading ? (
        <div className="card p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
      ) : !groups.length ? (
        <EmptyState title="등록된 정책이 없습니다." />
      ) : (
        <div className="space-y-3">
          {groups.map(({ type, versions }) => {
            const rep = pickRepresentative(versions)!
            const repStatus = deriveStatus(rep)
            const isOpen = expanded.has(type)
            const olderCount = versions.length - 1
            return (
              <div key={type} className="card p-0 overflow-hidden">
                {/* 대표(헤더) 행 */}
                <div
                  className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-surface-alt transition"
                  onClick={() => navigate(`/policies/${rep.uuid}`)}
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-point-softer flex items-center justify-center">
                    <FileText size={16} className="text-point-dark" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-extrabold text-[14px]">
                        {POLICY_KIND_LABEL[type]}
                      </span>
                      <span className="font-mono text-[11.5px] text-text-soft">
                        {rep.version}
                      </span>
                      <StatusBadge status={repStatus} />
                      {rep.is_required && <Badge tone="danger">필수</Badge>}
                      {rep.requires_reagreement && <Badge tone="warn">재동의</Badge>}
                    </div>
                    <div className="text-[11.5px] text-text-soft mt-1 flex items-center gap-3 flex-wrap">
                      <span>발효 {formatDate(rep.effective_date)}</span>
                      {rep.expires_at && (
                        <span>만료 {formatDate(rep.expires_at)}</span>
                      )}
                      <span>동의 {(rep.consent_count ?? 0).toLocaleString()}명</span>
                      <span className="text-text-soft">· 총 {versions.length}개 버전</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggle(type)
                    }}
                    className="btn btn-ghost btn-sm flex-shrink-0"
                    disabled={olderCount === 0}
                    title={
                      olderCount === 0
                        ? '이전 버전 없음'
                        : `${olderCount}개 이전 버전 보기`
                    }
                  >
                    {olderCount > 0 ? (
                      <>
                        {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        이력
                      </>
                    ) : (
                      <span className="text-text-soft text-[11px]">단일</span>
                    )}
                  </button>
                </div>

                {/* 펼침: 같은 타입의 다른 버전 타임라인 */}
                {isOpen && versions.length > 1 && (
                  <div className="border-t border-border bg-surface-alt/40 px-5 py-3 space-y-1">
                    {versions.map((v, idx) => (
                      <VersionRow
                        key={v.uuid}
                        version={v}
                        isCurrent={v.uuid === rep.uuid}
                        status={deriveStatus(v)}
                        isLast={idx === versions.length - 1}
                        onClick={() => navigate(`/policies/${v.uuid}`)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}

function VersionRow({
  version,
  isCurrent,
  status,
  isLast,
  onClick,
}: {
  version: PolicyDoc
  isCurrent: boolean
  status: PolicyStatus
  isLast: boolean
  onClick: () => void
}) {
  const Icon =
    status === 'ACTIVE'
      ? CheckCircle2
      : status === 'SCHEDULED'
        ? Clock
        : status === 'INACTIVE' || status === 'EXPIRED'
          ? CircleOff
          : CircleDot
  const iconColor =
    status === 'ACTIVE'
      ? 'text-success'
      : status === 'SCHEDULED'
        ? 'text-point-dark'
        : 'text-text-soft'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-start gap-3 w-full text-left px-2 py-2 rounded-md hover:bg-surface transition ${
        isCurrent ? 'bg-surface' : ''
      }`}
    >
      <div className="flex flex-col items-center flex-shrink-0 pt-0.5">
        <Icon size={14} className={iconColor} />
        {!isLast && <div className="w-px flex-1 bg-border mt-1 min-h-[14px]" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-mono font-extrabold text-[12.5px]">{version.version}</span>
          <StatusBadge status={status} />
          {isCurrent && (
            <span className="text-[10.5px] font-extrabold text-point-dark">← 현재 표시</span>
          )}
        </div>
        <div className="text-[11px] text-text-soft mt-0.5 flex items-center gap-2 flex-wrap">
          <span>발효 {formatDate(version.effective_date)}</span>
          {version.expires_at && <span>~ {formatDate(version.expires_at)}</span>}
          <span>· 동의 {(version.consent_count ?? 0).toLocaleString()}</span>
        </div>
      </div>
    </button>
  )
}

function StatusBadge({ status }: { status: PolicyStatus }) {
  const tone =
    status === 'ACTIVE'
      ? 'normal'
      : status === 'SCHEDULED'
        ? 'point'
        : status === 'EXPIRED'
          ? 'neutral'
          : 'warn'
  return <Badge tone={tone}>{POLICY_STATUS_LABEL[status]}</Badge>
}

/* ===== FAQ 탭 ===== */
function FaqTab() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<FaqCategory | undefined>(undefined)
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(0)
  const deleteMutation = useDeleteFaqMutation()

  const { data, isLoading } = useFaqs({
    category,
    is_active: activeFilter === 'ALL' ? undefined : activeFilter === 'ACTIVE',
    page,
    size: 15,
  })

  const sorted = useMemo(
    () =>
      (data?.content ?? []).slice().sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category)
        return a.display_order - b.display_order
      }),
    [data?.content]
  )

  return (
    <>
      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={category}
            onChange={(v) => {
              setCategory(v)
              setPage(0)
            }}
            options={FAQ_CATEGORY_OPTIONS}
          />
          <div className="w-px h-5 bg-border" />
          <FilterChips
            value={activeFilter}
            onChange={(v) => {
              setActiveFilter(v)
              setPage(0)
            }}
            options={[
              { value: 'ALL', label: '전체' },
              { value: 'ACTIVE', label: '활성' },
              { value: 'INACTIVE', label: '비활성' },
            ]}
          />
          <div className="flex-1" />
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/faqs/new')}>
            <Plus size={13} /> FAQ 추가
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !sorted.length ? (
          <EmptyState title="등록된 FAQ 가 없습니다." />
        ) : (
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>카테고리</th>
                <th>질문</th>
                <th>인기</th>
                <th>활성</th>
                <th>정렬</th>
                <th>수정 시각</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((f) => (
                <tr
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/faqs/${f.id}`)}
                >
                  <td>
                    <Badge tone="point">{FAQ_CATEGORY_LABEL[f.category]}</Badge>
                  </td>
                  <td className="font-extrabold">
                    <div className="line-clamp-1 max-w-[420px]">{f.question}</div>
                  </td>
                  <td>
                    {f.is_popular ? (
                      <Badge tone="warn">🔥 인기</Badge>
                    ) : (
                      <span className="text-text-soft text-[11px]">-</span>
                    )}
                  </td>
                  <td>
                    {f.is_active ? (
                      <Badge tone="normal">활성</Badge>
                    ) : (
                      <Badge tone="neutral">비활성</Badge>
                    )}
                  </td>
                  <td className="text-text-sub">#{f.display_order}</td>
                  <td className="text-text-sub">{formatDateTime(f.update_time)}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => {
                        if (confirm(`"${f.question}" FAQ 를 삭제할까요?`))
                          deleteMutation.mutate(f.id)
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}
