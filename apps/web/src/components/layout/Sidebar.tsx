import { NavLink } from 'react-router-dom'
import {
  Home,
  Users,
  AlertTriangle,
  CreditCard,
  Megaphone,
  Scale,
  Heart,
  FileText,
} from 'lucide-react'
import { useDashboardAlerts } from '@ef-fe-admin/shared'

interface NavItemDef {
  to: string
  label: string
  icon: React.ReactNode
  badgeKey?: 'pending_reports' | 'pending_refunds' | 'pending_bal_applies' | 'pending_profile_reviews'
}

const SECTIONS: { title: string; items: NavItemDef[] }[] = [
  {
    title: '운영',
    items: [
      { to: '/dashboard', label: '대시보드', icon: <Home size={16} /> },
      { to: '/users', label: '유저 관리', icon: <Users size={16} /> },
      { to: '/reports', label: '신고 처리', icon: <AlertTriangle size={16} />, badgeKey: 'pending_reports' },
      { to: '/refunds', label: '환불·결제', icon: <CreditCard size={16} />, badgeKey: 'pending_refunds' },
    ],
  },
  {
    title: '콘텐츠',
    items: [
      { to: '/notices', label: '공지사항', icon: <Megaphone size={16} /> },
      { to: '/balance', label: '밸런스 게임', icon: <Scale size={16} />, badgeKey: 'pending_bal_applies' },
      { to: '/matching', label: '매칭 운영', icon: <Heart size={16} /> },
    ],
  },
  {
    title: '시스템',
    items: [
      { to: '/audit', label: '감사 로그', icon: <FileText size={16} /> },
    ],
  },
]

export default function Sidebar() {
  const { data: alerts } = useDashboardAlerts({
    refetchInterval: 60_000,
  })

  return (
    <aside className="bg-surface border-r border-border sticky top-0 h-screen overflow-y-auto w-[240px] p-7 px-4">
      <div className="flex items-center gap-2.5 pb-6 mb-4 border-b border-border px-3">
        <div className="w-9 h-9 bg-point rounded-[10px] flex items-center justify-center text-white font-black text-[15px] shadow-point">
          EF
        </div>
        <div>
          <div className="font-extrabold text-[16px] tracking-tight">EF 관리자</div>
          <div className="text-[11px] text-text-soft font-normal mt-0.5">Admin Console</div>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.title}>
          <div className="px-3 py-2 text-[10px] font-bold text-text-soft tracking-wider uppercase mt-3">
            {section.title}
          </div>
          {section.items.map((item) => {
            const count = item.badgeKey ? alerts?.[item.badgeKey] : undefined
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-md text-[13.5px] font-bold mb-0.5 transition ${
                    isActive
                      ? 'bg-point text-white shadow-point'
                      : 'text-text-sub hover:bg-point-softer hover:text-point-dark'
                  }`
                }
              >
                <span className="w-[18px] h-[18px] inline-flex items-center justify-center">
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {count != null && count > 0 && (
                  <span className="text-[10px] bg-danger text-white rounded-full px-1.5 py-0.5 font-extrabold">
                    {count}
                  </span>
                )}
              </NavLink>
            )
          })}
        </div>
      ))}
    </aside>
  )
}
