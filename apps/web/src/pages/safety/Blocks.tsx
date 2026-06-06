import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import { useBlocks, formatDateTime } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'
import { parseInt0, useUrlFilters } from '../../hooks/useUrlFilters'
import { useScrollRestoration } from '../../hooks/useScrollRestoration'

export default function BlocksPage() {
  useScrollRestoration()
  const navigate = useNavigate()
  const [filters, setFilters] = useUrlFilters<{ keyword: string; page: number }>({
    keyword: { default: '' },
    page: { default: 0, parse: parseInt0 },
  })
  const { keyword, page } = filters
  const setKeyword = (v: string) => setFilters({ keyword: v, page: 0 })
  const setPage = (p: number) => setFilters({ page: p })
  const { data, isLoading } = useBlocks({
    keyword: keyword || undefined,
    page,
    size: 20,
  })

  return (
    <>
      <Topbar
        title="차단 내역"
        subtitle="유저 간 차단 관계 · 역방향 차단도 존재하면 '상호 차단'으로 표시됩니다."
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-[320px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="차단자/피차단자 닉네임 / UUID"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <div className="flex-1" />
          <div className="text-[11.5px] text-text-soft">
            전체 {data?.totalElements ?? 0}건
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="차단 내역이 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>차단한 유저</th>
                <th></th>
                <th>차단당한 유저</th>
                <th>차단 시각</th>
                <th>관계</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((b) => {
                const isMutual = b.mutual
                return (
                  <tr key={b.id}>
                    <td>
                      <button
                        className="font-extrabold hover:text-point-dark hover:underline text-left"
                        onClick={() => navigate(`/users/${b.blockerUuid}`)}
                      >
                        {b.blockerNickname}
                        <span className="text-text-soft font-normal ml-1 text-[11px]">
                          #{b.blockerId}
                        </span>
                      </button>
                    </td>
                    <td className="text-text-soft">
                      <ArrowRight size={14} />
                    </td>
                    <td>
                      <button
                        className="font-extrabold hover:text-point-dark hover:underline text-left"
                        onClick={() => navigate(`/users/${b.blockedUuid}`)}
                      >
                        {b.blockedNickname}
                        <span className="text-text-soft font-normal ml-1 text-[11px]">
                          #{b.blockedId}
                        </span>
                      </button>
                    </td>
                    <td className="text-text-sub whitespace-nowrap">
                      {formatDateTime(b.createTime)}
                    </td>
                    <td>
                      {isMutual ? (
                        <Badge tone="warn">상호 차단</Badge>
                      ) : (
                        <Badge tone="neutral">단방향</Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}
