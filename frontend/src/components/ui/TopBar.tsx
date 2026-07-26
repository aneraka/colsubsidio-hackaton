import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BrandLogo } from './BrandLogo'
import { NavMenu } from '../layout/NavMenu'
import { AlertBell } from '../layout/AlertBell'

interface TopBarProps {
  title: string
  breadcrumb?: string
  onBack?: () => void
  /** texto del botón volver (por defecto solo el ícono circular) */
  backLabel?: string
  /** si no hay onBack, se muestra el logo a la izquierda */
  right?: ReactNode
  /** oculta el menú de navegación (por defecto se muestra) */
  hideNav?: boolean
}

/** Barra superior fina blanca: volver/logo · breadcrumb+título · slot derecho + menú. */
export function TopBar({ title, breadcrumb, onBack, backLabel, right, hideNav }: TopBarProps) {
  const navigate = useNavigate()
  return (
    <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-[#E7E8EC] bg-white px-5">
      <div className="flex min-w-0 items-center gap-4">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Volver"
            className="flex h-14 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[#E1E2E6] bg-white px-4 font-bold text-[color:var(--color-graphite)] no-select active:scale-95"
          >
            <ChevronLeft size={26} />
            {backLabel && <span className="pr-1">{backLabel}</span>}
          </button>
        ) : (
          <button onClick={() => navigate('/inicio')} aria-label="Inicio" className="shrink-0 no-select active:scale-95">
            <BrandLogo size="md" />
          </button>
        )}
        <div className="min-w-0">
          {breadcrumb && (
            <div className="truncate text-sm font-semibold text-[color:var(--color-graphite-60)]">
              {breadcrumb}
            </div>
          )}
          <div className="truncate text-xl font-bold text-[color:var(--color-graphite)]">{title}</div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-4">
        {right}
        <AlertBell />
        {!hideNav && <NavMenu variant="inline" />}
      </div>
    </div>
  )
}
