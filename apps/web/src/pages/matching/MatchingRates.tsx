/**
 * @file apps/web/src/pages/matching/MatchingRates.tsx
 * @description code_match_config 38행 운영 화면.
 *
 *  BE 와 1:1 — AdminMatchController GET/PATCH /v1/admin/matches/config.
 *  - 키별 valueType 에 맞춰 INT 숫자입력 / DOUBLE 0~1 슬라이더 / JSON textarea 분기
 *  - sortKey 가중치 4개 (weight_*) 합 1.0 클라이언트 사전 검증 (BE 도 거절)
 *  - Dirty tracking — 변경된 키만 PATCH 로 전송
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  useMatchConfig,
  useUpdateMatchConfigMutation,
  formatDateTime,
} from '@ef-fe-admin/shared'
import type { MatchConfigItem } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

/** 14개 섹션 — code_match_config 의 키들을 운영자 친화 그룹핑. */
const SECTIONS: { title: string; emoji: string; keys: string[] }[] = [
  { title: 'sortKey 가중치 (합 = 1.0)', emoji: '⚖️',
    keys: ['weight_keyword', 'weight_ideal', 'weight_lifestyle', 'weight_location'] },
  { title: '중요포인트 가산', emoji: '⭐',
    keys: ['bump_keyword', 'bump_ideal', 'bump_lifestyle', 'bump_location'] },
  { title: '키워드', emoji: '🏷️',
    keys: ['keyword_base', 'keyword_coef', 'keyword_tag_threshold'] },
  { title: '이상형', emoji: '💜',
    keys: ['ideal_both_min', 'i_like_threshold', 'likes_me_threshold', 'ideal_min_fields', 'ideal_few_penalty'] },
  { title: '라이프', emoji: '🍃',
    keys: ['lifestyle_tag_threshold'] },
  { title: '지역', emoji: '📍',
    keys: ['region_tiers', 'location_tag_threshold'] },
  { title: '후보 필터', emoji: '🔎',
    keys: ['age_max_diff', 'last_active_days', 'pass_cooldown_days'] },
  { title: '풀', emoji: '🪣',
    keys: ['pool_size', 'newbie_ratio', 'newbie_window_days', 'radius_steps_km'] },
  { title: '슬롯', emoji: '🎯',
    keys: ['daily_show', 'newbie_floor', 'random_slots'] },
  { title: '같은카테고리', emoji: '🧩',
    keys: ['category_mate_cats', 'category_mate_min'] },
  { title: '개인키워드', emoji: '✨',
    keys: ['custom_kw_min'] },
  { title: '표시', emoji: '👀',
    keys: ['keyword_chip_count'] },
  { title: '신규자 fan-out', emoji: '🌱',
    keys: ['fresh_newbie_window_hours', 'fresh_newbie_fan_out', 'fresh_newbie_reserved_slots', 'fresh_newbie_reserved_step'] },
  { title: '어뷰즈 가드', emoji: '🛡️',
    keys: ['recompute_action_threshold', 'recompute_max_per_day'] },
]

const WEIGHT_KEYS = ['weight_keyword', 'weight_ideal', 'weight_lifestyle', 'weight_location'] as const

