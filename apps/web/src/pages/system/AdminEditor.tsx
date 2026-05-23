import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Save, X as XIcon, Unlock, KeyRound } from 'lucide-react'
import {
  useAdmins,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  useChangeMyPasswordMutation,
  useForceChangeAdminPasswordMutation,
  useUnlockAdminMutation,
  formatDateTime,
} from '@ef-fe-admin/shared'
import type { AdminAccount } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import { useAuthStore } from '../../store/authStore'

/**
 * 관리자 계정 페이지.
 *   /admin/account/new       : 신규 등록
 *   /admin/account/:id       : 기존 상세 — 기본 read-only, [수정하기] → 편집 모드 → [저장] → 확인 → 저장 → 다시 read-only
 */
export default function AdminEditorPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  // 단건 조회 hook 이 없으므로 list 에서 찾는 방식
  const { data: list } = useAdmins({ size: 50 })
  const existing: AdminAccount | undefined = isEdit
    ? list?.content.find((a) => a.id === Number(id))
    : undefined

  // view = 보기, edit = 편집. 기존 관리자 진입 시 기본 view, 신규는 항상 edit 흐름.
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const isView = isEdit && mode === 'view'

  const [loginId, setLoginId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [deactivatedReason, setDeactivatedReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmSave, setConfirmSave] = useState(false)

  useEffect(() => {
    if (existing) {
      setLoginId(existing.login_id)
      setName(existing.name)
      setEmail(existing.email)
      setIsActive(existing.is_active)
      setDeactivatedReason(existing.deactivated_reason ?? '')
    }
  }, [existing?.id])

  const createMutation = useCreateAdminMutation({
    onSuccess: () => navigate('/admin/account'),
    onError: (e) => setError(e.message),
  })
  const updateMutation = useUpdateAdminMutation({
    onSuccess: () => {
      // 수정 후 상세(view) 로 복귀 — 목록으로 가지 않음
      setMode('view')
      setConfirmSave(false)
      setError(null)
    },
    onError: (e) => {
      setError(e.message)
      setConfirmSave(false)
    },
  })
  const pending = createMutation.isPending || updateMutation.isPending

  const handleCreate = () => {
    setError(null)
    if (!loginId || !name || !email || !password) {
      return setError('모든 항목을 입력해주세요.')
    }
    createMutation.mutate({
      login_id: loginId,
      name,
      email,
      // phone / role 은 shared 타입 호환을 위한 더미 — BE 미사용, 화면 비표시
      phone: '',
      role: 'CS',
      password,
    })
  }

  const handleClickSave = () => {
    setError(null)
    setConfirmSave(true)
  }
  const executeSave = () => {
    if (!existing) return
    updateMutation.mutate({
      id: existing.id,
      payload: {
        email,
        is_active: isActive,
        deactivated_reason: isActive ? undefined : deactivatedReason,
      },
    })
  }
  const cancelEdit = () => {
    // 편집 중인 값 되돌리기
    if (existing) {
      setEmail(existing.email)
      setIsActive(existing.is_active)
      setDeactivatedReason(existing.deactivated_reason ?? '')
    }
    setError(null)
    setMode('view')
  }

  if (isEdit && !existing) {
    return (
      <>
        <Topbar title="관리자 상세" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/admin/account')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 관리자 목록
        </button>
      </div>

      <Topbar
        title={isEdit ? '관리자 상세' : '관리자 추가'}
        subtitle={
          isEdit
            ? `#${existing?.id} #${existing?.login_id}`
            : '로그인 ID / 이름 / 이메일 등을 입력하세요'
        }
      />

      <div className="card mb-4 space-y-3">
        {/* 상단 액션 — 기존 관리자일 때만 (신규는 하단 [추가] 버튼만) */}
        {isEdit && (
          <div className="flex items-center justify-end">
            {isView ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setMode('edit')}
              >
                <Pencil size={13} /> 수정하기
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={cancelEdit}
                disabled={pending}
              >
                <XIcon size={13} /> 편집 취소
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="form-label">
              로그인 ID {isEdit && <span className="text-text-soft text-[10.5px]">(수정 불가)</span>}
            </label>
            <input
              className={`form-input ${isEdit ? 'opacity-50' : ''}`}
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              disabled={isEdit}
            />
          </div>
          <div>
            <label className="form-label">
              이름 {isEdit && <span className="text-text-soft text-[10.5px]">(수정 불가)</span>}
            </label>
            <input
              className={`form-input ${isEdit ? 'opacity-50' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isEdit}
            />
          </div>
          <div>
            <label className="form-label">이메일</label>
            <input
              className={`form-input ${isView ? 'opacity-70' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isView}
            />
          </div>
          {!isEdit && (
            <div>
              <label className="form-label">초기 비밀번호</label>
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          )}
        </div>

        {isEdit && (
          <>
            <label
              className={`inline-flex items-center gap-2 ${
                isView ? 'opacity-70 cursor-default' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[var(--color-point)] w-4 h-4"
                disabled={isView}
              />
              <span className="text-[13px] font-bold">계정 활성</span>
            </label>
            {/* 비활성 사유 — 계정이 비활성일 때만 노출. 활성 체크 상태에서는 의미 없음. */}
            {!isActive && (
              <div>
                <label className="form-label">비활성 사유</label>
                <input
                  className={`form-input ${isView ? 'opacity-70' : ''}`}
                  value={deactivatedReason}
                  onChange={(e) => setDeactivatedReason(e.target.value)}
                  placeholder="퇴사, 권한 박탈 등"
                  disabled={isView}
                />
              </div>
            )}
            {existing?.last_login_at && (
              <div className="text-[11.5px] text-text-soft">
                마지막 로그인: {formatDateTime(existing.last_login_at)}
                {existing.last_login_ip && ` (${existing.last_login_ip})`}
              </div>
            )}
          </>
        )}

        {error && <div className="text-[12px] text-danger font-bold">{error}</div>}

        {/* 하단 액션 */}
        {!isEdit ? (
          <div className="flex justify-end gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/account')}>
              취소
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={pending}
              onClick={handleCreate}
            >
              {pending ? '저장 중...' : '추가'}
            </button>
          </div>
        ) : (
          mode === 'edit' && (
            <div className="flex justify-end gap-2">
              <button
                className="btn btn-secondary btn-sm"
                onClick={cancelEdit}
                disabled={pending}
              >
                취소
              </button>
              <button
                className="btn btn-primary btn-sm"
                disabled={pending}
                onClick={handleClickSave}
              >
                <Save size={13} /> {pending ? '저장 중...' : '저장'}
              </button>
            </div>
          )
        )}
      </div>

      {/* 잠금 상태 표시 + 해제 버튼 — lockedUntil 이 미래일 때만 */}
      {isEdit && existing && <LockStatusSection admin={existing} />}

      {/* 비밀번호 변경 — 본인 한정. */}
      {isEdit && existing && (
        <PasswordChangeSection editingAdminId={existing.id} />
      )}

      {/* 다른 관리자 비번 강제 변경 — 본인 아닐 때만 노출 */}
      {isEdit && existing && (
        <ForcePasswordResetSection adminId={existing.id} loginId={existing.login_id} />
      )}

      {/* 저장 확인 팝업 */}
      {confirmSave && (
        <ConfirmDialog
          title="저장하시겠습니까?"
          body="변경한 내용을 저장합니다."
          confirmLabel="예, 저장"
          pending={updateMutation.isPending}
          onCancel={() => setConfirmSave(false)}
          onConfirm={executeSave}
        />
      )}
    </>
  )
}

/* ===== 저장 확인 다이얼로그 ===== */
function ConfirmDialog({
  title,
  body,
  confirmLabel,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string
  body: string
  confirmLabel: string
  pending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,39,48,0.5)] backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-surface rounded-xl shadow-lg p-6 w-full max-w-[420px] mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[17px] font-extrabold mb-2">{title}</div>
        <div className="text-[13px] text-text-sub leading-relaxed mb-5">{body}</div>
        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={onCancel} disabled={pending}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? '저장 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * 비밀번호 변경 — BE 는 /v1/admin/account/me/password (본인만).
 * 본인 계정 편집 화면이면 입력 가능. 다른 관리자 편집 화면에서는 안내 메시지로 노출.
 */
function PasswordChangeSection({ editingAdminId }: { editingAdminId: number }) {
  const currentAdminId = useAuthStore((s) => s.admin?.id ?? null)
  const isSelf = currentAdminId === editingAdminId
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const mutation = useChangeMyPasswordMutation({
    onSuccess: () => {
      setMsg({ kind: 'ok', text: '비밀번호가 변경되었습니다.' })
      setCurrent('')
      setNext('')
      setConfirm('')
    },
    onError: (e) => setMsg({ kind: 'err', text: e.message }),
  })

  const submit = () => {
    setMsg(null)
    if (!current || !next || !confirm) {
      return setMsg({ kind: 'err', text: '모든 항목을 입력해주세요.' })
    }
    if (next !== confirm) {
      return setMsg({ kind: 'err', text: '새 비밀번호 확인이 일치하지 않습니다.' })
    }
    if (next.length < 8) {
      return setMsg({ kind: 'err', text: '새 비밀번호는 8자 이상이어야 합니다.' })
    }
    mutation.mutate({ current_password: current, new_password: next })
  }

  // 본인 아니면 이 섹션 자체를 숨김 — 다른 관리자는 ForcePasswordResetSection 에서 처리.
  if (!isSelf) return null

  return (
    <div className="card space-y-3">
      <div className="text-[13px] font-extrabold">비밀번호 변경 (본인)</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="form-label">현재 비밀번호</label>
          <input
            type="password"
            className="form-input"
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="form-label">새 비밀번호</label>
          <input
            type="password"
            className="form-input"
            value={next}
            onChange={(e) => setNext(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label className="form-label">새 비밀번호 확인</label>
          <input
            type="password"
            className="form-input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </div>
      </div>
      {msg && (
        <div
          className={`text-[12px] font-bold ${
            msg.kind === 'ok' ? 'text-success' : 'text-danger'
          }`}
        >
          {msg.text}
        </div>
      )}
      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm"
          disabled={mutation.isPending}
          onClick={submit}
        >
          {mutation.isPending ? '변경 중...' : '비밀번호 변경'}
        </button>
      </div>
    </div>
  )
}

/**
 * 잠금 상태 배너 + 해제 버튼.
 *   lockedUntil 이 현재 시각보다 미래일 때만 노출.
 *   해제는 확인 팝업 후 PATCH /v1/admin/account/{id}/unlock.
 */
function LockStatusSection({ admin }: { admin: AdminAccount }) {
  const lockedUntil = admin.locked_until
  const isLocked = !!lockedUntil && new Date(lockedUntil).getTime() > Date.now()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const mutation = useUnlockAdminMutation({
    onSuccess: () => {
      setMsg({ kind: 'ok', text: '잠금이 해제되었습니다.' })
      setConfirmOpen(false)
    },
    onError: (e) => {
      setMsg({ kind: 'err', text: e.message })
      setConfirmOpen(false)
    },
  })

  if (!isLocked) {
    // 잠금 상태가 아니면 성공 메시지만 잠깐 노출 (해제 직후 케이스)
    if (msg?.kind === 'ok') {
      return (
        <div className="card text-[12.5px] text-success font-bold">{msg.text}</div>
      )
    }
    return null
  }

  return (
    <>
      <div className="card flex items-center justify-between gap-3 border border-warn/40 bg-warn/5">
        <div className="text-[12.5px]">
          <div className="font-extrabold text-warn-dark">⚠ 계정 잠금 상태</div>
          <div className="text-text-soft mt-1">
            비밀번호 실패 누적으로 잠겨 있습니다. 해제 예정: {formatDateTime(lockedUntil)}
          </div>
          {msg?.kind === 'err' && (
            <div className="text-danger font-bold mt-1">{msg.text}</div>
          )}
        </div>
        <button
          className="btn btn-secondary btn-sm shrink-0"
          onClick={() => setConfirmOpen(true)}
          disabled={mutation.isPending}
        >
          <Unlock size={13} /> 잠금 해제
        </button>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="잠금을 해제하시겠습니까?"
          body={`#${admin.id} ${admin.login_id} 계정의 lockedUntil 을 즉시 NULL 로 초기화합니다.`}
          confirmLabel="예, 해제"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => mutation.mutate(admin.id)}
        />
      )}
    </>
  )
}

/**
 * 다른 관리자 비밀번호 강제 변경.
 *   본인 페이지에서는 표시 안 함 (본인은 PasswordChangeSection 사용).
 *   현재 비밀번호 확인 없이 즉시 교체. 확인 팝업 1단계.
 */
function ForcePasswordResetSection({
  adminId,
  loginId,
}: {
  adminId: number
  loginId: string
}) {
  const currentAdminId = useAuthStore((s) => s.admin?.id ?? null)
  const isSelf = currentAdminId === adminId
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const mutation = useForceChangeAdminPasswordMutation({
    onSuccess: () => {
      setMsg({ kind: 'ok', text: '비밀번호가 강제 변경되었습니다.' })
      setNext('')
      setConfirm('')
      setConfirmOpen(false)
    },
    onError: (e) => {
      setMsg({ kind: 'err', text: e.message })
      setConfirmOpen(false)
    },
  })

  if (isSelf) return null

  const validate = (): boolean => {
    setMsg(null)
    if (!next || !confirm) {
      setMsg({ kind: 'err', text: '새 비밀번호와 확인을 입력해주세요.' })
      return false
    }
    if (next !== confirm) {
      setMsg({ kind: 'err', text: '새 비밀번호 확인이 일치하지 않습니다.' })
      return false
    }
    if (next.length < 8) {
      setMsg({ kind: 'err', text: '새 비밀번호는 8자 이상이어야 합니다.' })
      return false
    }
    return true
  }

  return (
    <>
      <div className="card space-y-3 border border-danger/30 bg-danger/5">
        <div className="flex items-center gap-2">
          <KeyRound size={14} className="text-danger" />
          <div className="text-[13px] font-extrabold text-danger-dark">
            비밀번호 강제 변경 (관리자 권한)
          </div>
        </div>
        <div className="text-[11.5px] text-text-soft">
          현재 비밀번호 확인 없이 즉시 교체됩니다. 운영 사고 대응용으로만 사용하세요.
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="form-label">새 비밀번호 (8자 이상)</label>
            <input
              type="password"
              className="form-input"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label className="form-label">새 비밀번호 확인</label>
            <input
              type="password"
              className="form-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
        </div>
        {msg && (
          <div
            className={`text-[12px] font-bold ${
              msg.kind === 'ok' ? 'text-success' : 'text-danger'
            }`}
          >
            {msg.text}
          </div>
        )}
        <div className="flex justify-end">
          <button
            className="btn btn-primary btn-sm"
            disabled={mutation.isPending}
            onClick={() => {
              if (validate()) setConfirmOpen(true)
            }}
          >
            {mutation.isPending ? '변경 중...' : '강제 변경'}
          </button>
        </div>
      </div>

      {confirmOpen && (
        <ConfirmDialog
          title="비밀번호를 강제로 변경하시겠습니까?"
          body={`#${adminId} ${loginId} 계정의 비밀번호가 즉시 교체됩니다.`}
          confirmLabel="예, 변경"
          pending={mutation.isPending}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() =>
            mutation.mutate({ id: adminId, payload: { new_password: next } })
          }
        />
      )}
    </>
  )
}
