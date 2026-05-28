import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/Login'
import TestCenterPage from './pages/TestCenter'
import NotFoundPage from './pages/NotFound'

// 운영
import DashboardPage from './pages/operations/Dashboard'
import UsersPage from './pages/operations/Users'
import UserDetailPage from './pages/operations/UserDetail'
import NoticesPage from './pages/operations/Notices'
import NoticeEditorPage from './pages/operations/NoticeEditor'
import PushesPage from './pages/operations/Pushes'
import PushEditorPage from './pages/operations/PushEditor'

// 안전/CS
import BlocksPage from './pages/safety/Blocks'
import ReportsPage from './pages/safety/Reports'
import ReportDetailPage from './pages/safety/ReportDetail'
import SuspensionLogsPage from './pages/safety/SuspensionLogs'
import SuspensionLogDetailPage from './pages/safety/SuspensionLogDetail'
import FeedbackPage from './pages/safety/Feedback'
import FeedbackDetailPage from './pages/safety/FeedbackDetail'

// 매칭
import MatchingPage from './pages/matching/Matching'
import MatchingRatesPage from './pages/matching/MatchingRates'

// 콘텐츠
import BalanceGamesPage from './pages/content/BalanceGames'
import BalanceGameEditorPage from './pages/content/BalanceGameEditor'
import BalanceGameDetailPage from './pages/content/BalanceGameDetail'
import BalanceGameVotesPage from './pages/content/BalanceGameVotes'
import BalGameCommentsPage from './pages/content/BalGameComments'
import PostItsPage from './pages/content/PostIts'
import BannedWordsPage from './pages/content/BannedWords'

// 결제
import RevenuePage from './pages/payment/Revenue'
import PaymentsPage from './pages/payment/Payments'
import RefundsPage from './pages/payment/Refunds'
import PremiumPage from './pages/payment/Premium'

// 시스템
import AdminsPage from './pages/system/Admins'
import AdminEditorPage from './pages/system/AdminEditor'
import AuditLogsPage from './pages/system/AuditLogs'
import AuditLogDetailPage from './pages/system/AuditLogDetail'
import PoliciesPage from './pages/system/Policies'
import PolicyEditorPage from './pages/system/PolicyEditor'
import PolicyDetailPage from './pages/system/PolicyDetail'
import FaqEditorPage from './pages/system/FaqEditor'
import SystemMessagesPage from './pages/system/SystemMessages'
import SystemMessageEditorPage from './pages/system/SystemMessageEditor'
import SystemMessageBroadcastPage from './pages/system/SystemMessageBroadcast'

const SKIP_AUTH = import.meta.env.DEV && import.meta.env.VITE_SKIP_AUTH === 'true'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (SKIP_AUTH) return <>{children}</>
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

/**
 * 라우트 변경 시 body 의 inline overflow 스타일 강제 초기화.
 * Modal/ConfirmDialog 의 cleanup 누락/race condition 으로 'hidden' 이 남아도
 * 페이지 이동 시 자동 복구.
 */
function BodyOverflowReset() {
  const location = useLocation()
  useEffect(() => {
    document.body.style.overflow = ''
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <>
    <BodyOverflowReset />
    <Routes>
      <Route path="/test" element={<TestCenterPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* 운영 */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="notices/new" element={<NoticeEditorPage />} />
        <Route path="notices/:id/edit" element={<NoticeEditorPage />} />
        <Route path="pushes" element={<PushesPage />} />
        <Route path="pushes/new" element={<PushEditorPage />} />
        <Route path="pushes/:id" element={<PushEditorPage />} />

        {/* 안전/CS */}
        <Route path="blocks" element={<BlocksPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="reports/:id" element={<ReportDetailPage />} />
        <Route path="suspensions" element={<SuspensionLogsPage />} />
        <Route path="suspensions/:id" element={<SuspensionLogDetailPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
        <Route path="feedback/:id" element={<FeedbackDetailPage />} />

        {/* 매칭 */}
        <Route path="matching" element={<MatchingPage />} />
        <Route path="matching/rates" element={<MatchingRatesPage />} />

        {/* 콘텐츠 */}
        <Route path="balance" element={<BalanceGamesPage />} />
        <Route path="balance/new" element={<BalanceGameEditorPage />} />
        <Route path="balance/:id" element={<BalanceGameDetailPage />} />
        <Route path="balance/:id/edit" element={<BalanceGameEditorPage />} />
        <Route path="balance/:id/votes" element={<BalanceGameVotesPage />} />
        <Route path="balance/:id/comments" element={<BalGameCommentsPage />} />
        <Route path="post-its" element={<PostItsPage />} />
        <Route path="banned-words" element={<BannedWordsPage />} />

        {/* 결제 */}
        <Route path="revenue" element={<RevenuePage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="premium" element={<PremiumPage />} />

        {/* 시스템 — BE /v1/admin/account 와 경로 통일 */}
        <Route path="admin/account" element={<AdminsPage />} />
        <Route path="admin/account/new" element={<AdminEditorPage />} />
        <Route path="admin/account/:id" element={<AdminEditorPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
        <Route path="audit/:id" element={<AuditLogDetailPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="policies/new" element={<PolicyEditorPage />} />
        <Route path="policies/:uuid" element={<PolicyDetailPage />} />
        <Route path="faqs/new" element={<FaqEditorPage />} />
        <Route path="faqs/:id" element={<FaqEditorPage />} />
        <Route path="system-messages" element={<SystemMessagesPage />} />
        <Route path="system-messages/broadcast" element={<SystemMessageBroadcastPage />} />
        <Route path="system-messages/:uuid" element={<SystemMessageEditorPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}
