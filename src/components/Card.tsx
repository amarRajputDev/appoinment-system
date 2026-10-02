import clsx from 'clsx'

export default function Card({
  children,
  className,
  onClick,
  hover,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  hover?: boolean
}) {
  return (
    <div
      className={clsx(
        'panel',
        hover && 'panel-hover',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
