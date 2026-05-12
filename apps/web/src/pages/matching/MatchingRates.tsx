import { useEffect, useState } from 'react'
import {
  useMatchingWeights,
  useUpdateMatchingWeightsMutation,
  formatDateTime,
} from '@ef-fe-admin/shared'
import type { UpdateMatchingWeightsRequest } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'

const WEIGHT_FIELDS: { key: keyof UpdateMatchingWeightsRequest; label: string; hint: string }[] = [
  { key: 'age_weight', label: '나이 일치', hint: '비슷한 나이대 가산점' },
  { key: 'area_weight', label: '지역 일치', hint: '같은 지역 가산점' },
  { key: 'mbti_weight', label: 'MBTI 궁합', hint: 'MBTI 호환표 기준' },
  { key: 'purpose_weight', label: '매칭 목적', hint: '친구·연인 일치도' },
  { key: 'drinking_weight', label: '음주 습관', hint: '음주 빈도 유사도' },
  { key: 'smoking_weight', label: '흡연 습관', hint: '흡연 빈도 유사도' },
  { key: 'hobby_weight', label: '취미·관심사', hint: '공통 태그 개수' },
]

export default function MatchingRatesPage() {
  const { data, isLoading } = useMatchingWeights()
  const [form, setForm] = useState<UpdateMatchingWeightsRequest | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data && !form) {
      setForm({
        age_weight: data.age_weight,
        area_weight: data.area_weight,
        mbti_weight: data.mbti_weight,
        purpose_weight: data.purpose_weight,
        drinking_weight: data.drinking_weight,
        smoking_weight: data.smoking_weight,
        hobby_weight: data.hobby_weight,
        base_rate: data.base_rate,
        premium_boost: data.premium_boost,
      })
    }
  }, [data, form])

  const mutation = useUpdateMatchingWeightsMutation({
    onSuccess: () => {
      setSaved('저장되었습니다.')
      setTimeout(() => setSaved(null), 2400)
    },
    onError: (e) => setError(e.message),
  })

  if (isLoading || !form) {
    return (
      <>
        <Topbar title="매칭률 가중치" />
        <div className="card text-center py-12 text-text-soft">불러오는 중...</div>
      </>
    )
  }

  const weightSum =
    form.age_weight +
    form.area_weight +
    form.mbti_weight +
    form.purpose_weight +
    form.drinking_weight +
    form.smoking_weight +
    form.hobby_weight

  const normalizedOK = Math.abs(weightSum - 1) < 0.01

  const handleSave = () => {
    setError(null)
    if (!normalizedOK) {
      setError(
        `가중치 합계가 1.00 이어야 합니다. 현재 ${weightSum.toFixed(2)}`
      )
      return
    }
    mutation.mutate(form)
  }

  return (
    <>
      <Topbar
        title="매칭률 가중치 조정"
        subtitle="유저 간 매칭 점수 계산에 쓰이는 항목별 가중치 · 기본 매칭률 · 프리미엄 부스트를 조정합니다."
      />

      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-text-soft font-bold">
              마지막 수정: {formatDateTime(data?.updated_at)} ·{' '}
              {data?.updated_by_admin_name ?? '-'}
            </div>
          </div>
          <div>
            <span
              className={`badge ${
                normalizedOK ? 'badge-normal' : 'badge-danger'
              }`}
            >
              가중치 합계 {weightSum.toFixed(2)} / 1.00
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="font-extrabold text-[14px] mb-3">📐 항목별 가중치</div>
          <div className="space-y-4">
            {WEIGHT_FIELDS.map((field) => (
              <WeightSlider
                key={field.key}
                label={field.label}
                hint={field.hint}
                value={form[field.key] as number}
                onChange={(v) => setForm({ ...form, [field.key]: v })}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card">
            <div className="font-extrabold text-[14px] mb-3">⚙️ 운영 파라미터</div>
            <div className="space-y-5">
              <SliderField
                label="기본 매칭률"
                hint="알고리즘이 산출한 점수를 0~1 사이로 변환할 때 기준값"
                value={form.base_rate}
                min={0}
                max={1}
                step={0.01}
                format={(v) => `${Math.round(v * 100)}%`}
                onChange={(v) => setForm({ ...form, base_rate: v })}
              />
              <SliderField
                label="프리미엄 부스트 배율"
                hint="프리미엄 유저 매칭 점수에 곱해지는 배율"
                value={form.premium_boost}
                min={1}
                max={2}
                step={0.05}
                format={(v) => `×${v.toFixed(2)}`}
                onChange={(v) => setForm({ ...form, premium_boost: v })}
              />
            </div>
          </div>

          <div className="card bg-surface-alt">
            <div className="text-[12px] font-extrabold mb-2">📊 미리보기</div>
            <div className="text-[11.5px] text-text-sub leading-relaxed">
              합계 가중치: <strong>{weightSum.toFixed(3)}</strong>
              <br />
              기본 매칭률: <strong>{Math.round(form.base_rate * 100)}%</strong>
              <br />
              프리미엄 부스트: <strong>×{form.premium_boost.toFixed(2)}</strong>
              <br />
              <br />
              예) 전 항목 일치 + 기본 매칭률 → {Math.min(100, Math.round(form.base_rate * 100 + weightSum * 38))}%
              <br />
              예) 일반 유저 + 기본만 → {Math.round(form.base_rate * 100)}%
              <br />
              예) 프리미엄 + 기본만 → {Math.min(100, Math.round(form.base_rate * 100 * form.premium_boost))}%
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-4 flex items-center justify-between">
        <div className="text-[12px] text-text-sub">
          {error && <span className="text-danger font-bold">{error}</span>}
          {saved && <span className="text-success font-bold">{saved}</span>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </>
  )
}

function WeightSlider({
  label,
  hint,
  value,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-extrabold">{label}</label>
        <span className="text-[12px] font-extrabold text-point-dark">
          {(value * 100).toFixed(0)}%
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={0.5}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-point)]"
      />
      {hint && <div className="text-[11px] text-text-soft mt-0.5">{hint}</div>}
    </div>
  )
}

function SliderField({
  label,
  hint,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[12px] font-extrabold">{label}</label>
        <span className="text-[13px] font-extrabold text-point-dark">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-[var(--color-point)]"
      />
      {hint && <div className="text-[11px] text-text-soft mt-0.5">{hint}</div>}
    </div>
  )
}
