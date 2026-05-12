import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

/**
 * 반응형 레이아웃.
 * - lg(1024px) 이상: 사이드바 고정 240px + 메인
 * - 그 미만: 사이드바 숨김. 햄버거 버튼으로 오버레이 형태 슬라이드 인
 */
export default function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // 라우트 이동 시 모바일 사이드바 자동 닫기
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // 모바일 메뉴 열렸을 때 body 스크롤 잠금
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [mobileOpen])

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      {/* 데스크탑 사이드바 */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* 모바일/태블릿 사이드바 오버레이 */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[rgba(43,39,48,0.45)] backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed top-0 left-0 bottom-0 z-50 lg:hidden">
            <Sidebar />
          </div>
        </>
      )}

      <main className="overflow-x-hidden">
        {/* 모바일/태블릿 헤더 — 햄버거 */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface border-b border-border flex items-center gap-2 px-4 py-2.5">
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="p-1.5 -ml-1 rounded-md hover:bg-surface-alt text-text-sub"
            aria-label="메뉴"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-point rounded-lg flex items-center justify-center text-white font-black text-[12px] shadow-point">
              EF
            </div>
            <span className="font-extrabold text-[14px]">EF 관리자</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
