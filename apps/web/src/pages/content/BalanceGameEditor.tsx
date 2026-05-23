import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Clock, Send, EyeOff, Eye, AlertTriangle, Archive } from 'lucide-react'
import {
  useBalGameBeDetail,
  useBalApplyBeDetail,
  useCreateBalGameBeMutation,
  useUpdateBalGameBeMutation,
  formatDateTime,
  BAL_BE_CATEGORIES,
  BAL_BE_CATEGORY_LABEL,
  BAL_GAME_BE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  BalBeCategory,
  BalGameBeStatus,
  BalGameCreateRequest,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { Badge } from '../../components/ui/Badge'
import CommonConfirmDialog from '../../components/ui/ConfirmDialog'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const MINUTES = [0, 10, 20, 30, 40, 50]

/**
 * 밸런스 게임 등록/수정 페이지.
 * 디자인 참조: EF-FE features/bal-game (OptionInputCard / VsDivider / CategoryGrid / OptionPreviewCard)
 *
 * 경로:
 * - /balance/new           : 신규 등록 (DRAFT/SCHEDULED/PUBLISHED 선택)
 * - /balance/new?fromApply=<id> : 신청 큐에서 [승인→초안] 으로 진입. 신청 내용 프리필
 * - /balance/:id/edit      : 기존 게임 수정
 */
export default function BalanceGameEditorPage() {
  const { id: idParam } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const isEdit = Boolean(idParam)
  const gameId = idParam != null ? Number(idParam) : undefined

  const fromApply = searchParams.get('fromApply')
  const fromApplyId = fromApply ? Number(fromApply) : undefined
  const isFromApply = !isEdit && fromApplyId != null && !Number.isNaN(fromApplyId)

  const { data: existing, isLoading: existingLoading } = useBalGameBeDetail(gameId)
  const { data: applySource, isLoading: applyLoading } = useBalApplyBeDetail(
    isFromApply ? fromApplyId : undefined
  )

  const [optionA, setOptionA] = useState('')
  const [optionADesc, setOptionADesc] = useState('')
  const [optionAEmoji, setOptionAEmoji] = useState('')
  const [optionB, setOptionB] = useState('')
  const [optionBDesc, setOptionBDesc] = useState('')
  const [optionBEmoji, setOptionBEmoji] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<BalBeCategory>('DAILY')

  // 예약: 날짜 + 시 + 분(10단위)
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledHour, setScheduledHour] = useState<number | ''>('')
  const [scheduledMinute, setScheduledMinute] = useState<number | ''>('')

  // 자동 종료: 날짜 + 시 + 분(10단위)
  const [endDate, setEndDate] = useState('')
  const [endHour, setEndHour] = useState<number | ''>('')
  const [endMinute, setEndMinute] = useState<number | ''>('')

  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pendingPayload, setPendingPayload] = useState<BalGameCreateRequest | null>(null)
  // 상태 변경 (게시 중·숨김 게임 한정) — 미리보기/입력 영역은 readOnly 라도 상태 전환은 가능.
  const [pendingStatusChange, setPendingStatusChange] = useState<BalGameBeStatus | null>(null)
  // 일정만 저장 확인 팝업
  const [scheduleConfirmOpen, setScheduleConfirmOpen] = useState(false)
  const [scheduleConfirmPayload, setScheduleConfirmPayload] = useState<{
    scheduledAt: string | null
    scheduledEndAt: string | null
  } | null>(null)

  // 기존 게임 로드 시 프리필
  useEffect(() => {
    if (!isEdit || !existing) return
    setOptionA(existing.optionA)
    setOptionADesc(existing.optionADesc ?? '')
    setOptionAEmoji(existing.optionAEmoji ?? '')
    setOptionB(existing.optionB)
    setOptionBDesc(existing.optionBDesc ?? '')
    setOptionBEmoji(existing.optionBEmoji ?? '')
    setDescription(existing.description ?? '')
    setCategory(existing.categoryCode)
    if (existing.scheduledAt) {
      const [d, t] = existing.scheduledAt.split('T')
      const [h, m] = (t ?? '00:00:00').split(':')
      setScheduledDate(d)
      setScheduledHour(Number(h))
      setScheduledMinute(Number(m))
    }
    // scheduledEndAt 은 prefill 안 함 — BE 가 등록 다음날을 기본으로 채워 내려보내,
    // 어드민이 수정 진입할 때마다 의미 없는 디폴트가 보이는 문제 회피. 필요 시 직접 입력.
  }, [existing, isEdit])

  // 신청에서 진입 시 한 번만 프리필.
  // ref 에 어떤 apply id 로 prefill 했는지 기록 — placeholderData 가 잘못된 mock fallback 을
  // 흘려도 fromApplyId 와 일치 안 하면 무시되고, BE 응답(올바른 id) 이 도착해야 prefill 실행.
  const applyPrefilledRef = useRef<number | null>(null)
  useEffect(() => {
    if (!isFromApply || !applySource || fromApplyId == null) return
    if (applySource.id !== fromApplyId) return
    if (applyPrefilledRef.current === fromApplyId) return
    setOptionA(applySource.optionA)
    setOptionAEmoji(applySource.optionAEmoji ?? '')
    setOptionB(applySource.optionB)
    setOptionBEmoji(applySource.optionBEmoji ?? '')
    setDescription(applySource.description ?? '')
    setCategory(applySource.categoryCode)
    applyPrefilledRef.current = fromApplyId
  }, [isFromApply, applySource, fromApplyId])

  const createMutation = useCreateBalGameBeMutation({
    onSuccess: (g) => {
      setToast('✅ 저장되었습니다.')
      setTimeout(() => navigate(`/balance/${g.id}/edit`, { replace: true }), 500)
    },
    onError: (e) => setError(e.message),
  })
  const updateMutation = useUpdateBalGameBeMutation({
    onSuccess: () => setToast('✅ 저장되었습니다.'),
    onError: (e) => setError(e.message),
  })

  const pending = createMutation.isPending || updateMutation.isPending
  const readOnly =
    isEdit && existing?.status && (existing.status === 'ARCHIVED' || existing.status === 'PUBLISHED')

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2400)
    return () => clearTimeout(t)
  }, [toast])

  const minDate = useMemo(() => {
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  }, [])

  const hasScheduleInputs =
    !!scheduledDate && scheduledHour !== '' && scheduledMinute !== ''
  const hasEndInputs = !!endDate && endHour !== '' && endMinute !== ''

  const buildIso = (d: string, h: number | '', m: number | '') => {
    if (!d || h === '' || m === '') return null
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d}T${pad(Number(h))}:${pad(Number(m))}:00`
  }

  const validate = (status: BalGameBeStatus): BalGameCreateRequest | null => {
    setError(null)
    if (!optionA.trim()) return setError('옵션 A 를 입력해주세요.'), null
    if (!optionB.trim()) return setError('옵션 B 를 입력해주세요.'), null
    if (optionA.length > 255) return setError('옵션 A 는 255자 이하로 입력해주세요.'), null
    if (optionB.length > 255) return setError('옵션 B 는 255자 이하로 입력해주세요.'), null
    if (optionADesc.length > 500) return setError('A 부연설명은 500자 이하.'), null
    if (optionBDesc.length > 500) return setError('B 부연설명은 500자 이하.'), null

    let scheduledIso: string | null = null
    if (status === 'SCHEDULED') {
      if (!hasScheduleInputs) {
        setError('예약 발행: 날짜·시·분을 모두 선택해주세요.')
        return null
      }
      const iso = buildIso(scheduledDate, scheduledHour, scheduledMinute)!
      if (new Date(iso).getTime() <= Date.now()) {
        setError('예약 시각은 현재 시각 이후여야 합니다.')
        return null
      }
      scheduledIso = iso
    }

    const endIso = hasEndInputs
      ? buildIso(endDate, endHour, endMinute)
      : null
    if (endIso && scheduledIso && new Date(endIso).getTime() <= new Date(scheduledIso).getTime()) {
      setError('자동 종료 시각은 예약 시각 이후여야 합니다.')
      return null
    }

    return {
      optionA: optionA.trim(),
      optionB: optionB.trim(),
      optionADesc: optionADesc.trim() || null,
      optionBDesc: optionBDesc.trim() || null,
      optionAEmoji: optionAEmoji.trim() || null,
      optionBEmoji: optionBEmoji.trim() || null,
      description: description.trim() || null,
      categoryCode: category,
      status,
      scheduledAt: scheduledIso,
      scheduledEndAt: endIso,
      // 신청 승인 → 초안 흐름: BE 가 BalApply 를 PENDING → APPROVED 처리하고
      // 신청자를 게임의 applicant 로 연결하도록 apply 의 id 를 전달.
      applyId: isFromApply ? fromApplyId ?? null : null,
    }
  }

  const handleClickAction = (status: BalGameBeStatus) => {
    const payload = validate(status)
    if (payload) setPendingPayload(payload)
  }

  // 게시 중/숨김 게임에서 일정(예약·자동종료) 만 따로 저장.
  // 내용 변경은 잠겨도 일정은 운영 중에 조정해야 하는 케이스 (자동 종료 시각 추가 등).
  const handleSaveScheduleClick = () => {
    if (!isEdit || gameId == null) return
    setError(null)
    const scheduledIso = hasScheduleInputs
      ? buildIso(scheduledDate, scheduledHour, scheduledMinute)
      : null
    const endIso = hasEndInputs ? buildIso(endDate, endHour, endMinute) : null

    if (
      endIso &&
      scheduledIso &&
      new Date(endIso).getTime() <= new Date(scheduledIso).getTime()
    ) {
      setError('자동 종료 시각은 예약 시각 이후여야 합니다.')
      return
    }
    if (endIso && new Date(endIso).getTime() <= Date.now()) {
      setError('자동 종료 시각은 현재 시각 이후여야 합니다.')
      return
    }
    setScheduleConfirmPayload({ scheduledAt: scheduledIso, scheduledEndAt: endIso })
    setScheduleConfirmOpen(true)
  }
  const executeSaveSchedule = () => {
    if (gameId == null || !scheduleConfirmPayload) return
    updateMutation.mutate(
      { gameId, payload: scheduleConfirmPayload },
      {
        onSettled: () => {
          setScheduleConfirmOpen(false)
          setScheduleConfirmPayload(null)
        },
      }
    )
  }

  const executeSubmit = () => {
    if (!pendingPayload) return
    if (isEdit && gameId != null) {
      updateMutation.mutate(
        { gameId, payload: pendingPayload },
        { onSettled: () => setPendingPayload(null) }
      )
    } else {
      createMutation.mutate(pendingPayload, {
        onSettled: () => setPendingPayload(null),
      })
    }
  }

  if ((isEdit && existingLoading) || (isFromApply && applyLoading)) {
    return (
      <>
        <Topbar
          title={isEdit ? '밸런스 게임 수정' : '밸런스 게임 등록'}
          subtitle="불러오는 중..."
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/balance')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 밸런스 게임 목록
        </button>
      </div>

      <Topbar
        title={isEdit ? '밸런스 게임 수정' : '밸런스 게임 등록'}
        subtitle={
          isFromApply
            ? `신청 #${fromApplyId} 의 내용을 가져왔습니다. 다듬어서 등록하세요.`
            : isEdit
              ? `게임 ${existing ? `#${existing.id}` : ''} · ${existing ? BAL_GAME_BE_STATUS_LABEL[existing.status] : ''}`
              : '두 가지 선택지를 입력하고 카테고리를 골라 초안/예약/즉시 발행 중 선택'
        }
      />

      {isFromApply && applySource && (
        <div className="card mb-4 border-l-4 border-l-point bg-point-softer">
          <div className="flex items-center gap-2 text-[12.5px]">
            <Badge tone="point">신청 #{applySource.id}</Badge>
            <span className="font-bold">@{applySource.userNickname ?? '탈퇴'}</span>
            <span className="text-text-soft">·</span>
            <span>{formatDateTime(applySource.createTime)}</span>
          </div>
        </div>
      )}

      {readOnly && (
        <div className="card mb-4 border-l-4 border-l-warn bg-[#FDF8EF]">
          <div className="flex items-center gap-2 text-[12.5px]">
            <AlertTriangle size={14} className="text-warn" />
            <span className="font-bold">
              {existing?.status === 'PUBLISHED'
                ? '게시 중인 게임입니다. 상태 변경(숨김/종료)만 가능합니다.'
                : '종료된 게임은 수정할 수 없습니다.'}
            </span>
          </div>
        </div>
      )}

      {/* 1. 설명 */}
      <div className="card mb-4">
        <SectionLabel>설명 (선택)</SectionLabel>
        <textarea
          className="form-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!!readOnly}
          placeholder="게임 배경을 자유롭게 적어주세요 (선택)"
          style={{ minHeight: 90 }}
          maxLength={1000}
        />
      </div>

      {/* 2. 선택지 A / B — 가로 배치 */}
      <div className="card mb-4">
        <SectionLabel>두 가지 선택지</SectionLabel>
        <div className="flex items-stretch gap-3">
          <div className="flex-1 min-w-0">
            <OptionInput
              side="A"
              text={optionA}
              onTextChange={setOptionA}
              desc={optionADesc}
              onDescChange={setOptionADesc}
              emoji={optionAEmoji}
              onEmojiChange={setOptionAEmoji}
              disabled={!!readOnly}
            />
          </div>
          <div className="self-center flex-shrink-0">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[13px] font-extrabold"
              style={{
                backgroundColor: '#9686BF',
                boxShadow: '0 3px 6px rgba(150,134,191,0.40)',
              }}
            >
              VS
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <OptionInput
              side="B"
              text={optionB}
              onTextChange={setOptionB}
              desc={optionBDesc}
              onDescChange={setOptionBDesc}
              emoji={optionBEmoji}
              onEmojiChange={setOptionBEmoji}
              disabled={!!readOnly}
            />
          </div>
        </div>
      </div>

      {/* 3. 카테고리 */}
      <div className="card mb-4">
        <SectionLabel>카테고리</SectionLabel>
        <CategoryGrid
          value={category}
          onChange={setCategory}
          disabled={!!readOnly}
        />
      </div>

      {/* 4. 미리보기 — 유저 화면 BalanceCard 동일 룩 (핸드폰 비율 프레임 안에서) */}
      <div className="card mb-4">
        <SectionLabel>미리보기 (모바일 비율)</SectionLabel>
        <PhonePreviewFrame>
          <BalanceGamePreviewCard
            optionA={optionA}
            optionADesc={optionADesc}
            optionAEmoji={optionAEmoji}
            optionB={optionB}
            optionBDesc={optionBDesc}
            optionBEmoji={optionBEmoji}
            description={description}
          />
        </PhonePreviewFrame>
      </div>

      {/* 일정 — ARCHIVED 가 아니면 항상 노출.
          readOnly (PUBLISHED) 일 때는 내용은 잠기더라도 일정만 따로 저장 가능. */}
      {existing?.status !== 'ARCHIVED' && (
        <div className="card mb-4 space-y-3">
          <SectionLabel>일정</SectionLabel>

          <div>
            <div className="form-label flex items-center gap-1">
              <Clock size={12} /> 예약 발행 시각 (선택 · 10분 단위)
            </div>
            <DateTime10Picker
              date={scheduledDate}
              hour={scheduledHour}
              minute={scheduledMinute}
              onChange={(d, h, m) => {
                setScheduledDate(d)
                setScheduledHour(h)
                setScheduledMinute(m)
              }}
              minDate={minDate}
            />
            <div className="text-[11px] text-text-soft mt-1">
              {readOnly
                ? '게시 중에는 예약 시각이 기록 보존용 — 실제 노출 시점은 이미 지났습니다.'
                : '비워두면 "초안" 또는 "즉시 발행"만 가능합니다.'}
            </div>
          </div>

          <div>
            <div className="form-label flex items-center gap-1">
              <EyeOff size={12} /> 자동 종료 시각 (선택 · 10분 단위)
            </div>
            <DateTime10Picker
              date={endDate}
              hour={endHour}
              minute={endMinute}
              onChange={(d, h, m) => {
                setEndDate(d)
                setEndHour(h)
                setEndMinute(m)
              }}
              minDate={minDate}
            />
            <div className="text-[11px] text-text-soft mt-1">
              지정 시각에 자동으로 ARCHIVED 처리됩니다.
            </div>
          </div>

          {readOnly && isEdit && (
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div className="text-[11.5px] text-text-soft">
                ※ 내용 수정은 잠겼지만 일정은 운영 중에도 조정 가능합니다.
              </div>
              <button
                className="btn btn-primary btn-sm"
                disabled={updateMutation.isPending}
                onClick={handleSaveScheduleClick}
              >
                <Save size={13} />{' '}
                {updateMutation.isPending ? '저장 중...' : '일정 저장'}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="card mb-3 bg-danger-soft text-danger text-[12.5px] font-bold py-2 px-3">
          {error}
        </div>
      )}
      {toast && (
        <div className="card mb-3 bg-[#E8F3EC] text-success text-[12.5px] font-bold py-2 px-3">
          {toast}
        </div>
      )}

      {/* 상태 관리 — 게시 중(PUBLISHED) / 숨김(HIDDEN) 일 때만 노출.
          내용 수정은 잠겨도 상태 전환은 가능. ARCHIVED 는 terminal 이라 제외. */}
      {isEdit && existing && (existing.status === 'PUBLISHED' || existing.status === 'HIDDEN') && (
        <div className="card mb-4">
          <SectionLabel>상태 관리</SectionLabel>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-[12.5px] text-text-sub">
              현재 상태:{' '}
              <span className="font-extrabold text-text">
                {BAL_GAME_BE_STATUS_LABEL[existing.status]}
              </span>
              <span className="text-text-soft ml-2">
                {existing.status === 'PUBLISHED'
                  ? '— 숨김으로 잠시 내리거나, 종료로 영구 마감할 수 있습니다.'
                  : '— 다시 게시하거나 종료할 수 있습니다.'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {existing.status === 'HIDDEN' && (
                <button
                  className="btn btn-primary btn-sm"
                  disabled={pending}
                  onClick={() => setPendingStatusChange('PUBLISHED')}
                >
                  <Eye size={13} /> 다시 게시
                </button>
              )}
              {existing.status === 'PUBLISHED' && (
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={pending}
                  onClick={() => setPendingStatusChange('HIDDEN')}
                >
                  <EyeOff size={13} /> 숨김 처리
                </button>
              )}
              <button
                className="btn btn-danger btn-sm"
                disabled={pending}
                onClick={() => setPendingStatusChange('ARCHIVED')}
              >
                <Archive size={13} /> 종료 처리
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 액션 바 */}
      {!readOnly && (
        <div className="card flex items-center justify-between">
          <div className="text-[11.5px] text-text-soft">
            ※ 초안 저장 후에도 언제든 예약/발행으로 전환 가능합니다.
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => navigate('/balance')}
              disabled={pending}
            >
              <ArrowLeft size={13} /> 목록으로 가기
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pending}
              onClick={() => handleClickAction('DRAFT')}
            >
              <Save size={13} /> 초안 저장
            </button>
            <button
              className="btn btn-secondary btn-sm"
              disabled={pending || !hasScheduleInputs}
              onClick={() => handleClickAction('SCHEDULED')}
              title={!hasScheduleInputs ? '예약 시각을 먼저 선택하세요' : ''}
            >
              <Clock size={13} /> 예약 발행
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={() => handleClickAction('PUBLISHED')}
            >
              <Send size={13} /> {pending ? '저장 중...' : '즉시 발행'}
            </button>
          </div>
        </div>
      )}

      {pendingPayload && (
        <ConfirmDialog
          payload={pendingPayload}
          pending={pending}
          onCancel={() => setPendingPayload(null)}
          onConfirm={executeSubmit}
        />
      )}

      {scheduleConfirmOpen && (
        <CommonConfirmDialog
          title="일정을 저장하시겠습니까?"
          body="운영 중인 게임의 예약·자동종료 시각이 즉시 반영됩니다."
          confirmLabel="예, 저장"
          tone="warn"
          pending={updateMutation.isPending}
          onCancel={() => {
            setScheduleConfirmOpen(false)
            setScheduleConfirmPayload(null)
          }}
          onConfirm={executeSaveSchedule}
        />
      )}

      {pendingStatusChange && gameId != null && (
        <StatusChangeDialog
          target={pendingStatusChange}
          currentLabel={existing ? BAL_GAME_BE_STATUS_LABEL[existing.status] : ''}
          pending={updateMutation.isPending}
          onCancel={() => setPendingStatusChange(null)}
          onConfirm={() => {
            updateMutation.mutate(
              { gameId, payload: { status: pendingStatusChange } },
              { onSettled: () => setPendingStatusChange(null) }
            )
          }}
        />
      )}
    </>
  )
}

