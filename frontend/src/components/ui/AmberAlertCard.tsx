import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface AmberAlertCardProps {
  headline: string
  children?: ReactNode
  actions?: ReactNode
}

/** Tarjeta de advertencia NO punitiva: fondo ámbar claro, borde ámbar. Nunca roja. */
export function AmberAlertCard({ headline, children, actions }: AmberAlertCardProps) {
  return (
    <div
      className="w-full rounded-3xl border-2 p-8"
      style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)' }}
    >
      <div className="flex items-start gap-5">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: 'rgba(245,166,35,0.18)' }}
        >
          <AlertTriangle size={38} style={{ color: 'var(--color-warning)' }} strokeWidth={2.2} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">{headline}</h2>
          {children && <div className="mt-2 text-lg text-[color:var(--color-graphite)]">{children}</div>}
        </div>
      </div>
      {actions && <div className="mt-7">{actions}</div>}
    </div>
  )
}
