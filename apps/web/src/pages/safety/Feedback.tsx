import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useFeedbacks,
  formatFromNow,
  FEEDBACK_TYPE,
  FEEDBACK_TYPE_LABEL,
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_LABEL,
  FEEDBACK_CATEGORY_LABEL,
} from '@ef-fe-admin/shared'
import type {
  FeedbackType,
  FeedbackStatus,
} from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const TYPE_OPTIONS: { value: FeedbackType | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: FEEDBACK_TYPE.BUG, label: '버그' },
  { value: FEEDBACK_TYPE.FEATURE_REQUEST, label: '기능 요청' },
]

const STATUS_OPTIONS: { value: FeedbackStatus | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  ...Object.values(FEEDBACK_STATUS).map((v) => ({
    value: v,
    label: FEEDBACK_STATUS_LABEL[v],
  })),
]

export default function FeedbackPage() {
  const navigate = useNavigate()
  const [feedbackType, setFeedbackType] = useState<FeedbackType | undefined>(undefined)
  const [status, setStatus] = useState<FeedbackStatus | undefined>(undefined)
  const [page, setPage] = useState(0)

  const { data, isLoading } = useFeedbacks({
    feedback_type: feedbackType,
    status,
    page,
    size: 15,
  })

  return (
    <>
      <Topbar
        title="버그·기능"
        subtitle="유저가 보낸 버그 신고와 기능 요청 — 행 클릭 시 상세 페이지"
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <FilterChips
            value={feedbackType}
            onChange={(v) => {
              setFeedbackType(v)
              setPage(0)
            }}
            options={TYPE_OPTIONS}
          />
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
          <EmptyState title="피드백이 없습니다." />
        ) : (
          <table className="data-table min-w-[820px]">
            <thead>
              <tr>
                <th>유형</th>
                <th>제목</th>
                <th>카테고리</th>
                <th>작성자</th>
                <th>상태</th>
                <th>담당자</th>
                <th>접수</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((f) => (
                <tr
                  key={f.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/feedback/${f.id}`)}
                >
                  <td>
                    <FeedbackTypeBadge type={f.feedback_type} />
                  </td>
                  <td className="font-extrabold line-clamp-1 max-w-[320px]">{f.title}</td>
                  <td className="text-text-sub">{FEEDBACK_CATEGORY_LABEL[f.category_code]}</td>
                  <td className="text-text-sub">{f.reporter_nickname ?? '-'}</td>
                  <td>
                    <FeedbackStatusBadge status={f.status} />
                  </td>
                  <td className="text-text-sub">{f.admin_handler_name ?? '-'}</td>
                  <td className="text-text-sub">{formatFromNow(f.create_time)}</td>
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

function FeedbackTypeBadge({ type }: { type: FeedbackType }) {
  return <Badge tone={type === 'BUG' ? 'danger' : 'point'}>{FEEDBACK_TYPE_LABEL[type]}</Badge>
}

function FeedbackStatusBadge({ status }: { status: FeedbackStatus }) {
  const tone =
    status === 'RESOLVED' ? 'normal' :
    status === 'CLOSED' || status === 'DEFERRED' ? 'neutral' :
    status === 'IN_PROGRESS' ? 'point' :
    'warn'
  return <Badge tone={tone}>{FEEDBACK_STATUS_LABEL[status]}</Badge>
}
