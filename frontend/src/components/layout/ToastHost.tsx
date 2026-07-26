import { CheckCircle2, Info, AlertTriangle } from 'lucide-react'
import { useToast } from '../../store/useToast'

const tonos = {
  success: { bg: '#2E9E5B', icon: CheckCircle2 },
  info: { bg: '#0067B1', icon: Info },
  warning: { bg: '#F5A623', icon: AlertTriangle },
} as const

/** Contenedor de toasts efímeros (abajo-centro, sobre la StatusBar). */
export function ToastHost() {
  const toasts = useToast((s) => s.toasts)
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[500] flex flex-col items-center gap-2">
      {toasts.map((t) => {
        const { bg, icon: Icon } = tonos[t.tono]
        return (
          <div
            key={t.id}
            className="screen-enter flex items-center gap-3 rounded-2xl px-5 py-3 text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]"
            style={{ background: bg }}
          >
            <Icon size={22} />
            <span className="font-semibold">{t.mensaje}</span>
          </div>
        )
      })}
    </div>
  )
}
