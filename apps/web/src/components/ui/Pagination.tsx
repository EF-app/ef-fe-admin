import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  /** 양쪽에 표시할 숫자 페이지 수 (기본 1) */
  siblingCount?: number
}

/**
 * 숫자 기반 페이지네이션.
 *   « 1 2 … 5 6 7 … 12 »
 *
 *  - page 는 0-based (zero-indexed)
 *  - 표시는 1-based
 *  - totalPages 가 1 이하면 아무것도 렌더하지 않음
 *  - 항상 첫/마지막 페이지를 보이게 하고, 현재 페이지 양쪽에 siblingCount 개 노출
 */
export default function Pagination({
  page,
  totalPages,
  onChange,
  siblingCount = 1,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const canPrev = page > 0
  const canNext = page < totalPages - 1

  const pages = buildRange({ current: page + 1, total: totalPages, siblingCount })

  return (
    <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
      <button
        className="btn btn-secondary btn-sm disabled:opacity-40"
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
        aria-label="이전"
      >
        <ChevronLeft size={14} />
      </button>

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span
            key={`e-${idx}`}
            className="px-2 text-text-soft text-[12px] font-bold select-none"
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p - 1)}
            aria-current={p === page + 1 ? 'page' : undefined}
            className={`min-w-[30px] h-[28px] rounded-md text-[12px] font-extrabold transition px-2 ${
              p === page + 1
                ? 'bg-point text-white shadow-point'
                : 'bg-surface border border-border-strong text-text-sub hover:bg-surface-alt hover:border-point hover:text-point-dark'
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        className="btn btn-secondary btn-sm disabled:opacity-40"
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
        aria-label="다음"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}

type RangeItem = number | 'ellipsis'

function buildRange({
  current,
  total,
  siblingCount,
}: {
  current: number
  total: number
  siblingCount: number
}): RangeItem[] {
  // 보일 수 있는 숫자 페이지 수: first + last + current + 2*siblings + 2*ellipsis 슬롯
  const totalSlots = 5 + siblingCount * 2
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const leftSibling = Math.max(current - siblingCount, 1)
  const rightSibling = Math.min(current + siblingCount, total)
  const showLeftEllipsis = leftSibling > 2
  const showRightEllipsis = rightSibling < total - 1

  const firstPage = 1
  const lastPage = total

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => i + 1
    )
    return [...leftRange, 'ellipsis', lastPage]
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRange = Array.from(
      { length: 3 + siblingCount * 2 },
      (_, i) => total - (3 + siblingCount * 2) + 1 + i
    )
    return [firstPage, 'ellipsis', ...rightRange]
  }

  // 양쪽 ellipsis
  const middle = Array.from(
    { length: rightSibling - leftSibling + 1 },
    (_, i) => leftSibling + i
  )
  return [firstPage, 'ellipsis', ...middle, 'ellipsis', lastPage]
}
