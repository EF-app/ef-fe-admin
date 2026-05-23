import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import { useAdmins, formatDateTime } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const STATE_OPTIONS: { value: 'ALL' | 'ACTIVE' | 'INACTIVE'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
]

export default function AdminsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [state, setState] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAdmins({
    keyword: keyword || undefined,
    is_active: state === 'ALL' ? undefined : state === 'ACTIVE',
    page,
    size: 15,
  })

  return (
    <>
      <Topbar title="관리자 계정" />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-full sm:w-[260px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="이름 / 로그인 ID"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={state}
            onChange={(v) => {
              setState(v)
              setPage(0)
            }}
            options={STATE_OPTIONS}
          />
          <div className="flex-1" />
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/admin/account/new')}
          >
            <Plus size={13} /> 관리자 추가
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="관리자가 없습니다." />
        ) : (
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>이름</th>
                <th>로그인 ID</th>
                <th>상태</th>
                <th>최근 로그인</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admin/account/${a.id}`)}
                >
                  <td className="font-extrabold">{a.name}</td>
                  <td className="text-text-sub font-mono text-[12px]">{a.login_id}</td>
                  <td>
                    {a.is_active ? (
                      <Badge tone="normal">활성</Badge>
                    ) : (
                      <Badge tone="neutral">비활성</Badge>
                    )}
                  </td>
                  <td className="text-text-sub text-[11.5px]">
                    {formatDateTime(a.last_login_at)}
                    {a.last_login_ip && (
                      <div className="text-text-soft text-[10.5px]">{a.last_login_ip}</div>
                    )}
                  </td>
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
