import clsx from 'clsx'

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between', className)}>
      <div className="min-w-0 flex-1">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-[1.55rem] font-semibold leading-tight tracking-tight sm:text-[1.85rem] lg:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  )
}
