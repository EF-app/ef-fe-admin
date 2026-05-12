import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ArrowRight } from 'lucide-react'
import {
  useBlocks,
  formatDateTime,
  BLOCK_REASON_LABEL,
  BLOCK_REASON_CATEGORY,
} from '@ef-fe-admin/shared'
import type { BlockReasonCategory } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import EmptyState from '../../components/ui/EmptyState'
import Pagination from '../../components/ui/Pagination'
import FilterChips from '../../components/ui/FilterChips'
import { Badge } from '../../components/ui/Badge'

const REASON_OPTIONS: { value: BlockReasonCategory | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: BLOCK_REASON_CATEGORY.PROFANITY_HATE, label: '욕설·혐오' },
  { value: BLOCK_REASON_CATEGORY.SEXUAL_CONTENT, label: '음란·성적' },
  { value: BLOCK_REASON_CATEGORY.SPAM_PROMOTION, label: '스팸·홍보' },
  { value: BLOCK_REASON_CATEGORY.THREAT, label: '협박·위협' },
  { value: BLOCK_REASON_CATEGORY.FAKE_IDENTITY, label: '사칭·허위' },
  { value: BLOCK_REASON_CATEGORY.OTHER, label: '기타' },
]

export default function BlocksPage() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [reasonCategory, setReasonCategory] = useState<BlockReasonCategory | undefined>(
    undefined
  )
  const [page, setPage] = useState(0)
  const { data, isLoading } = useBlocks({
    keyword: keyword || undefined,
    reasonCategory,
    page,
    size: 20,
  })

  // 페이지 내 양방향 쌍 감지 — (a→b)와 (b→a) 가 둘 다 있으면 상호 차단으로 표시
  const mutualPairKeys = useMemo(() => {
    const set = new Set<string>()
    const all = new Set<string>()
    ;(data?.content ?? []).forEach((b) => {
      all.add(`${b.blockerId}-${b.blockedId}`)
    })
    ;(data?.content ?? []).forEach((b) => {
      if (all.has(`${b.blockedId}-${b.blockerId}`)) {
        set.add(`${b.blockerId}-${b.blockedId}`)
      }
    })
    return set
  }, [data?.content])

  return (
    <>
      <Topbar
        title="차단 내역"
        subtitle="유저 간 차단 관계 · 같은 페이지에서 양방향 쌍이 보이면 상호 차단으로 표시됩니다."
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
          <FilterChips
            value={reasonCategory}
            onChange={(v) => {
              setReasonCategory(v)
              setPage(0)
            }}
            options={REASON_OPTIONS}
          />
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
                <th>사유 카테고리</th>
                <th>상세 사유</th>
                <th>차단 시각</th>
                <th>관계</th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((b) => {
                const isMutual = mutualPairKeys.has(`${b.blockerId}-${b.blockedId}`)
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
                    <td>
                      <ReasonBadge category={b.reasonCategory} />
                    </td>
                    <td className="text-text-sub max-w-[280px]">
                      <div className="line-clamp-2 text-[12.5px]">
                        {b.detail ?? <span className="text-text-soft">-</span>}
                      </div>
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

function ReasonBadge({ category }: { category: BlockReasonCategory }) {
  const tone: 'danger' | 'warn' | 'point' | 'neutral' =
    category === 'PROFANITY_HATE' || category === 'THREAT'
      ? 'danger'
      : category === 'SEXUAL_CONTENT' || category === 'FAKE_IDENTITY'
        ? 'warn'
        : category === 'SPAM_PROMOTION'
          ? 'point'
          : 'neutral'
  return <Badge tone={tone}>{BLOCK_REASON_LABEL[category]}</Badge>
}
