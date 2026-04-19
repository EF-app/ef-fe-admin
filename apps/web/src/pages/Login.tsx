import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLoginMutation, validators } from '@ef-fe-admin/shared'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useLoginMutation({
    onSuccess: (data) => {
      storeLogin(data.token, data.admin)
      navigate('/dashboard', { replace: true })
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const idCheck = validators.loginId(loginId)
    const pwCheck = validators.password(password)
    if (!idCheck.valid) return setError(idCheck.message ?? '')
    if (!pwCheck.valid) return setError(pwCheck.message ?? '')
    loginMutation.mutate({ login_id: loginId, password })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-6">
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-xl shadow-lg p-10 w-full max-w-[420px]"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-point rounded-xl flex items-center justify-center text-white font-black shadow-point">
            EF
          </div>
          <div>
            <div className="text-[18px] font-extrabold">EF 관리자</div>
            <div className="text-[11.5px] text-text-soft">Admin Console</div>
          </div>
        </div>

        <div className="mb-5">
          <label className="form-label">아이디</label>
          <input
            className="form-input"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="mb-6">
          <label className="form-label">비밀번호</label>
          <input
            type="password"
            className="form-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 bg-danger-soft text-danger rounded-md text-[12px] font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary w-full py-3"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? '로그인 중...' : '로그인'}
        </button>

        <div className="text-[11px] text-text-soft text-center mt-6">
          © 2026 EF. All rights reserved.
        </div>
      </form>
    </div>
  )
}
