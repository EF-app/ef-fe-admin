import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReports,
  formatFromNow,
  REPORT_STATUS,
  REPORT_TARGET_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import type { ReportStatus, ReportTargetType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { ReportStatusBadge, Badge } from '../../components/ui/Badge'

const STATUS_OPTIONS: { value: ReportStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: REPORT_STATUS.PENDING, label: '대기 중' },
  { value: REPORT_STATUS.PROCESSED, label: '처리됨' },
  { value: REPORT_STATUS.DISMISSED, label: '기각됨' },
]

const TARGET_OPTIONS: { value: ReportTargetType | undefined; label: string }[] = [
  { value: undefined, label: '전체 대상' },
  { value: 'POST_IT', label: '포스트잇' },
  { value: 'BAL_COMMENT', label: '게임 댓글' },
  { value: 'PROFILE', label: '프로필' },
  { value: 'CHAT', label: '채팅' },
]

export default function ReportsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ReportStatus | undefined>('PENDING')
  const [target, setTarget] = useState<ReportTargetType | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useReports({
    status,
    target_type: target,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar title="신고 내역" subtitle="신고 접수 건 — 행 클릭 시 상세 페이지" />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
            options={STATUS_OPTIONS}
          />
          <FilterChips
            value={target}
            onChange={(v) => {
              setTarget(v)
              setPage(0)
            }}
            options={TARGET_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="신고가 없습니다." />
        ) : (
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>대상</th>
                <th>신고 대상 유저</th>
                <th>본문 미리보기</th>
                <th>신고자</th>
                <th>사유</th>
                <th>상태</th>
                <th>접수</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/reports/${r.id}`)}
                >
                  <td>
                    <Badge tone="point">{REPORT_TARGET_TYPE_LABEL[r.target_type]}</Badge>
                  </td>
                  <td className="font-extrabold">{r.target_user_nickname ?? '-'}</td>
                  <td className="text-text-sub">
                    <div className="line-clamp-1 max-w-[260px]">
                      {r.target_preview ?? <span className="text-text-soft">-</span>}
                    </div>
                  </td>
                  <td className="text-text-sub">{r.reporter_nickname ?? '(탈퇴)'}</td>
                  <td className="text-text-sub">
                    <div className="line-clamp-1 max-w-[200px]">{r.reason ?? '-'}</div>
                  </td>
                  <td>
                    <ReportStatusBadge status={r.status} />
                  </td>
                  <td className="text-text-sub">{formatFromNow(r.create_time)}</td>
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
