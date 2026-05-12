import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  useSuspensionLogs,
  formatDateTime,
  SUSPENSION_TYPE,
  SUSPENSION_TYPE_LABEL,
} from '@ef-fe-admin/shared'
import type { SuspensionType } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const TYPE_OPTIONS: { value: SuspensionType | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: SUSPENSION_TYPE.WARNING, label: '경고' },
  { value: SUSPENSION_TYPE.TEMPORARY, label: '일시정지' },
  { value: SUSPENSION_TYPE.PERMANENT, label: '영구정지' },
]

const STATE_OPTIONS: { value: 'ALL' | 'ACTIVE' | 'LIFTED'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'ACTIVE', label: '진행 중' },
  { value: 'LIFTED', label: '해제됨' },
]

export default function SuspensionLogsPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [type, setType] = useState<SuspensionType | undefined>(undefined)
  const [state, setState] = useState<'ALL' | 'ACTIVE' | 'LIFTED'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useSuspensionLogs({
    user_keyword: keyword || undefined,
    suspension_type: type,
    is_lifted: state === 'ALL' ? undefined : state === 'LIFTED',
    page,
    size: 15,
  })

  return (
    <>
      <Topbar title="제재 로그" subtitle="유저 제재 이력 — 행 클릭 시 상세 페이지" />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-full sm:w-[280px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="유저 닉네임 / UUID"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={type}
            onChange={(v) => {
              setType(v)
              setPage(0)
            }}
            options={TYPE_OPTIONS}
          />
          <FilterChips
            value={state}
            onChange={(v) => {
              setState(v)
              setPage(0)
            }}
            options={STATE_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="제재 이력이 없습니다." />
        ) : (
          <table className="data-table min-w-[800px]">
            <thead>
              <tr>
                <th>대상 유저</th>
                <th>유형</th>
                <th>사유</th>
                <th>시작</th>
                <th>종료</th>
                <th>상태</th>
                <th>제재한 관리자</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((s) => (
                <tr
                  key={s.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/suspensions/${s.id}`)}
                >
                  <td className="font-extrabold">{s.user_nickname ?? '-'}</td>
                  <td>
                    <SuspensionTypeBadge type={s.suspension_type} />
                  </td>
                  <td className="text-text-sub">
                    <div className="line-clamp-1 max-w-[280px]">{s.reason}</div>
                  </td>
                  <td className="text-text-sub">{formatDateTime(s.starts_at)}</td>
                  <td className="text-text-sub">
                    {s.ends_at ? formatDateTime(s.ends_at) : '영구'}
                  </td>
                  <td>
                    {s.is_lifted ? (
                      <Badge tone="normal">해제됨</Badge>
                    ) : (
                      <Badge tone="warn">진행 중</Badge>
                    )}
                  </td>
                  <td className="text-text-sub">{s.created_by_admin_name ?? '-'}</td>
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

function SuspensionTypeBadge({ type }: { type: SuspensionType }) {
  const tone = type === 'WARNING' ? 'warn' : type === 'TEMPORARY' ? 'point' : 'danger'
  return <Badge tone={tone}>{SUSPENSION_TYPE_LABEL[type]}</Badge>
}
