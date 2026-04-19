import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck,
  LayoutDashboard,
  Settings,
  UserCheck,
  AlertTriangle,
  Unlock,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function TestCenterPage() {
  const navigate = useNavigate()
  const storeLogin = useAuthStore((s) => s.login)

  const handleDevEnter = () => {
    storeLogin('dev-fake-token', {
      id: 0,
      uuid: 'dev-uuid',
      login_id: 'dev',
      name: '개발자',
      email: 'dev@local',
      phone: '',
      role: 'SUPER_ADMIN',
      is_active: true,
      deactivated_at: null,
      deactivated_reason: null,
      last_login_at: null,
      last_login_ip: null,
      create_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    })
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <div className="w-full max-w-[480px] flex flex-col items-center pt-6 pb-10">
        <ShieldCheck color="#9686BF" size={48} strokeWidth={2} />
        <div className="text-[22px] font-black text-point mt-4 mb-2">
          EF Admin Test Center 💜
        </div>
        <div className="text-[13px] text-text-sub mb-10 text-center">
          관리자 시스템 개발용 테스트 페이지입니다.
        </div>

        {/* 0. 개발용 바로 진입 */}
        <button
          onClick={handleDevEnter}
          className="w-full flex items-center justify-center gap-2 bg-[#3E9F7A] text-white py-4 rounded-2xl mb-4 shadow-lg font-bold text-[15px] hover:opacity-90 transition"
        >
          <Unlock size={18} />
          <span>🔓 개발용 바로 진입 (로그인 우회)</span>
        </button>

        {/* 1. 대시보드 */}
        <button
          onClick={() => navigate('/dashboard')}
          className="w-full flex items-center justify-center gap-2 bg-point text-white py-4 rounded-2xl mb-4 shadow-point font-bold text-[15px] hover:bg-point-dark transition"
        >
          <LayoutDashboard size={18} />
          <span>관리자 대시보드 진입</span>
        </button>

        {/* 2. 유저 관리 */}
        <button
          onClick={() => navigate('/users')}
          className="w-full flex items-center justify-center gap-2 bg-surface text-point border-2 border-point py-4 rounded-2xl mb-4 font-bold text-[15px] hover:bg-point-softer transition"
        >
          <UserCheck size={18} />
          <span>유저 관리 페이지</span>
        </button>

        {/* 3. 없는 페이지로 가기 */}
        <button
          onClick={() => navigate('/this-is-not-real')}
          className="w-full flex items-center justify-center gap-2 bg-surface text-point border-2 border-point py-4 rounded-2xl mb-4 font-bold text-[15px] hover:bg-point-softer transition"
        >
          <Settings size={18} />
          <span>없는 페이지로 가기</span>
        </button>

        <div className="w-full h-px bg-border-strong my-6" />

        {/* 4. 에러 페이지 테스트 */}
        <button
          onClick={() => navigate('/not-found-test')}
          className="w-full flex items-center justify-center gap-2 bg-surface-alt text-text-sub border border-border-strong py-4 rounded-2xl mb-4 font-bold text-[15px] hover:bg-bg transition"
        >
          <AlertTriangle size={18} />
          <span>에러(404) 페이지 테스트</span>
        </button>

        <div className="text-[11px] text-text-soft mt-4">
          현재 경로: apps/web/src/pages/TestCenter.tsx
        </div>
      </div>
    </div>
  )
}
