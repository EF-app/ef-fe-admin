interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      {icon && <div className="text-4xl mb-3 text-text-soft">{icon}</div>}
      <div className="text-[14px] font-extrabold text-text-sub">{title}</div>
      {description && (
        <div className="text-[12px] text-text-soft mt-1">{description}</div>
      )}
    </div>
  )
}
