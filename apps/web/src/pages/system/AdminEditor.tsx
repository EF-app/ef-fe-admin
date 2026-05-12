import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  useAdmins,
  useCreateAdminMutation,
  useUpdateAdminMutation,
  formatDateTime,
  ADMIN_ROLE,
  ADMIN_ROLE_LABEL,
} from '@ef-fe-admin/shared'
import type { AdminAccount, AdminRole } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'

/**
 * 관리자 계정 등록/편집 페이지.
 *   /admins/new       : 신규 등록
 *   /admins/:id       : 기존 편집
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

  const [loginId, setLoginId] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState<AdminRole>('CS')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [deactivatedReason, setDeactivatedReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (existing) {
      setLoginId(existing.login_id)
      setName(existing.name)
      setEmail(existing.email)
      setPhone(existing.phone)
      setRole(existing.role)
      setIsActive(existing.is_active)
      setDeactivatedReason(existing.deactivated_reason ?? '')
    }
  }, [existing?.id])

  const createMutation = useCreateAdminMutation({
    onSuccess: () => navigate('/admins'),
    onError: (e) => setError(e.message),
  })
  const updateMutation = useUpdateAdminMutation({
    onSuccess: () => navigate('/admins'),
    onError: (e) => setError(e.message),
  })
  const pending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = () => {
    setError(null)
    if (!isEdit) {
      if (!loginId || !name || !email || !phone || !password) {
        return setError('모든 항목을 입력해주세요.')
      }
      createMutation.mutate({
        login_id: loginId,
        name,
        email,
        phone,
        role,
        password,
      })
      return
    }
    if (!existing) return
    updateMutation.mutate({
      id: existing.id,
      payload: {
        name,
        email,
        phone,
        role,
        is_active: isActive,
        deactivated_reason: isActive ? undefined : deactivatedReason,
      },
    })
  }

  if (isEdit && !existing) {
    return (
      <>
        <Topbar title="관리자 편집" subtitle="불러오는 중..." />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/admins')} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> 관리자 목록
        </button>
      </div>

      <Topbar
        title={isEdit ? '관리자 편집' : '관리자 추가'}
        subtitle={
          isEdit
            ? `${existing?.login_id} · ${ADMIN_ROLE_LABEL[existing!.role]}`
            : '로그인 ID / 이름 / 권한 등을 입력하세요'
        }
      />

      <div className="card mb-4 space-y-3">
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
            <label className="form-label">이름</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="form-label">이메일</label>
            <input className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="form-label">전화번호</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

        <div>
          <label className="form-label">역할</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(ADMIN_ROLE).map((r) => (
              <button
                key={r}
                type="button"
                className={`chip ${role === r ? 'active' : ''}`}
                onClick={() => setRole(r)}
              >
                {ADMIN_ROLE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        {isEdit && (
          <>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-[var(--color-point)] w-4 h-4"
              />
              <span className="text-[13px] font-bold">계정 활성</span>
            </label>
            {!isActive && (
              <div>
                <label className="form-label">비활성 사유</label>
                <input
                  className="form-input"
                  value={deactivatedReason}
                  onChange={(e) => setDeactivatedReason(e.target.value)}
                  placeholder="퇴사, 권한 박탈 등"
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

        <div className="flex justify-end gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admins')}>
            취소
          </button>
          <button
            className="btn btn-primary btn-sm"
            disabled={pending}
            onClick={handleSubmit}
          >
            {pending ? '저장 중...' : isEdit ? '저장' : '추가'}
          </button>
        </div>
      </div>
    </>
  )
}
