'use client'

export default function EmptyState({
  title = 'Nothing here yet',
  description,
  action,
}: {
  title?: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="panel flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[color:var(--line)] bg-[color:var(--accent-soft)]">
          <span className="font-display text-2xl font-semibold text-[color:var(--accent)]">◎</span>
        </div>
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[color:var(--teal)]" />
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
