import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import {
  useAdmins,
  formatDateTime,
  ADMIN_ROLE,
  ADMIN_ROLE_LABEL,
} from '@ef-fe-admin/shared'
import type { AdminRole } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const ROLE_OPTIONS: { value: AdminRole | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...Object.values(ADMIN_ROLE).map((v) => ({
    value: v,
    label: ADMIN_ROLE_LABEL[v],
  })),
]

const STATE_OPTIONS: { value: 'ALL' | 'ACTIVE' | 'INACTIVE'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
]

export default function AdminsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [role, setRole] = useState<AdminRole | undefined>(undefined)
  const [state, setState] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAdmins({
    keyword: keyword || undefined,
    role,
    is_active: state === 'ALL' ? undefined : state === 'ACTIVE',
    page,
    size: 15,
  })

  return (
    <>
      <Topbar
        title="관리자 계정"
        subtitle="관리자 생성·역할 부여·비활성화 — 행 클릭 시 편집 페이지"
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-full sm:w-[260px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="이름 / 로그인 ID / 이메일"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={role}
            onChange={(v) => {
              setRole(v)
              setPage(0)
            }}
            options={ROLE_OPTIONS}
          />
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
            onClick={() => navigate('/admins/new')}
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
          <table className="data-table min-w-[760px]">
            <thead>
              <tr>
                <th>이름</th>
                <th>로그인 ID</th>
                <th>이메일</th>
                <th>역할</th>
                <th>상태</th>
                <th>최근 로그인</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((a) => (
                <tr
                  key={a.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/admins/${a.id}`)}
                >
                  <td className="font-extrabold">{a.name}</td>
                  <td className="text-text-sub font-mono text-[12px]">{a.login_id}</td>
                  <td className="text-text-sub">{a.email}</td>
                  <td>
                    <RoleBadge role={a.role} />
                  </td>
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

function RoleBadge({ role }: { role: AdminRole }) {
  const tone =
    role === 'SUPER_ADMIN' ? 'danger' :
    role === 'ADMIN' ? 'point' :
    role === 'MODERATOR' ? 'warn' :
    'neutral'
  return <Badge tone={tone}>{ADMIN_ROLE_LABEL[role]}</Badge>
}
