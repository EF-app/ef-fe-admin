import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AdminLayout from './components/layout/AdminLayout'
import LoginPage from './pages/Login'
import TestCenterPage from './pages/TestCenter'
import NotFoundPage from './pages/NotFound'
import DashboardPage from './pages/Dashboard'
import UsersPage from './pages/Users'
import ReportsPage from './pages/Reports'
import RefundsPage from './pages/Refunds'
import NoticesPage from './pages/Notices'
import BalanceGamesPage from './pages/BalanceGames'
import MatchingPage from './pages/Matching'
import AuditLogsPage from './pages/AuditLogs'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
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
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="refunds" element={<RefundsPage />} />
        <Route path="notices" element={<NoticesPage />} />
        <Route path="balance" element={<BalanceGamesPage />} />
        <Route path="matching" element={<MatchingPage />} />
        <Route path="audit" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
