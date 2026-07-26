import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Check, CheckCircle2 } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { useCountingStore } from '../../store/useCountingStore'
import { useAlertsStore } from '../../store/useAlertsStore'
import { recibeAlertas } from '../../lib/permisos'
import { getAlertas, textoAlerta } from '../../lib/alertas'
import { getBodegaById } from '../../data/mock/bodegas'
import { getZonaById } from '../../data/mock/zonas'
import { getUsuarioNombre } from '../../data/mock/usuarios'
import { AppCard, BigButton, TopBar } from '../../components/ui'
import type { Alerta } from '../../types/domain'

export function AlertasScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const capturasMap = useCountingStore((s) => s.capturas)
  const revisadas = useAlertsStore((s) => s.revisadas)
  const marcarRevisada = useAlertsStore((s) => s.marcarRevisada)

  const alertas = useMemo(() => getAlertas(Object.values(capturasMap)), [capturasMap])

  if (!recibeAlertas(usuario)) {
    navigate('/inicio')
    return null
  }

  const pendientes = alertas.filter((a) => !revisadas.includes(a.id))
  const yaRevisadas = alertas.filter((a) => revisadas.includes(a.id))

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Alertas del conteo" onBack={() => navigate('/inicio')} backLabel="Inicio" />

      <div className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto p-6">
        {alertas.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <CheckCircle2 size={64} style={{ color: 'var(--color-success)' }} />
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Sin alertas</h2>
            <p className="text-[color:var(--color-graphite-60)]">El conteo va limpio ✓</p>
          </div>
        )}

        {pendientes.length > 0 && (
          <div className="flex flex-col gap-3">
            {pendientes.map((a) => (
              <AlertaRow key={a.id} a={a} onVer={() => navigate('/registros')} onRevisar={() => marcarRevisada(a.id)} />
            ))}
          </div>
        )}

        {yaRevisadas.length > 0 && (
          <>
            <h3 className="mt-8 mb-3 text-sm font-extrabold tracking-wider text-[color:var(--color-graphite-60)] uppercase">
              Revisadas ({yaRevisadas.length})
            </h3>
            <div className="flex flex-col gap-3 opacity-60">
              {yaRevisadas.map((a) => (
                <AlertaRow key={a.id} a={a} revisada />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function AlertaRow({ a, revisada, onVer, onRevisar }: { a: Alerta; revisada?: boolean; onVer?: () => void; onRevisar?: () => void }) {
  const bodega = getBodegaById(a.bodegaId)?.nombreCorto ?? a.bodegaId
  const zona = getZonaById(a.zonaId)?.nombre ?? ''
  const hora = new Date(a.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  return (
    <AppCard radius={18} padding="p-5" style={{ background: 'var(--color-warning-bg)', border: '2px solid var(--color-warning)' }}>
      <div className="flex items-start gap-4">
        <AlertTriangle size={28} style={{ color: 'var(--color-warning)' }} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="font-bold text-[color:var(--color-graphite)]">{textoAlerta(a)}</div>
          <div className="mt-1 text-sm text-[color:var(--color-graphite-60)]">
            {bodega} › {zona} · {getUsuarioNombre(a.operarioId)} · {hora}
          </div>
        </div>
      </div>
      {!revisada && (
        <div className="mt-4 flex gap-3">
          <BigButton variant="secondary" size="md" onClick={onVer}>
            Ver captura
          </BigButton>
          <BigButton variant="blue" size="md" icon={<Check size={20} />} onClick={onRevisar}>
            Marcar revisada
          </BigButton>
        </div>
      )}
    </AppCard>
  )
}
