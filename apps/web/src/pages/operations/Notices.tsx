import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, CornerDownRight } from 'lucide-react'
import {
  useAdminNotices,
  formatDateTime,
  formatNumber,
  NOTICE_BE_CATEGORY_LABEL,
  NOTICE_BE_STATUS_LABEL,
} from '@ef-fe-admin/shared'
import type {
  NoticeBeCategory,
  NoticeBeStatus,
  NoticeBeSummary,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import { Badge } from '../../components/ui/Badge'

const CATEGORY_OPTIONS: { value: NoticeBeCategory | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'NOTICE', label: '공지' },
  { value: 'AMEND', label: '정정' },
  { value: 'EVENT', label: '이벤트' },
  { value: 'UPDATE', label: '업데이트' },
]

const STATUS_FILTER_OPTIONS: { value: NoticeBeStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'DRAFT', label: '임시저장' },
  { value: 'SCHEDULED', label: '예약됨' },
  { value: 'PUBLISHED', label: '게시 중' },
  { value: 'ARCHIVED', label: '종료' },
]

interface TreeRow {
  notice: NoticeBeSummary
  depth: number
  /** 같은 페이지에 원본이 보이지 않는 고아 정정 공지 — 별도 표시 */
  orphanAmend?: boolean
}

/**
 * 정정 공지를 대댓글처럼 원본 아래로 트리 정렬한 행 목록을 만든다.
 * - 원본이 같은 페이지 안에 있으면 그 바로 아래에 들여쓰기로 노출
 * - 원본이 페이지 밖이면 별도 행으로 노출하되 (정정 #N) 표시 유지
 */
function buildTreeRows(notices: NoticeBeSummary[]): TreeRow[] {
  const byId = new Map<number, NoticeBeSummary>()
  notices.forEach((n) => byId.set(n.id, n))
  const childrenByParent = new Map<number, NoticeBeSummary[]>()
  notices.forEach((n) => {
    if (n.originalNoticeId != null && byId.has(n.originalNoticeId)) {
      const arr = childrenByParent.get(n.originalNoticeId) ?? []
      arr.push(n)
      childrenByParent.set(n.originalNoticeId, arr)
    }
  })

  const rows: TreeRow[] = []
  // 재귀 — 정정의 정정(N단계 depth) 까지 지원
  const pushChildren = (parentId: number, depth: number) => {
    const children = (childrenByParent.get(parentId) ?? []).sort((a, b) =>
      a.createTime.localeCompare(b.createTime)
    )
    children.forEach((c) => {
      rows.push({ notice: c, depth })
      pushChildren(c.id, depth + 1)
    })
  }

  notices.forEach((n) => {
    if (n.originalNoticeId != null && byId.has(n.originalNoticeId)) {
      // 부모와 같은 페이지에 있으면 자식 단계에서 렌더하므로 skip
      return
    }
    if (n.originalNoticeId != null) {
      // 부모가 페이지 밖 — orphan 정정
      rows.push({ notice: n, depth: 0, orphanAmend: true })
      // orphan 의 자식(정정의 정정)도 함께 노출
      pushChildren(n.id, 1)
    } else {
      rows.push({ notice: n, depth: 0 })
      pushChildren(n.id, 1)
    }
  })

  return rows
}

export default function NoticesPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<NoticeBeCategory | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<NoticeBeStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(0)

  const { data, isLoading } = useAdminNotices({ page, category })

  // BE 는 status 필터를 지원하지 않으므로 클라이언트에서 한 번 더 필터링
  const filtered = useMemo(
    () =>
      (data?.notices ?? []).filter((n) =>
        statusFilter === 'ALL' ? true : n.status === statusFilter
      ),
    [data?.notices, statusFilter]
  )

  const rows = useMemo(() => buildTreeRows(filtered), [filtered])

  const handleNew = () => navigate('/notices/new')
  const handleEdit = (id: number) => navigate(`/notices/${id}/edit`)

  return (
    <>
      <Topbar
        title="공지·푸시"
        subtitle="공지사항 게시판에 노출되는 공지 관리 — 정정 공지는 원본 아래에 트리로 노출됩니다."
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={category}
            onChange={(v) => {
              setCategory(v)
              setPage(0)
            }}
            options={CATEGORY_OPTIONS}
          />
          <div className="w-px h-5 bg-border" />
          <FilterChips
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            options={STATUS_FILTER_OPTIONS}
          />
          <div className="flex-1" />
          <button className="btn btn-primary btn-sm" onClick={handleNew}>
            <Plus size={13} /> 새 공지 등록
          </button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !rows.length ? (
          <EmptyState title="해당 조건의 공지가 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>카테고리</th>
                <th className="w-[44%]">제목</th>
                <th>상태</th>
                <th>작성자</th>
                <th>조회수</th>
                <th>게시 시각</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ notice: n, depth, orphanAmend }) => (
                <tr
                  key={n.id}
                  className={`cursor-pointer ${depth > 0 ? 'bg-surface-alt/50' : ''}`}
                  onClick={() => handleEdit(n.id)}
                >
                  <td>
                    <Badge tone="point">{NOTICE_BE_CATEGORY_LABEL[n.category]}</Badge>
                  </td>
                  <td>
                    <div
                      className="flex items-start gap-1.5"
                      style={{ paddingLeft: depth * 22 }}
                    >
                      {depth > 0 && (
                        <CornerDownRight
                          size={14}
                          className="text-warn flex-shrink-0 mt-0.5"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-extrabold truncate">{n.title}</div>
                        {(depth > 0 || orphanAmend) && n.originalNoticeId != null && (
                          <div className="text-[10.5px] text-warn font-bold mt-0.5">
                            {orphanAmend
                              ? `원본 공지 #${n.originalNoticeId} 의 정정`
                              : `정정 #${n.originalNoticeId}`}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={n.status} />
                  </td>
                  <td className="text-text-sub">{n.author}</td>
                  <td className="text-text-sub">{formatNumber(n.viewCount)}</td>
                  <td className="text-text-sub">
                    {n.publishedAt ? (
                      formatDateTime(n.publishedAt)
                    ) : n.status === 'SCHEDULED' && n.scheduledAt ? (
                      <span className="text-point-dark">
                        예약 · {formatDateTime(n.scheduledAt)}
                      </span>
                    ) : (
                      <span className="text-text-soft">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={data?.totalPages ?? 0}
        onChange={setPage}
      />
    </>
  )
}

function StatusBadge({ status }: { status: NoticeBeStatus }) {
  const tone =
    status === 'PUBLISHED' ? 'normal' :
    status === 'SCHEDULED' ? 'point' :
    status === 'ARCHIVED' ? 'neutral' :
    'warn'
  return <Badge tone={tone}>{NOTICE_BE_STATUS_LABEL[status]}</Badge>
}

