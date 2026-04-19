interface ChipOption<T extends string | undefined> {
  value: T
  label: string
  count?: number
}

interface FilterChipsProps<T extends string | undefined> {
  value: T
  onChange: (value: T) => void
  options: ChipOption<T>[]
}

export default function FilterChips<T extends string | undefined>({
  value,
  onChange,
  options,
}: FilterChipsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt.value ?? 'ALL')}
          className={`chip ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          type="button"
        >
          {opt.label}
          {opt.count != null && <span className="ml-1">({opt.count})</span>}
        </button>
      ))}
    </div>
  )
}
