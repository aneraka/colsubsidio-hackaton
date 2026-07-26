import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

interface NextLink {
  to: string
  label: string
}

/**
 * Pantalla placeholder de la Fase 1: título del módulo + accesos para recorrer
 * el flujo completo. Se reemplaza por la pantalla real en las fases 4–8.
 */
export function Placeholder({
  modulo,
  titulo,
  next,
  extra,
}: {
  modulo: string
  titulo: string
  next?: NextLink[]
  extra?: React.ReactNode
}) {
  return (
    <div className="screen-enter mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center gap-8 px-8 py-12 text-center">
      <div className="flex flex-col items-center gap-3">
        <span className="rounded-full bg-[color:var(--color-brand-blue-soft)] px-4 py-1.5 text-sm font-bold tracking-wide text-[color:var(--color-brand-blue)] uppercase">
          {modulo}
        </span>
        <h1 className="text-4xl font-extrabold text-[color:var(--color-graphite)]">{titulo}</h1>
        <p className="text-[color:var(--color-graphite-60)]">Pantalla placeholder — se construye en su fase.</p>
      </div>

      {extra}

      {next && next.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-4">
          {next.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="inline-flex h-16 items-center gap-2 rounded-2xl bg-[color:var(--color-brand-yellow)] px-7 text-lg font-bold text-[color:var(--color-graphite)] shadow-[var(--shadow-card)] active:scale-[0.98]"
            >
              {n.label}
              <ArrowRight size={22} />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
