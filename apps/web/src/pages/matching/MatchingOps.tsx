/**
 * @file apps/web/src/pages/matching/MatchingOps.tsx
 * @description 매칭 운영 도구 — 관리자 매칭 탭 §1.
 *
 *  BE 두 endpoint 직결:
 *   - POST /v1/admin/matches/batch/user/{userId}    특정 유저 강제 재계산
 *   - POST /v1/admin/matches/batch/recover          보정 배치 강제 실행
 *   - POST /v1/admin/matches/batch/full             전체 정상 배치 강제 실행
 *
 *  둘 다 ConfirmDialog 거쳐 발사 — 운영 영향 큰 액션이므로 실수 클릭 방지.
 *  마지막 실행 결과는 카드 안에 그대로 보여 줘 운영자가 "방금 한 게 뭐였는지" 즉시 확인.
 */
import { useState } from 'react'
import { RefreshCw, Repeat, User, Users, AlertTriangle } from 'lucide-react'
import {
  useRecomputeUserMutation,
  useRunBatchRetryMutation,
  useRunFullBatchMutation,
  formatDateTime,
} from '@ef-fe-admin/shared'
import type {
  MatchUserBatchResult,
  MatchRecoverBatchResult,
  MatchFullBatchResult,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import ConfirmDialog from '../../components/ui/ConfirmDialog'

export default function MatchingOpsPage() {
  return (
    <>
      <Topbar
        title="매칭 운영 도구"
        subtitle="장애 대응 / 디버깅 / CS 응대용. 모든 액션은 명세서 §10.22 어뷰즈 가드 · ShedLock 을 우회합니다."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecomputeUserCard />
        <BatchRetryCard />
      </div>
      <div className="mt-4">
        <FullBatchCard />
      </div>
    </>
  )
}

/* ───────── ① 특정 유저 강제 재계산 ───────── */

function RecomputeUserCard() {
  const [userIdInput, setUserIdInput] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResult, setLastResult] = useState<{
    result: MatchUserBatchResult
    finishedAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useRecomputeUserMutation({
    onSuccess: (result) => {
      setLastResult({ result, finishedAt: new Date().toISOString() })
      setConfirmOpen(false)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  const parsedId = Number(userIdInput.trim())
  const validId = Number.isInteger(parsedId) && parsedId > 0

  const handleClick = () => {
    setError(null)
    if (!validId) {
      setError('유효한 유저 ID 를 입력해 주세요.')
      return
    }
    setConfirmOpen(true)
  }

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-point" />
        <div className="font-extrabold text-[14px]">특정 유저 강제 재계산</div>
      </div>
      <div className="text-[12px] text-text-sub mb-4 leading-relaxed">
        어뷰즈 가드 (throttle / 액션≥5 / 일일 1회) 를 우회해 특정 유저의 daily_feed
        를 즉시 재계산합니다. ACTIVE 상태 유저만 가능 — 그 외는 read-time 오버레이로
        어차피 빈 응답이 됩니다.
      </div>

      <div className="space-y-3 mb-3">
        <label className="block">
          <div className="text-[11.5px] font-extrabold mb-1.5 text-text-soft">
            유저 ID
          </div>
          <input
            type="number"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
            placeholder="예: 42"
            className="w-full text-[13px] font-extrabold rounded-lg border border-divider bg-bg px-3 py-2 focus:outline-none focus:border-point"
            min={1}
          />
        </label>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[12px]">
          {error && <span className="text-danger font-bold">{error}</span>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleClick}
          disabled={mutation.isPending}
        >
          <RefreshCw size={13} />
          {mutation.isPending ? '재계산 중...' : '재계산 실행'}
        </button>
      </div>

      {lastResult && (
        <RecomputeResultBox
          result={lastResult.result}
          finishedAt={lastResult.finishedAt}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={`유저 ID ${parsedId} 의 피드를 재계산할까요?`}
          body={
            <>
              §10.22 어뷰즈 가드 3중 (throttle / 액션≥5 / 일일 1회) 모두 우회합니다.
              <br />
              ACTIVE 가 아닌 유저는 400 에러를 반환합니다.
            </>
          }
          confirmLabel="예, 재계산"
          tone="warn"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => mutation.mutate(parsedId)}
        />
      )}
    </div>
  )
}

function RecomputeResultBox({
  result,
  finishedAt,
}: {
  result: MatchUserBatchResult
  finishedAt: string
}) {
  return (
    <div className="card bg-surface-alt mt-4">
      <div className="text-[11px] font-extrabold mb-2 text-text-soft">
        📊 마지막 실행 결과 · {formatDateTime(finishedAt)}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <ResultMetric label="유저 ID" value={String(result.userId)} />
        <ResultMetric label="피드 row 수" value={String(result.cardCount)} />
        <ResultMetric
          label="소요"
          value={`${result.durationMs.toLocaleString()}ms`}
        />
      </div>
    </div>
  )
}

/* ───────── ② 보정 배치 강제 실행 ───────── */

function BatchRetryCard() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResult, setLastResult] = useState<{
    result: MatchRecoverBatchResult
    finishedAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useRunBatchRetryMutation({
    onSuccess: (result) => {
      setLastResult({ result, finishedAt: new Date().toISOString() })
      setConfirmOpen(false)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-point" />
        <div className="font-extrabold text-[14px]">전체 보정 배치 강제 실행</div>
      </div>
      <div className="text-[12px] text-text-sub mb-4 leading-relaxed">
        오늘 daily_feed row 가 없는 활성+승인 viewer 만 일괄 복구합니다. 04:00 정상 /
        05:00 cron 보정과 동일한 로직 (ShedLock 우회). idempotent — 중복 호출 안전 ·
        이미 row 있는 viewer 는 자동 skip.
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[12px]">
          {error && <span className="text-danger font-bold">{error}</span>}
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setError(null)
            setConfirmOpen(true)
          }}
          disabled={mutation.isPending}
        >
          <Repeat size={13} />
          {mutation.isPending ? '실행 중...' : '보정 배치 실행'}
        </button>
      </div>

      {lastResult && (
        <BatchRetryResultBox
          result={lastResult.result}
          finishedAt={lastResult.finishedAt}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="보정 배치를 강제 실행할까요?"
          body={
            <>
              "04:00 정상 배치 누락 의심" 시에만 사용하세요. ShedLock 을 우회하므로
              cron 과 동시 실행 가능성이 있습니다 (둘 다 idempotent 라 결과는 안전).
              <br />
              대상 viewer 수에 따라 수십 초 이상 걸릴 수 있습니다.
            </>
          }
          confirmLabel="예, 보정 배치 실행"
          tone="warn"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </div>
  )
}

function BatchRetryResultBox({
  result,
  finishedAt,
}: {
  result: MatchRecoverBatchResult
  finishedAt: string
}) {
  return (
    <div className="card bg-surface-alt mt-4">
      <div className="text-[11px] font-extrabold mb-2 text-text-soft">
        📊 마지막 실행 결과 · {formatDateTime(finishedAt)}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        <ResultMetric label="대상" value={String(result.targetCount)} />
        <ResultMetric
          label="정상 복구"
          value={String(result.recoverCount)}
          tone="success"
        />
        <ResultMetric
          label="ColdStart 복구"
          value={String(result.coldStartCount)}
          tone="point"
        />
        <ResultMetric
          label="재실패"
          value={String(result.failCount)}
          tone={result.failCount > 0 ? 'danger' : 'normal'}
        />
        <ResultMetric
          label="소요"
          value={`${result.durationMs.toLocaleString()}ms`}
        />
      </div>
    </div>
  )
}

/* ───────── ③ 전체 정상 배치 강제 실행 ───────── */

function FullBatchCard() {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [lastResult, setLastResult] = useState<{
    result: MatchFullBatchResult
    finishedAt: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mutation = useRunFullBatchMutation({
    onSuccess: (result) => {
      setLastResult({ result, finishedAt: new Date().toISOString() })
      setConfirmOpen(false)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmOpen(false)
    },
  })

  return (
    <div className="card" style={{ borderLeft: '4px solid var(--color-danger)' }}>
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle size={16} className="text-danger" />
        <div className="font-extrabold text-[14px]">전체 정상 배치 강제 실행 (04:00 cron 과 동일)</div>
      </div>
      <div className="text-[12px] text-text-sub mb-4 leading-relaxed">
        활성 viewer <strong>전체</strong> 의 daily_feed 를 재계산합니다. 보정 배치와 달리 "오늘 row 없는 viewer 만"
        이 아니라 <strong>모든 viewer 의 row 를 DELETE 후 다시 INSERT</strong> 합니다.
        매칭 로직 변경 (예: CandidateSelector shuffle 적용) 후 즉시 반영하고 싶을 때 사용하세요.
        <br />
        <span className="text-danger font-bold">
          ⚠️ 활성 viewer 수에 비례해 수분 ~ 수십분 걸릴 수 있습니다. 운영 영향 큼.
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-[12px]">
          {error && <span className="text-danger font-bold">{error}</span>}
        </div>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            setError(null)
            setConfirmOpen(true)
          }}
          disabled={mutation.isPending}
        >
          <RefreshCw size={13} />
          {mutation.isPending ? '실행 중...' : '전체 매칭 다시 돌리기'}
        </button>
      </div>

      {lastResult && (
        <FullBatchResultBox
          result={lastResult.result}
          finishedAt={lastResult.finishedAt}
        />
      )}

      {confirmOpen && (
        <ConfirmDialog
          title="전체 매칭을 다시 돌릴까요?"
          body={
            <>
              활성 viewer 전원의 daily_feed 가 새로 계산됩니다. 04:00 정상 cron 과 동일한 흐름이며,
              ShedLock 을 우회합니다.
              <br />
              <strong>처리 시간이 매우 길 수 있습니다 (활성 viewer × 평균 100ms 추정).</strong>
              <br />
              운영 시간대라면 사용자 매칭 체감 속도가 저하될 수 있습니다.
            </>
          }
          confirmLabel="예, 전체 다시 돌리기"
          tone="danger"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => mutation.mutate()}
        />
      )}
    </div>
  )
}

function FullBatchResultBox({
  result,
  finishedAt,
}: {
  result: MatchFullBatchResult
  finishedAt: string
}) {
  return (
    <div className="card bg-surface-alt mt-4">
      <div className="text-[11px] font-extrabold mb-2 text-text-soft">
        📊 마지막 실행 결과 · {formatDateTime(finishedAt)}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <ResultMetric label="총 viewer" value={String(result.totalViewers)} />
        <ResultMetric
          label="정상 처리"
          value={String(result.successCount)}
          tone="success"
        />
        <ResultMetric
          label="실패"
          value={String(result.failCount)}
          tone={result.failCount > 0 ? 'danger' : 'normal'}
        />
        <ResultMetric
          label="소요"
          value={`${result.durationMs.toLocaleString()}ms`}
        />
      </div>
    </div>
  )
}

/* ───────── 공용 ───────── */

function ResultMetric({
  label,
  value,
  tone = 'normal',
}: {
  label: string
  value: string
  tone?: 'normal' | 'success' | 'point' | 'danger'
}) {
  const color =
    tone === 'success'
      ? 'text-success'
      : tone === 'point'
        ? 'text-point-dark'
        : tone === 'danger'
          ? 'text-danger'
          : ''
  return (
    <div>
      <div className="text-[10.5px] font-bold text-text-soft mb-0.5">{label}</div>
      <div className={`text-[18px] font-extrabold ${color}`}>{value}</div>
    </div>
  )
}
