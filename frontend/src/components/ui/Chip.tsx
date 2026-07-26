import type { ReactNode } from 'react'

type ChipVariant = 'date' | 'unit' | 'success' | 'warning' | 'neutral' | 'info'

const styles: Record<ChipVariant, string> = {
  date: 'bg-[color:var(--color-brand-yellow)] text-[color:var(--color-graphite)]',
  unit: 'bg-[color:var(--color-brand-blue-soft)] text-[color:var(--color-brand-blue)] border-2 border-[color:var(--color-brand-blue)]',
  success: 'bg-[#E4F5EC] text-[color:var(--color-success)]',
  warning: 'bg-[color:var(--color-warning-bg)] text-[#B4740F] border border-[color:var(--color-warning)]',
  neutral: 'bg-[#ECEDF0] text-[color:var(--color-graphite-60)]',
  info: 'bg-[color:var(--color-brand-blue-soft)] text-[color:var(--color-brand-blue)]',
}

interface ChipProps {
  variant?: ChipVariant
  children: ReactNode
  className?: string
}

/** Pill redondeada del design system. */
export function Chip({ variant = 'neutral', children, className = '' }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold no-select',
        styles[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
