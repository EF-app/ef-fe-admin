import { Link, useLocation } from 'react-router-dom'

export default function NotFoundPage() {
  const location = useLocation()
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg p-6">
      <div className="text-[56px] mb-3">🫥</div>
      <div className="text-[18px] font-extrabold text-text mb-1">
        페이지를 찾을 수 없습니다
      </div>
      <div className="text-[12px] text-text-soft mb-6">
        요청하신 경로가 존재하지 않아요.
        <span className="block mt-1 font-mono text-[11px]">{location.pathname}</span>
      </div>
      <div className="flex gap-2">
        <Link to="/test" className="btn btn-secondary">
          Test Center
        </Link>
        <Link to="/dashboard" className="btn btn-primary">
          대시보드로
        </Link>
      </div>
    </div>
  )
}
