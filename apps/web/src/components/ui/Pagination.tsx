import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  const canPrev = page > 0
  const canNext = page < totalPages - 1
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        className="btn btn-secondary btn-sm disabled:opacity-40"
        onClick={() => canPrev && onChange(page - 1)}
        disabled={!canPrev}
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-[12px] text-text-sub px-2">
        {page + 1} / {totalPages}
      </span>
      <button
        className="btn btn-secondary btn-sm disabled:opacity-40"
        onClick={() => canNext && onChange(page + 1)}
        disabled={!canNext}
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
