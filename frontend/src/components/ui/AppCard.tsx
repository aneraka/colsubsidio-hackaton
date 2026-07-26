import type { HTMLAttributes, ReactNode } from 'react'

interface AppCardProps extends HTMLAttributes<HTMLDivElement> {
  radius?: number
  padding?: string
  children: ReactNode
}

/** Tarjeta blanca flat: radio configurable (20–24px), sombra suave, padding generoso. */
export function AppCard({
  radius = 22,
  padding = 'p-7',
  children,
  className = '',
  style,
  ...rest
}: AppCardProps) {
  return (
    <div
      className={['bg-white shadow-[var(--shadow-card)]', padding, className].join(' ')}
      style={{ borderRadius: radius, ...style }}
      {...rest}
    >
      {children}
    </div>
  )
}