export default function MatchingRatesPage() {
  const { data, isLoading } = useMatchConfig()

  // 키 → 현재 입력값. 원본은 data 그대로 유지하고 dirty 비교에 사용.
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // data 식별자(키:값 모음) — BE 실데이터 도착·refetch·저장 후 변하면 draft 재동기화 트리거.
  const dataFingerprint = useMemo(
    () => (data ? data.map((r) => `${r.configKey}:${r.configValue}`).join('|') : ''),
    [data],
  )
  const syncedFingerprintRef = useRef<string | null>(null)

  // draft 동기화 — data 가 바뀔 때마다 실값으로 채움.
  //  · 첫 로드/refetch/저장 후처럼 dirty 가 없을 때만 덮어쓴다.
  //  · 사용자가 편집 중(dirty)이면 입력값 보존 — 편집 종료(초기화/저장) 후 동기화.
  useEffect(() => {
    if (!data) return
    if (syncedFingerprintRef.current === dataFingerprint) return
    const hasDirty = data.some(
      (r) => draft[r.configKey] !== undefined && draft[r.configKey] !== r.configValue,
    )
    if (Object.keys(draft).length > 0 && hasDirty) return
    const init: Record<string, string> = {}
    data.forEach((r) => { init[r.configKey] = r.configValue })
    setDraft(init)
    syncedFingerprintRef.current = dataFingerprint
  }, [data, dataFingerprint, draft])

  const byKey = useMemo(() => {
    const map: Record<string, MatchConfigItem> = {}
    data?.forEach((r) => { map[r.configKey] = r })
    return map
  }, [data])

  const dirtyKeys = useMemo(() => {
    if (!data) return [] as string[]
    return Object.entries(draft)
      .filter(([k, v]) => byKey[k] && byKey[k].configValue !== v)
      .map(([k]) => k)
  }, [draft, byKey, data])

  // 마지막 수정 메타 — updatedAt 최대값 + 그 row 의 updatedBy
  const lastUpdate = useMemo(() => {
    if (!data || data.length === 0) return null
    return data.reduce((acc, r) => (acc && acc.updateTime > r.updateTime ? acc : r))
  }, [data])

  // sortKey 가중치 합
  const weightSum = useMemo(() => {
    return WEIGHT_KEYS.reduce((sum, k) => {
      const v = parseFloat(draft[k] ?? '0')
      return sum + (isNaN(v) ? 0 : v)
    }, 0)
  }, [draft])
  const weightSumOk = Math.abs(weightSum - 1) < 0.01

  const mutation = useUpdateMatchConfigMutation({
    onSuccess: () => {
      setSaved('저장되었습니다.')
      setConfirmOpen(false)
      setTimeout(() => setSaved(null), 2400)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  if (isLoading || !data) {
    return (
      <>
        <Topbar title="매칭 설정값" />
        <div className="card text-center py-12 text-text-soft">불러오는 중...</div>
      </>
    )
  }

  const handleSaveClick = () => {
    setError(null)
    if (dirtyKeys.length === 0) {
      setError('변경된 항목이 없습니다.')
      return
    }
    if (!weightSumOk) {
      setError(`sortKey 가중치 합이 1.0 이어야 합니다. 현재 ${weightSum.toFixed(2)}`)
      return
    }
    // JSON 클라이언트 사전 검증
    for (const k of dirtyKeys) {
      if (byKey[k].valueType === 'JSON') {
        try { JSON.parse(draft[k]) }
        catch { setError(`${k}: JSON 형식이 올바르지 않습니다.`); return }
      }
    }
    setConfirmOpen(true)
  }

  const executeSave = () => {
    mutation.mutate({
      entries: dirtyKeys.map((k) => ({ configKey: k, configValue: draft[k] })),
    })
  }

  const resetDraft = () => {
    const init: Record<string, string> = {}
    data.forEach((r) => { init[r.configKey] = r.configValue })
    setDraft(init)
    setError(null)
  }

  return (
    <>
      <Topbar
        title="매칭 설정값 조정"
        subtitle="code_match_config — 매칭 알고리즘이 매 호출 시 읽는 38개 키. 저장 즉시 다음 배치/요청에 반영됩니다."
      />

      <div className="card mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-[12px] text-text-soft font-bold">
            마지막 수정: {formatDateTime(lastUpdate?.updateTime)} ·{' '}
            {lastUpdate?.updateUser ?? '-'}
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${weightSumOk ? 'badge-normal' : 'badge-danger'}`}>
              가중치 합계 {weightSum.toFixed(2)} / 1.00
            </span>
            <span className={`badge ${dirtyKeys.length > 0 ? 'badge-warn' : 'badge-normal'}`}>
              변경 {dirtyKeys.length}건
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {SECTIONS.map((section) => (
          <div key={section.title} className="card">
            <div className="font-extrabold text-[14px] mb-3">
              {section.emoji} {section.title}
            </div>
            <div className="space-y-4">
              {section.keys.map((key) => {
                const row = byKey[key]
                if (!row) return null
                const value = draft[key] ?? row.configValue
                const dirty = value !== row.configValue
                return (
                  <ConfigField
                    key={key}
                    item={row}
                    value={value}
                    dirty={dirty}
                    onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card mt-4 flex items-center justify-between">
        <div className="text-[12px] text-text-sub">
          {error && <span className="text-danger font-bold">{error}</span>}
          {saved && <span className="text-success font-bold">{saved}</span>}
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm"
            onClick={resetDraft}
            disabled={dirtyKeys.length === 0 || mutation.isPending}
          >
            초기화
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveClick}
            disabled={mutation.isPending || dirtyKeys.length === 0}
          >
            {mutation.isPending ? '저장 중...' : `저장 (${dirtyKeys.length})`}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="설정값을 저장하시겠습니까?"
          body={`변경 ${dirtyKeys.length}건 — 모든 신규 매칭 점수 계산에 즉시 반영됩니다.`}
          confirmLabel="예, 저장"
          tone="warn"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={executeSave}
        />
      )}
    </>
  )
}

/* ───────── 키 1행 ───────── */

function ConfigField({
  item,
  value,
  dirty,
  onChange,
}: {
  item: MatchConfigItem
  value: string
  dirty: boolean
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1 gap-2">
        <label className="text-[12px] font-extrabold flex-1 min-w-0 truncate">
          <span className="text-text-soft font-bold">{item.configKey}</span>
          {item.description && (
            <span className="text-text-sub font-normal"> · {item.description}</span>
          )}
        </label>
        {dirty && (
          <span className="badge badge-warn text-[10px] shrink-0">변경됨</span>
        )}
      </div>
      <ConfigInput item={item} value={value} onChange={onChange} />
    </div>
  )
}

/** valueType 별 UI 분기 — INT/DOUBLE 숫자 입력, JSON textarea. */
function ConfigInput({
  item,
  value,
  onChange,
}: {
  item: MatchConfigItem
  value: string
  onChange: (v: string) => void
}) {
  if (item.valueType === 'JSON') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={value.length > 60 ? 3 : 2}
        className="w-full font-mono text-[11.5px] rounded-lg border border-divider bg-bg px-2 py-1.5 focus:outline-none focus:border-point"
        spellCheck={false}
      />
    )
  }
  if (item.valueType === 'DOUBLE') {
    const num = parseFloat(value)
    return (
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={isNaN(num) ? 0 : num}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 accent-[var(--color-point)]"
        />
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-[72px] text-right text-[12px] font-extrabold rounded border border-divider bg-bg px-2 py-1 focus:outline-none focus:border-point"
        />
      </div>
    )
  }
  // INT
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-[13px] font-extrabold rounded-lg border border-divider bg-bg px-3 py-2 focus:outline-none focus:border-point"
    />
  )
}