/* ===== 디자인 컴포넌트들 (EF-FE OptionInputCard / VsDivider / CategoryGrid 차용) ===== */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10.5px] font-extrabold text-text-soft tracking-wider uppercase mb-2">
      {children}
    </div>
  )
}

function OptionInput({
  side,
  text,
  onTextChange,
  desc,
  onDescChange,
  emoji,
  onEmojiChange,
  disabled,
}: {
  side: 'A' | 'B'
  text: string
  onTextChange: (v: string) => void
  desc: string
  onDescChange: (v: string) => void
  emoji: string
  onEmojiChange: (v: string) => void
  disabled: boolean
}) {
  const len = text.length
  const max = 255
  return (
    <div
      className="rounded-[14px] border-[1.5px] border-transparent bg-surface px-4 py-3 shadow-sm transition focus-within:border-point"
      style={{ boxShadow: '0 3px 12px rgba(150,134,191,0.10)' }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`rounded-md px-2 py-0.5 text-[10.5px] font-extrabold ${
              side === 'A' ? 'bg-point text-white' : 'bg-point-softer text-point-dark'
            }`}
          >
            {side}
          </div>
          <span className="text-[10.5px] font-bold text-text-soft tracking-wider uppercase">
            선택지 {side}
          </span>
        </div>
        <span className="text-[10.5px] text-text-soft">
          {len} / {max}
        </span>
      </div>

      {/* 1. 이모지 — 위 (중앙) */}
      <div className="flex flex-col items-center mb-2">
        <span className="text-[10px] font-bold text-text-soft tracking-wider mb-1">
          이모지
        </span>
        <input
          className="form-input text-center w-[64px] text-[22px] py-1 leading-tight"
          value={emoji}
          onChange={(e) => onEmojiChange(e.target.value)}
          disabled={disabled}
          maxLength={8}
          placeholder="🎁"
          title="이모지 (선택)"
        />
      </div>

      {/* 2. desc — 부연설명 (엔터 가능) */}
      <div className="mb-2">
        <label className="block text-[10px] font-bold text-text-soft tracking-wider mb-1">
          desc · 부연설명 (선택, 최대 500자)
        </label>
        <textarea
          className="form-input text-[12.5px]"
          value={desc}
          onChange={(e) => onDescChange(e.target.value)}
          disabled={disabled}
          placeholder={`예) ${side === 'A' ? '아침형 인간이라면' : '저녁형 인간이라면'}\n(엔터로 줄바꿈 가능)`}
          maxLength={500}
          style={{ minHeight: 56, resize: 'vertical', lineHeight: '1.5' }}
        />
      </div>

      {/* 3. option — 본문 */}
      <div>
        <label className="block text-[10px] font-bold text-text-soft tracking-wider mb-1">
          option · 선택지 본문 (필수, 최대 255자)
        </label>
        <textarea
          value={text}
          onChange={(e) => onTextChange(e.target.value)}
          disabled={disabled}
          placeholder={
            side === 'A'
              ? '예) 출근길 지하철 개찰구 앞에서\n교통카드 놓고온 거 인지함'
              : '예) 퇴근길 지하철 개찰구 앞에서\n이어폰 두고온 거 인지함'
          }
          className="form-input text-[13px]"
          style={{ minHeight: 72, resize: 'vertical', lineHeight: '1.5' }}
          maxLength={max}
        />
      </div>
    </div>
  )
}

