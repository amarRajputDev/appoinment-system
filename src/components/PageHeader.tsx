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
    <div className={clsx('flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-[1.85rem] font-semibold leading-tight tracking-tight sm:text-[2.1rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
