import { Search, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

interface TopbarProps {
  title: string
  subtitle?: string
}

export default function Topbar({ title, subtitle }: TopbarProps) {
  const admin = useAuthStore((s) => s.admin)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <div className="page-title">{title}</div>
        {subtitle && <div className="page-subtitle">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 border border-border w-[280px]">
          <Search size={14} className="text-text-soft" />
          <input
            placeholder="유저 / 주문번호 / 공지 검색"
            className="bg-transparent outline-none flex-1 text-[12.5px]"
          />
        </div>
        <div className="flex items-center gap-2.5 bg-surface rounded-full pl-1.5 pr-3.5 py-1.5 border border-border">
          <div className="w-8 h-8 rounded-full bg-point text-white flex items-center justify-center font-extrabold text-[13px]">
            {admin?.name?.[0] ?? '-'}
          </div>
          <div>
            <div className="text-[12.5px] font-extrabold leading-tight">
              {admin?.name ?? '관리자'}
            </div>
            <div className="text-[10px] text-text-soft font-normal">{admin?.role}</div>
          </div>
          <button
            onClick={logout}
            className="text-text-soft hover:text-danger ml-1.5"
            title="로그아웃"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
