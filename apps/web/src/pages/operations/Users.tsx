import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import {
  useUsers,
  formatDateTime,
  USER_STATUS,
  PROFILE_STATUS,
  PROFILE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type { UserStatus, ProfileStatus } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { UserStatusBadge, Badge } from '../../components/ui/Badge'

/**
 * 목록 표시용 — 32자리 UUID 를 앞 8-4 그룹까지만 보여주고 나머지는 생략.
 * 예) "550e8400e29b41d4a716446655440000" → "550e8400-e29b…"
 * 32자리 hex 가 아니면(예: mock 의 u-101) 원본 그대로.
 */
function shortUuid(raw: string): string {
  const hex = raw.replace(/-/g, '')
  if (hex.length !== 32) return raw
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}…`
}

const STATUS_OPTIONS: { value: UserStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: USER_STATUS.ACTIVE, label: '정상' },
  { value: USER_STATUS.TEMPORARY, label: '일시정지' },
  { value: USER_STATUS.PERMANENT, label: '영구정지' },
  { value: USER_STATUS.WITHDRAWING, label: '탈퇴 신청' },
  { value: USER_STATUS.WITHDRAWN, label: '탈퇴 완료' },
]

const PROFILE_STATUS_OPTIONS: { value: ProfileStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: PROFILE_STATUS.PENDING, label: PROFILE_STATUS_LABEL.PENDING },
  { value: PROFILE_STATUS.APPROVED, label: PROFILE_STATUS_LABEL.APPROVED },
  { value: PROFILE_STATUS.REJECTED, label: PROFILE_STATUS_LABEL.REJECTED },
]

function ProfileStatusBadge({ status }: { status?: ProfileStatus }) {
  if (!status) return <span className="text-text-soft text-[11px]">-</span>
  const tone: 'warn' | 'normal' | 'danger' =
    status === 'PENDING' ? 'warn' : status === 'APPROVED' ? 'normal' : 'danger'
  return <Badge tone={tone}>{PROFILE_STATUS_LABEL[status]}</Badge>
}

export default function UsersPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState<UserStatus | undefined>(undefined)
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useUsers({
    keyword: keyword || undefined,
    status,
    page,
    size: 15,
  })

  // 클라이언트 측 profile_status 필터 (BE 가 status 만 지원하는 동안 임시).
  // 향후 BE 가 profileStatus 파라미터 받기 시작하면 useUsers 호출로 옮길 수 있음.
  const filteredContent = profileStatus
    ? data?.content.filter((u) => u.profile_status === profileStatus)
    : data?.content

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
          <FilterChips
            value={profileStatus}
            onChange={(v) => {
              setProfileStatus(v)
              setPage(0)
            }}
            options={PROFILE_STATUS_OPTIONS}
          />
        </div>
      </div>

      <div className="card p-0 overflow-x-auto">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !filteredContent?.length ? (
          <EmptyState title="유저가 없습니다." />
        ) : (
          <table className="data-table min-w-[880px]">
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
                <th>프로필 심사</th>
              </tr>
            </thead>
            <tbody>
              {filteredContent.map((u) => (
                <tr
                  key={u.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${u.id}`)}
                >
                  <td className="font-extrabold">{u.nickname}</td>
                  <td
                    className="text-text-sub font-mono text-[11px]"
                    title={u.uuid}
                  >
                    {shortUuid(u.uuid)}
                  </td>
                  <td className="text-text-sub">{u.login_id}</td>
                  <td className="text-text-sub">{u.age}세</td>
                  <td className="text-text-sub">{u.area ?? '-'}</td>
                  <td className="text-text-sub">{formatDateTime(u.create_time)}</td>
                  <td className="text-text-sub">{formatDateTime(u.last_login_time)}</td>
                  <td>
                    <UserStatusBadge status={u.status} />
                  </td>
                  <td>
                    <ProfileStatusBadge status={u.profile_status} />
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