/**
 * 미리보기 — EF-FE features/home/components/BalanceCard 와 동일 룩.
 * 단, 어드민 편집 미리보기이므로 다음은 제외:
 *  - LIVE 태그·참여자 수 (아직 게시 전)
 *  - 결과 바·% (투표 데이터 없음)
 *  - 댓글 미리보기, HOT, "댓글 N개 모두 보기" 하단 바
 *
 * 유지: 상단 리본 2개 / 라운드+보더+그림자 / 설명 / A·VS·B 옵션 카드 (이모지+라벨 placeholder).
 * EF-FE 신청 화면(BalGameApplyScreen) 의 BalanceCard preview 와 동일한 느낌.
 */
/**
 * 미리보기 컨테이너 — 모바일 화면에 표시되는 가로 폭/비율을 유지해
 * 옵션 카드가 너무 넓게 펴지지 않도록만 잡아준다. (폰 베젤/노치 없음)
 *
 * - 360px 폭 (현대 폰 평균)
 * - 좌우 18px 패딩 (실제 앱의 카드 좌우 마진 재현)
 * - max-w-full 로 작은 뷰포트에서는 줄어듦
 */
function PhonePreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center py-2">
      <div
        className="w-full"
        style={{
          maxWidth: 360,
          paddingLeft: 18,
          paddingRight: 18,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function BalanceGamePreviewCard({
  optionA,
  optionADesc,
  optionAEmoji,
  optionB,
  optionBDesc,
  optionBEmoji,
  description,
}: {
  optionA: string
  optionADesc: string
  optionAEmoji: string
  optionB: string
  optionBDesc: string
  optionBEmoji: string
  description: string
}) {
  const aFilled = optionA.trim().length > 0
  const bFilled = optionB.trim().length > 0

  return (
    <div className="relative" style={{ paddingTop: 8 }}>
      {/* 상단 리본 2개 — EF-FE BalanceCard 동일 위치/색 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 24,
          width: 36,
          height: 14,
          backgroundColor: '#9686BF',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          zIndex: 2,
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: 0,
          left: 62,
          width: 36,
          height: 14,
          backgroundColor: '#B4A8D6',
          borderTopLeftRadius: 6,
          borderTopRightRadius: 6,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          zIndex: 2,
        }}
      />

      <div
        className="bg-surface rounded-[24px] px-[18px] pt-5 pb-4 border-[1.5px]"
        style={{
          borderColor: 'rgba(150,134,191,0.22)',
          boxShadow: '0 8px 18px rgba(150,134,191,0.14)',
        }}
      >
        {/* 설명 (있을 때만) — EF-FE BalanceCard 와 동일 스타일 */}
        {description.trim() && (
          <div
            className="text-[14px] font-bold mt-[10px]"
            style={{
              color: '#1C1A1F',
              lineHeight: '21px',
              letterSpacing: -0.2,
              whiteSpace: 'pre-line',
            }}
          >
            {description}
          </div>
        )}

        {/* 옵션 행 */}
        <div className="flex items-stretch gap-[10px] mt-4">
          <PreviewOptionBlock
            side="A"
            emoji={optionAEmoji}
            label={optionA}
            desc={optionADesc}
            filled={aFilled}
          />

          <div className="self-center">
            <div
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center"
              style={{
                backgroundColor: '#9686BF',
                boxShadow: '0 3px 6px rgba(150,134,191,0.4)',
              }}
            >
              <span className="text-[12px] font-extrabold text-white">VS</span>
            </div>
          </div>

          <PreviewOptionBlock
            side="B"
            emoji={optionBEmoji}
            label={optionB}
            desc={optionBDesc}
            filled={bFilled}
          />
        </div>
      </div>
    </div>
  )
}

function PreviewOptionBlock({
  side,
  emoji,
  label,
  desc,
  filled,
}: {
  side: 'A' | 'B'
  emoji: string
  label: string
  desc: string
  filled: boolean
}) {
  const background =
    side === 'A' ? 'rgba(150,134,191,0.14)' : 'rgba(150,134,191,0.22)'
  const borderColor =
    side === 'A' ? 'rgba(150,134,191,0.20)' : 'rgba(150,134,191,0.25)'
  const hasDesc = !!desc && desc.trim().length > 0
  return (
    <div
      className="flex-1 rounded-[18px] flex flex-col items-center px-[10px] py-[14px]"
      style={{
        backgroundColor: background,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor,
      }}
    >
      {emoji && (
        <div className="text-[24px] mb-[6px] leading-none">{emoji}</div>
      )}
      {hasDesc && (
        <div
          className="text-[9.5px] text-center font-bold mb-[5px] break-words"
          style={{
            color: '#7E6BAD',
            lineHeight: '14px',
            letterSpacing: -0.1,
            wordBreak: 'keep-all',
            whiteSpace: 'pre-line',
          }}
        >
          {desc}
        </div>
      )}
      <div
        className="text-[12px] font-extrabold text-center break-words"
        style={{
          color: filled ? '#6A579A' : 'rgba(106,87,154,0.5)',
          lineHeight: '18px',
          letterSpacing: -0.2,
          wordBreak: 'keep-all',
          whiteSpace: 'pre-line',
        }}
      >
        {filled ? label : `선택지 ${side}를 입력하면\n여기에 표시돼요`}
      </div>
    </div>
  )
}

function CategoryGrid({
  value,
  onChange,
  disabled,
}: {
  value: BalBeCategory
  onChange: (v: BalBeCategory) => void
  disabled?: boolean
}) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {BAL_BE_CATEGORIES.map((c) => {
        const selected = value === c.value
        return (
          <button
            key={c.value}
            type="button"
            disabled={disabled}
            onClick={() => !disabled && onChange(c.value)}
            className={`flex flex-col items-center gap-1 rounded-[14px] py-3 px-2 border-[1.5px] transition ${
              selected
                ? 'border-point bg-point-softer'
                : 'border-transparent bg-surface hover:border-point-soft'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              boxShadow: selected ? 'none' : '0 2px 6px rgba(150,134,191,0.10)',
            }}
          >
            <div className="text-[20px] leading-none">{c.emoji}</div>
            <div
              className={`text-[11.5px] font-bold ${
                selected ? 'text-point-dark' : 'text-text-sub'
              }`}
            >
              {c.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function DateTime10Picker({
  date,
  hour,
  minute,
  onChange,
  minDate,
}: {
  date: string
  hour: number | ''
  minute: number | ''
  onChange: (d: string, h: number | '', m: number | '') => void
  minDate: string
}) {
  return (
    <div className="flex items-end gap-2 flex-wrap">
      <input
        type="date"
        className="form-input w-[170px]"
        value={date}
        min={minDate}
        onChange={(e) => onChange(e.target.value, hour, minute)}
      />
      <select
        className="form-input w-[90px]"
        value={hour}
        onChange={(e) =>
          onChange(date, e.target.value === '' ? '' : Number(e.target.value), minute)
        }
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {String(h).padStart(2, '0')}시
          </option>
        ))}
      </select>
      <select
        className="form-input w-[90px]"
        value={minute}
        onChange={(e) =>
          onChange(date, hour, e.target.value === '' ? '' : Number(e.target.value))
        }
      >
        <option value="">--</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {String(m).padStart(2, '0')}분
          </option>
        ))}
      </select>
      {!!date && hour !== '' && minute !== '' && (
        <>
          <span className="text-[12px] text-point-dark font-bold ml-1 mb-1">
            → {date} {String(Number(hour)).padStart(2, '0')}:
            {String(Number(minute)).padStart(2, '0')}
          </span>
          <button
            type="button"
            className="btn btn-ghost btn-sm ml-auto"
            onClick={() => onChange('', '', '')}
          >
            해제
          </button>
        </>
      )}
    </div>
  )
}

/**
 * 신규 등록/수정 시 발행 모드별 확인 다이얼로그. 공용 ConfirmDialog 를 감싸 메타 테이블만 추가.
 */
function ConfirmDialog({
  payload,
  pending,
  onCancel,
  onConfirm,
}: {
  payload: BalGameCreateRequest
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const status = payload.status ?? 'DRAFT'
  const meta =
    status === 'DRAFT'
      ? {
          title: '초안으로 저장하시겠습니까?',
          description: '게시되지 않고, 이후에 다시 열어서 예약/즉시 발행할 수 있습니다.',
          tone: 'primary' as const,
          label: '예, 초안 저장',
        }
      : status === 'SCHEDULED'
        ? {
            title: '예약 발행하시겠습니까?',
            description: `${payload.scheduledAt?.slice(0, 16).replace('T', ' ')} 에 자동 게시됩니다.`,
            tone: 'primary' as const,
            label: '예, 예약',
          }
        : {
            title: '지금 즉시 발행하시겠습니까?',
            description: '발행되는 즉시 유저에게 노출되고 투표가 시작됩니다.',
            tone: 'danger' as const,
            label: '예, 발행',
          }
  const body = (
    <>
      <div className="mb-4">{meta.description}</div>
      <div className="bg-surface-alt rounded-md p-3 text-[12px] space-y-1">
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">A</span>
          <span className="font-bold">
            {payload.optionAEmoji ?? ''} {payload.optionA}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">B</span>
          <span className="font-bold">
            {payload.optionBEmoji ?? ''} {payload.optionB}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">카테고리</span>
          <span>{BAL_BE_CATEGORY_LABEL[payload.categoryCode]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">상태</span>
          <span>{BAL_GAME_BE_STATUS_LABEL[status]}</span>
        </div>
        {payload.scheduledEndAt && (
          <div className="flex justify-between">
            <span className="text-text-soft font-bold">자동 종료</span>
            <span>{payload.scheduledEndAt.slice(0, 16).replace('T', ' ')}</span>
          </div>
        )}
      </div>
    </>
  )
  return (
    <CommonConfirmDialog
      title={meta.title}
      body={body}
      confirmLabel={meta.label}
      tone={meta.tone}
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

/**
 * 게시 중 / 숨김 상태 게임에서 상태만 전환하는 확인 다이얼로그.
 * - PUBLISHED → HIDDEN : 잠시 내림 (복구 가능)
 * - PUBLISHED → ARCHIVED : 영구 종료 (복구 불가)
 * - HIDDEN → PUBLISHED : 다시 노출
 * - HIDDEN → ARCHIVED : 영구 종료
 */
function StatusChangeDialog({
  target,
  currentLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  target: BalGameBeStatus
  currentLabel: string
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const meta =
    target === 'PUBLISHED'
      ? {
          title: '다시 게시하시겠습니까?',
          description: '유저 화면에 다시 노출됩니다. 누적 투표·댓글은 그대로 유지됩니다.',
          label: '예, 다시 게시',
          tone: 'primary' as const,
        }
      : target === 'HIDDEN'
        ? {
            title: '숨김 처리하시겠습니까?',
            description:
              '유저 화면에서 즉시 숨겨집니다. "다시 게시" 로 언제든 복구할 수 있고, 누적 투표·댓글은 보존됩니다.',
            label: '예, 숨김',
            tone: 'warn' as const,
          }
        : {
            title: '종료 처리하시겠습니까?',
            description: '영구 종료되어 더 이상 게시·복구할 수 없습니다. 누적 통계는 보존됩니다.',
            label: '예, 종료',
            tone: 'danger' as const,
          }
  const body = (
    <>
      <div className="mb-4">{meta.description}</div>
      <div className="bg-surface-alt rounded-md p-3 text-[12px] space-y-1">
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">현재</span>
          <span className="font-bold">{currentLabel}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-soft font-bold">변경 후</span>
          <span className="font-extrabold">{BAL_GAME_BE_STATUS_LABEL[target]}</span>
        </div>
      </div>
    </>
  )
  return (
    <CommonConfirmDialog
      title={meta.title}
      body={body}
      confirmLabel={meta.label}
      tone={meta.tone}
      pending={pending}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}
