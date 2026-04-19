import { useState } from 'react'
import { useAuditLogs, formatDateTime } from '@ef-fe-admin/shared'
import Topbar from '../components/layout/Topbar'
import EmptyState from '../components/ui/EmptyState'
import Pagination from '../components/ui/Pagination'

export default function AuditLogsPage() {
  const [page, setPage] = useState(0)
  const { data, isLoading } = useAuditLogs({ page, size: 20 })

  return (
    <>
      <Topbar title="감사 로그" subtitle="관리자 액션 이력 · 변경 스냅샷" />

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="감사 로그가 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>시각</th>
                <th>관리자</th>
                <th>액션</th>
                <th>대상</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((log) => (
                <tr key={log.id}>
                  <td className="text-text-sub whitespace-nowrap">
                    {formatDateTime(log.create_time)}
                  </td>
                  <td className="font-bold">{log.admin_name ?? `#${log.admin_id}`}</td>
                  <td>
                    <span className="badge badge-point">{log.action}</span>
                  </td>
                  <td className="text-text-sub">
                    {log.target_type} / {log.target_id}
                  </td>
                  <td className="text-text-soft text-[11.5px]">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}
