import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  useUsers,
  formatDateTime,
  USER_STATUS,
} from '@ef-fe-admin/shared'
import type { UserStatus } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { UserStatusBadge } from '../../components/ui/Badge'

const STATUS_OPTIONS: { value: UserStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: USER_STATUS.ACTIVE, label: '정상' },
  { value: USER_STATUS.WARNING, label: '경고' },
  { value: USER_STATUS.TEMP_SUSPENDED, label: '일시정지' },
  { value: USER_STATUS.PERMANENTLY_SUSPENDED, label: '영구정지' },
]

export default function UsersPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<UserStatus | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useUsers({
    keyword: keyword || undefined,
    status,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar title="유저 관리" subtitle="가입자 조회·제재 관리" />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-full sm:w-[360px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="닉네임 / 로그인ID / UUID"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={status}
            onChange={(v) => {
              setStatus(v)
              setPage(0)
            }}
            options={STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="유저가 없습니다." />
        ) : (
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>닉네임</th>
                <th>UUID</th>
                <th>로그인 아이디</th>
                <th>나이</th>
                <th>지역</th>
                <th>가입</th>
                <th>최근 접속</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${u.uuid}`)}
                >
                  <td className="font-extrabold">
                    {u.nickname}
                    <span className="text-text-soft font-normal ml-1 text-[11px]">
                      #{u.scode}
                    </span>
                  </td>
                  <td className="text-text-sub font-mono text-[11px]">{u.uuid}</td>
                  <td className="text-text-sub">{u.login_id}</td>
                  <td className="text-text-sub">{u.age}세</td>
                  <td className="text-text-sub">
                    {u.area_id != null ? `지역 ${u.area_id}` : '-'}
                  </td>
                  <td className="text-text-sub">{formatDateTime(u.create_time)}</td>
                  <td className="text-text-sub">{formatDateTime(u.last_login_time)}</td>
                  <td>
                    <UserStatusBadge status={u.status} />
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
