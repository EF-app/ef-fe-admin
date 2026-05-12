import { useState } from 'react'
import { Search, Plus, Trash2 } from 'lucide-react'
import {
  useBannedWords,
  useCreateBannedWordMutation,
  useToggleBannedWordMutation,
  useDeleteBannedWordMutation,
  formatDateTime,
  BANNED_WORD_SEVERITY_LABEL,
} from '@ef-fe-admin/shared'
import type { BannedWord, BannedWordSeverity } from '@ef-fe-admin/shared'
import Topbar from '../../components/layout/Topbar'
import FilterChips from '../../components/ui/FilterChips'
import Pagination from '../../components/ui/Pagination'
import EmptyState from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'

const SEVERITY_OPTIONS: { value: BannedWordSeverity | undefined; label: string }[] = [
  { value: undefined, label: '전체' },
  { value: 'BLOCK', label: '차단' },
  { value: 'WARN', label: '경고' },
  { value: 'MASK', label: '마스킹' },
]

const STATE_OPTIONS: { value: 'ALL' | 'ACTIVE' | 'INACTIVE'; label: string }[] = [
  { value: 'ALL', label: '전체 상태' },
  { value: 'ACTIVE', label: '활성' },
  { value: 'INACTIVE', label: '비활성' },
]

export default function BannedWordsPage() {
  const [keyword, setKeyword] = useState('')
  const [severity, setSeverity] = useState<BannedWordSeverity | undefined>(undefined)
  const [state, setState] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [page, setPage] = useState(0)
  const [composeOpen, setComposeOpen] = useState(false)

  const { data, isLoading } = useBannedWords({
    keyword: keyword || undefined,
    severity,
    is_active: state === 'ALL' ? undefined : state === 'ACTIVE',
    page,
    size: 20,
  })

  return (
    <>
      <Topbar
        title="금칙어 관리"
        subtitle="채팅·포스트잇·프로필에서 차단/경고/마스킹할 단어를 관리합니다."
      />

      <div className="card mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-surface-alt rounded-md px-3 py-2 border border-border-strong w-[280px]">
            <Search size={14} className="text-text-soft" />
            <input
              placeholder="단어 / 카테고리 검색"
              className="bg-transparent outline-none flex-1 text-[13px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setPage(0)
              }}
            />
          </div>
          <FilterChips
            value={severity}
            onChange={(v) => {
              setSeverity(v)
              setPage(0)
            }}
            options={SEVERITY_OPTIONS}
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
            onClick={() => setComposeOpen(true)}
          >
            <Plus size={13} /> 단어 추가
          </button>
        </div>
      </div>

      {composeOpen && <NewWordComposer onClose={() => setComposeOpen(false)} />}

      <div className="card p-0">
        {isLoading ? (
          <div className="p-10 text-center text-text-soft text-[12px]">불러오는 중...</div>
        ) : !data?.content?.length ? (
          <EmptyState title="등록된 금칙어가 없습니다." />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>단어</th>
                <th>카테고리</th>
                <th>강도</th>
                <th>적발 횟수</th>
                <th>등록자</th>
                <th>업데이트</th>
                <th>활성</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.content.map((w) => (
                <WordRow key={w.id} word={w} />
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={data?.totalPages ?? 0} onChange={setPage} />
    </>
  )
}

function WordRow({ word }: { word: BannedWord }) {
  const toggle = useToggleBannedWordMutation()
  const remove = useDeleteBannedWordMutation()
  return (
    <tr>
      <td className="font-extrabold">{word.word}</td>
      <td className="text-text-sub">{word.category}</td>
      <td>
        <SeverityBadge severity={word.severity} />
      </td>
      <td className="text-text-sub">{word.hit_count.toLocaleString()}회</td>
      <td className="text-text-sub">{word.created_by_admin_name ?? '-'}</td>
      <td className="text-text-soft text-[11.5px]">{formatDateTime(word.update_time)}</td>
      <td>
        <label className="inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={word.is_active}
            onChange={(e) => toggle.mutate({ id: word.id, is_active: e.target.checked })}
            className="accent-[var(--color-point)] w-4 h-4"
          />
        </label>
      </td>
      <td>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => {
            if (confirm(`"${word.word}" 을(를) 삭제할까요?`)) remove.mutate(word.id)
          }}
        >
          <Trash2 size={12} />
        </button>
      </td>
    </tr>
  )
}

function SeverityBadge({ severity }: { severity: BannedWordSeverity }) {
  const tone =
    severity === 'BLOCK' ? 'danger' : severity === 'WARN' ? 'warn' : 'point'
  return <Badge tone={tone}>{BANNED_WORD_SEVERITY_LABEL[severity]}</Badge>
}

function NewWordComposer({ onClose }: { onClose: () => void }) {
  const [word, setWord] = useState('')
  const [category, setCategory] = useState('욕설')
  const [severity, setSeverity] = useState<BannedWordSeverity>('BLOCK')
  const [error, setError] = useState<string | null>(null)
  const mutation = useCreateBannedWordMutation({
    onSuccess: onClose,
    onError: (e) => setError(e.message),
  })

  const handleSubmit = () => {
    setError(null)
    if (!word.trim()) return setError('단어를 입력해주세요.')
    if (!category.trim()) return setError('카테고리를 입력해주세요.')
    mutation.mutate({ word: word.trim(), category: category.trim(), severity, is_active: true })
  }

  return (
    <div className="card mb-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-extrabold text-[14px]">📝 금칙어 추가</div>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          닫기
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="form-label">단어</label>
          <input
            className="form-input"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="예) 카톡"
          />
        </div>
        <div>
          <label className="form-label">카테고리</label>
          <input
            className="form-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="욕설, 외부 유도, 금융 사기..."
          />
        </div>
        <div>
          <label className="form-label">강도</label>
          <div className="flex flex-wrap gap-2">
            {(['BLOCK', 'WARN', 'MASK'] as BannedWordSeverity[]).map((s) => (
              <button
                key={s}
                type="button"
                className={`chip ${severity === s ? 'active' : ''}`}
                onClick={() => setSeverity(s)}
              >
                {BANNED_WORD_SEVERITY_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && <div className="text-[12px] text-danger font-bold">{error}</div>}
      <div className="flex justify-end gap-2">
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          취소
        </button>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? '저장 중...' : '추가'}
        </button>
      </div>
    </div>
  )
}
