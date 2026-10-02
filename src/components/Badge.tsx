import clsx from 'clsx'

const styles: Record<string, string> = {
  pending: 'bg-amber-500/12 text-amber-700 dark:text-amber-300 border-amber-600/25',
  confirmed: 'bg-teal-600/12 text-teal-700 dark:text-teal-300 border-teal-600/25',
  completed: 'bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 border-emerald-600/25',
  cancelled: 'bg-rose-600/12 text-rose-700 dark:text-rose-300 border-rose-600/25',
  no_show: 'bg-stone-500/12 text-stone-600 dark:text-stone-300 border-stone-500/25',
  active: 'bg-emerald-600/12 text-emerald-700 dark:text-emerald-300 border-emerald-600/25',
  inactive: 'bg-stone-500/12 text-stone-600 dark:text-stone-300 border-stone-500/25',
  admin: 'bg-orange-600/12 text-orange-700 dark:text-orange-300 border-orange-600/25',
  provider: 'bg-cyan-600/12 text-cyan-700 dark:text-cyan-300 border-cyan-600/25',
  client: 'bg-violet-600/12 text-violet-700 dark:text-violet-300 border-violet-600/25',
}

export default function Badge({
  children,
  status,
  className,
}: {
  children?: React.ReactNode
  status?: string
  className?: string
}) {
  return (
    <span
      className={clsx(
        'chip',
        styles[status || 'pending'] || styles.pending,
        className
      )}
    >
      {children || status?.replace('_', ' ')}
    </span>
  )
}
