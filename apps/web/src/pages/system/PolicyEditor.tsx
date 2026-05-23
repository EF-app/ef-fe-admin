import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, GitBranch, Save, Clock, Power } from 'lucide-react'
import {
  usePolicyDetail,
  useCreatePolicyMutation,
  useActivatePolicyMutation,
  POLICY_KIND_LABEL,
  POLICY_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type { PolicyKind, PolicyStatus, PolicyDoc } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

const KINDS: PolicyKind[] = [
  'TERMS_AGREE',
  'PRIVACY_COLLECTION_AGREE',
  'SENSITIVE_AGREE',
  'NO_DISCLOSURE_AGREE',
  'MARKETING_AGREE',
  'PUSH_AGREE',
  'LOCATION_AGREE',
  'PRIVACY_POLICY',
]

function deriveStatus(p: PolicyDoc): PolicyStatus {
  const now = Date.now()
  const eff = new Date(p.effective_date).getTime()
  const exp = p.expires_at ? new Date(p.expires_at).getTime() : null
  if (!p.is_active) return 'INACTIVE'
  if (exp != null && exp < now) return 'EXPIRED'
  if (eff > now) return 'SCHEDULED'
  return 'ACTIVE'
}

/** "v1.0" → "v1.1", "v2" → "v2.1", "1.0" → "1.1" */
function bumpVersion(v: string): string {
  const m = v.match(/^(v?)(\d+)(?:\.(\d+))?(.*)$/)
  if (!m) return v + '.1'
  const [, prefix, major, minor, rest] = m
  const nextMinor = minor != null ? Number(minor) + 1 : 1
  return `${prefix}${major}.${nextMinor}${rest}`
}

type DiffLine = { type: 'eq' | 'add' | 'del'; text: string }

/** LCS 기반 줄별 unified diff. */
function computeLineDiff(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n')
  const bLines = b.split('\n')
  const m = aLines.length
  const n = bLines.length
  // LCS DP 테이블 (Int16Array 로 메모리 절약)
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0)
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (aLines[i - 1] === bLines[j - 1]) dp[i][j] = dp[i - 1][j - 1] + 1
      else dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  const out: DiffLine[] = []
  let i = m
  let j = n
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && aLines[i - 1] === bLines[j - 1]) {
      out.unshift({ type: 'eq', text: aLines[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      out.unshift({ type: 'add', text: bLines[j - 1] })
      j--
    } else {
      out.unshift({ type: 'del', text: aLines[i - 1] })
      i--
    }
  }
  return out
}

/**
 * 새 정책 등록 페이지.
 *   /policies/new           : 백지 등록
 *   /policies/new?from=:uuid: 좌우 분할 — 좌측 원본(readOnly) / 우측 새 버전 편집
 *
 * 정책 수정은 본문/타입/버전 직접 수정이 아닌, 항상 새 버전 등록 → (선택) 활성화 스왑으로 진행.
 */
export default function PolicyEditorPage() {
  const { uuid } = useParams<{ uuid: string }>()
  const [searchParams] = useSearchParams()
  const fromUuid = searchParams.get('from') || undefined
  const navigate = useNavigate()

  const sourceUuid = uuid || fromUuid
  const { data: source } = usePolicyDetail(sourceUuid)
  const hasSource = Boolean(sourceUuid)

  const [policyType, setPolicyType] = useState<PolicyKind>('TERMS_AGREE')
  const [version, setVersion] = useState('v1.0')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [summary, setSummary] = useState('')
  const [isRequired, setIsRequired] = useState(true)
  const [requiresReagreement, setRequiresReagreement] = useState(false)
  const [effectiveDate, setEffectiveDate] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [error, setError] = useState<string | null>(null)
  // confirm: 'NOW'/'SCHEDULED' 만 띄움. DRAFT 는 마찰 없이 바로 저장.
  const [confirmMode, setConfirmMode] = useState<'SCHEDULED' | 'NOW' | null>(null)
  const [activateAfterCreate, setActivateAfterCreate] = useState<
    'DRAFT' | 'SCHEDULED' | 'NOW'
  >('DRAFT')
  const [leftView, setLeftView] = useState<'source' | 'diff'>('diff')

  useEffect(() => {
    if (source && hasSource) {
      setPolicyType(source.policy_type)
      setVersion(bumpVersion(source.version))
      setTitle(source.title)
      setContent(source.content)
      setSummary(source.summary ?? '')
      // 필수 동의 — 원본 값 그대로 유지
      setIsRequired(source.is_required)
      // 재동의 요청 — 기본 false. 본문이 중대하게 바뀐 경우 사용자가 명시적으로 켬.
      setRequiresReagreement(false)
      setEffectiveDate('')
      setExpiresAt('')
    }
  }, [source?.uuid, hasSource])

  const createMutation = useCreatePolicyMutation()
  const activateMutation = useActivatePolicyMutation()

  const status = source ? deriveStatus(source) : 'INACTIVE'

  /** 줄별 unified diff (LCS) — 좌측 변경사항 패널에서 사용 */
  const diffLines = useMemo<DiffLine[] | null>(() => {
    if (!source) return null
    return computeLineDiff(source.content || '', content || '')
  }, [source?.content, content])

  const diffStats = useMemo(() => {
    if (!diffLines) return null
    let added = 0
    let removed = 0
    diffLines.forEach((d) => {
      if (d.type === 'add') added++
      else if (d.type === 'del') removed++
    })
    return { changed: added + removed > 0, addedLines: added, removedLines: removed }
  }, [diffLines])

  const handleSubmit = async (mode: 'DRAFT' | 'SCHEDULED' | 'NOW') => {
    setError(null)
    if (!title.trim()) return setError('제목을 입력해주세요.')
    if (!content.trim()) return setError('본문을 입력해주세요.')
    // 초안 저장은 발효일 없어도 OK — 활성화/예약 시점에 필수
    if (mode !== 'DRAFT' && !effectiveDate) {
      return setError('활성화하려면 발효일을 선택해주세요.')
    }

    const wantActive = mode !== 'DRAFT'
    setActivateAfterCreate(mode)

    // DRAFT 인데 발효일이 비어 있으면 오늘 자정으로 임시 채움 (활성화 시 다시 지정)
    const effectiveIso = effectiveDate
      ? new Date(effectiveDate).toISOString()
      : new Date(new Date().setHours(0, 0, 0, 0)).toISOString()

    try {
      const created = await createMutation.mutateAsync({
        policy_type: policyType,
        version,
        title,
        content,
        summary: summary.trim() || null,
        is_required: isRequired,
        effective_date: effectiveIso,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_active: wantActive,
        requires_reagreement: requiresReagreement,
      })

      // 지금 활성화: 같은 타입의 다른 활성 버전을 자동 비활성화
      if (mode === 'NOW') {
        await activateMutation.mutateAsync({ uuid: created.uuid })
      }

      navigate(`/policies/${created.uuid}`, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : '저장에 실패했습니다.')
    }
  }

  const splitView = hasSource && !!source
  const submitting = createMutation.isPending || activateMutation.isPending

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() =>
            sourceUuid
              ? navigate(`/policies/${sourceUuid}`)
              : navigate('/policies')
          }
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft size={14} /> {sourceUuid ? '원본 문서' : '정책 목록'}
        </button>
      </div>

      <Topbar
        title={splitView ? '새 버전 작성' : '새 정책 등록'}
        subtitle={
          splitView && source
            ? `${POLICY_KIND_LABEL[source.policy_type]} · ${source.version} → ${version}`
            : '새 정책 문서 등록 — UNIQUE(policy_type + version)'
        }
      />

      {splitView && source && diffStats && (
        <div className="card mb-3 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-[12.5px]">
            <GitBranch size={14} className="text-point-dark" />
            <span className="font-extrabold">{POLICY_KIND_LABEL[source.policy_type]}</span>
            <span className="font-mono text-text-soft">{source.version}</span>
            <span className="text-text-soft">→</span>
            <span className="font-mono font-extrabold">{version}</span>
            <Badge tone="point">새 버전 작성</Badge>
          </div>
          <div className="text-[11.5px] text-text-soft">
            {diffStats.changed ? (
              <>
                본문 변경: <span className="text-success font-extrabold">+{diffStats.addedLines}</span>{' '}
                <span className="text-danger font-extrabold">-{diffStats.removedLines}</span> 라인
              </>
            ) : (
              <span>본문 변경 없음 (요약·필수 동의 등 메타만 변경)</span>
            )}
          </div>
        </div>
      )}

      <div
        className={
          splitView
            ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
            : 'grid grid-cols-1 gap-4'
        }
      >
        {/* 좌측: 원본 (readOnly) / 변경사항 (diff) 토글 */}
        {splitView && source && (
          <section className="card p-0 overflow-hidden">
            <header className="px-4 py-3 border-b border-border bg-surface-alt/40 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-[11.5px] font-extrabold text-text-soft">원본</span>
                <span className="font-mono text-[12.5px] font-extrabold">
                  {source.version}
                </span>
                <Badge
                  tone={
                    status === 'ACTIVE'
                      ? 'normal'
                      : status === 'SCHEDULED'
                        ? 'point'
                        : 'neutral'
                  }
                >
                  {POLICY_STATUS_LABEL[status]}
                </Badge>
              </div>
              {/* 좌측 패널 뷰 토글 */}
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setLeftView('source')}
                  className={`px-2.5 py-1 text-[11px] font-extrabold transition ${
                    leftView === 'source'
                      ? 'bg-point text-white'
                      : 'bg-surface text-text-sub hover:text-point-dark'
                  }`}
                >
                  원본
                </button>
                <button
                  type="button"
                  onClick={() => setLeftView('diff')}
                  className={`px-2.5 py-1 text-[11px] font-extrabold transition ${
                    leftView === 'diff'
                      ? 'bg-point text-white'
                      : 'bg-surface text-text-sub hover:text-point-dark'
                  }`}
                >
                  변경사항
                  {diffStats?.changed && (
                    <span className="ml-1 text-[10px] font-extrabold">
                      <span className={leftView === 'diff' ? 'text-white/85' : 'text-success'}>
                        +{diffStats.addedLines}
                      </span>{' '}
                      <span className={leftView === 'diff' ? 'text-white/85' : 'text-danger'}>
                        -{diffStats.removedLines}
                      </span>
                    </span>
                  )}
                </button>
              </div>
            </header>
            <div className="p-4 space-y-3 text-[12.5px]">
              <ReadField label="제목" value={source.title} />
              {source.summary && <ReadField label="요약" value={source.summary} />}
              <div>
                <div className="text-[10.5px] text-text-soft font-bold mb-1">
                  {leftView === 'diff' ? '본문 변경사항' : '본문'}
                </div>
                {leftView === 'source' ? (
                  <div className="bg-surface-alt/30 rounded-md p-3 text-[12.5px] leading-relaxed whitespace-pre-wrap text-text-sub max-h-[520px] overflow-y-auto">
                    {source.content}
                  </div>
                ) : (
                  <DiffView lines={diffLines ?? []} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                <ReadField label="필수" value={source.is_required ? '필수' : '선택'} small />
                <ReadField
                  label="재동의"
                  value={source.requires_reagreement ? '요청' : '없음'}
                  small
                />
              </div>
            </div>
          </section>
        )}

        {/* 우측: 새 버전 편집 */}
        <section className="card space-y-3">
          {splitView && (
            <div className="flex items-center gap-2 -mb-1">
              <span className="text-[11.5px] font-extrabold text-point-dark">새 버전</span>
              <Badge tone="point">편집 중</Badge>
            </div>
          )}

          <div>
            <label className="form-label">
              분류
              {splitView && (
                <span className="ml-1 text-[10.5px] text-text-soft font-bold">
                  (원본 타입 고정)
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {KINDS.map((k) => (
                <button
                  key={k}
                  type="button"
                  disabled={splitView}
                  className={`chip ${policyType === k ? 'active' : ''} ${
                    splitView ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={() => !splitView && setPolicyType(k)}
                >
                  {POLICY_KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="form-label">
                버전
                {splitView && (
                  <span className="ml-1 text-[10.5px] text-text-soft font-bold">
                    (자동 제안: {source ? bumpVersion(source.version) : ''})
                  </span>
                )}
              </label>
              <input
                className="form-input"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v1.0"
              />
            </div>
            <div>
              <label className="form-label">
                발효일{' '}
                <span className="text-text-soft font-normal">
                  (초안은 선택, 활성화/예약 시 필수)
                </span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">만료일 (선택)</label>
              <input
                type="datetime-local"
                className="form-input"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-4 flex-wrap">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                  className="accent-[var(--color-point)] w-4 h-4"
                />
                <span className="text-[12.5px] font-bold">필수 동의</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresReagreement}
                  onChange={(e) => setRequiresReagreement(e.target.checked)}
                  className="accent-[var(--color-point)] w-4 h-4"
                />
                <span className="text-[12.5px] font-bold">재동의 요청</span>
              </label>
            </div>
          </div>

          <div>
            <label className="form-label">제목</label>
            <input
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">요약 (선택, 500자)</label>
            <input
              className="form-input"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              maxLength={500}
              placeholder="유저 화면에 미리보기로 노출되는 한 줄 요약"
            />
          </div>

          <div>
            <label className="form-label">본문 (LONGTEXT)</label>
            <textarea
              className="form-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{ minHeight: splitView ? 420 : 360 }}
            />
          </div>

          {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

          <div className="flex justify-end gap-2 flex-wrap pt-2 border-t border-border">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() =>
                sourceUuid
                  ? navigate(`/policies/${sourceUuid}`)
                  : navigate('/policies')
              }
              disabled={submitting}
            >
              취소
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => handleSubmit('DRAFT')}
              disabled={submitting}
              title="저장만 하고 비활성 상태로 둡니다."
            >
              <Save size={13} /> 초안 저장
            </button>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setConfirmMode('SCHEDULED')}
              disabled={submitting}
              title="활성으로 저장하되, 발효일이 미래라면 예약 상태로 노출됩니다."
            >
              <Clock size={13} /> 예약 활성화
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setConfirmMode('NOW')}
              disabled={submitting}
              title="지금 활성화하고 같은 타입의 이전 활성 버전을 자동 비활성화합니다."
            >
              <Power size={13} />{' '}
              {submitting && activateAfterCreate === 'NOW' ? '활성화 중...' : '지금 활성화'}
            </button>
          </div>
        </section>
      </div>

      {confirmMode && (
        <ConfirmDialog
          title={confirmMode === 'NOW' ? '지금 활성화하시겠습니까?' : '예약 활성화하시겠습니까?'}
          body={
            confirmMode === 'NOW'
              ? splitView
                ? `'${version}' 버전을 지금 활성화합니다. 같은 타입의 다른 활성 버전은 자동으로 비활성화됩니다.`
                : `'${version}' 버전을 지금 활성화합니다.`
              : `'${version}' 버전을 활성으로 저장합니다. 발효일이 미래라면 예약 상태로 노출됩니다.`
          }
          confirmLabel={confirmMode === 'NOW' ? '예, 활성화' : '예, 예약'}
          tone={confirmMode === 'NOW' ? 'warn' : 'primary'}
          pending={submitting}
          onCancel={() => setConfirmMode(null)}
          onConfirm={async () => {
            const mode = confirmMode
            setConfirmMode(null)
            await handleSubmit(mode)
          }}
        />
      )}
    </>
  )
}

function ReadField({
  label,
  value,
  small = false,
}: {
  label: string
  value: string
  small?: boolean
}) {
  return (
    <div>
      <div className="text-[10.5px] text-text-soft font-bold mb-0.5">{label}</div>
      <div className={small ? 'text-[12px]' : 'text-[13px]'}>{value}</div>
    </div>
  )
}

/** 줄별 unified diff 뷰. add: 초록, del: 빨강·취소선, eq: 회색. */
function DiffView({ lines }: { lines: DiffLine[] }) {
  if (!lines.length) {
    return (
      <div className="bg-surface-alt/30 rounded-md p-4 text-[12px] text-text-soft text-center">
        변경 사항이 없습니다.
      </div>
    )
  }
  const hasChanges = lines.some((l) => l.type !== 'eq')
  return (
    <div className="bg-surface-alt/30 rounded-md border border-border max-h-[520px] overflow-y-auto">
      {!hasChanges && (
        <div className="px-3 py-2 text-[11.5px] text-text-soft border-b border-border bg-surface">
          본문 변경 없음 — 메타(요약·필수 동의 등)만 수정된 경우입니다.
        </div>
      )}
      <div className="font-mono text-[11.5px] leading-[1.55] py-1">
        {lines.map((line, idx) => (
          <DiffLineRow key={idx} line={line} />
        ))}
      </div>
    </div>
  )
}

function DiffLineRow({ line }: { line: DiffLine }) {
  if (line.type === 'add') {
    return (
      <div className="flex items-start gap-1 px-2 py-[1px] bg-[#E8F3EC]">
        <span className="w-3 text-success font-extrabold select-none flex-shrink-0">+</span>
        <span className="flex-1 whitespace-pre-wrap break-words font-bold" style={{ color: '#3F7B57' }}>
          {line.text || ' '}
        </span>
      </div>
    )
  }
  if (line.type === 'del') {
    return (
      <div className="flex items-start gap-1 px-2 py-[1px] bg-[#FBE9E9]">
        <span className="w-3 text-danger font-extrabold select-none flex-shrink-0">-</span>
        <span className="flex-1 whitespace-pre-wrap break-words text-danger line-through decoration-danger/60">
          {line.text || ' '}
        </span>
      </div>
    )
  }
  // eq
  return (
    <div className="flex items-start gap-1 px-2 py-[1px]">
      <span className="w-3 text-text-soft select-none flex-shrink-0"> </span>
      <span className="flex-1 whitespace-pre-wrap break-words text-text-soft">
        {line.text || ' '}
      </span>
    </div>
  )
}
