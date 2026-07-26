import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

interface ListRowProps {
  title: string
  subtitle?: string
  right?: ReactNode
  selected?: boolean
  onClick?: () => void
  showChevron?: boolean
}

/** Fila táctil de 88px: título (+subtítulo) · slot derecho · chevron. Selección = borde azul. */
export function ListRow({
  title,
  subtitle,
  right,
  selected = false,
  onClick,
  showChevron = true,
}: ListRowProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'flex h-[88px] w-full items-center justify-between rounded-2xl bg-white px-5 text-left no-select',
        'shadow-[var(--shadow-card)] transition-transform active:scale-[0.995]',
        selected ? 'border-l-4 border-[color:var(--color-brand-blue)]' : 'border-l-4 border-transparent',
      ].join(' ')}
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-bold text-[color:var(--color-graphite)]">{title}</div>
        {subtitle && (
          <div className="truncate text-sm text-[color:var(--color-graphite-60)]">{subtitle}</div>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-3">
        {right}
        {showChevron && <ChevronRight size={26} className="text-[color:var(--color-graphite-60)]" />}
      </div>
    </button>
  )
}
