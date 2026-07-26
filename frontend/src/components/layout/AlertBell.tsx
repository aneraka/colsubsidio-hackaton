import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { useCountingStore } from '../../store/useCountingStore'
import { useAlertsStore } from '../../store/useAlertsStore'
import { recibeAlertas } from '../../lib/permisos'
import { getAlertas } from '../../lib/alertas'

/** Campanita de alertas con badge — solo visible para el auditor. */
export function AlertBell() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const capturas = useCountingStore((s) => s.capturas)
  const revisadas = useAlertsStore((s) => s.revisadas)

  const pendientes = useMemo(() => {
    const alertas = getAlertas(Object.values(capturas))
    return alertas.filter((a) => !revisadas.includes(a.id)).length
  }, [capturas, revisadas])

  if (!recibeAlertas(usuario)) return null

  return (
    <button
      onClick={() => navigate('/alertas')}
      aria-label="Alertas"
      className="relative flex h-14 w-14 items-center justify-center rounded-full border border-[#E1E2E6] bg-white text-[color:var(--color-graphite)] no-select active:scale-95"
    >
      <Bell size={24} />
      {pendientes > 0 && (
        <span
          className="absolute -top-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-extrabold text-white"
          style={{ background: 'var(--color-warning)' }}
        >
          {pendientes}
        </span>
      )}
    </button>
  )
}
