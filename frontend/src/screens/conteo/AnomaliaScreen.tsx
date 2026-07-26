import { useLocation, useNavigate } from 'react-router-dom'
import type { Captura, MetodoCaptura } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { unidadPlural } from '../../lib/unidad'
import { AmberAlertCard, BigButton, HoldToConfirm, TopBar } from '../../components/ui'

interface AnomaliaState {
  cantidad?: number
  referencia?: number
  expresion?: string
  fraseOriginal?: string
  confianza?: number
  metodoCaptura?: MetodoCaptura
}

export function AnomaliaScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const producto = useCountingStore((s) => s.productoEnCurso)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const zona = useCountingStore((s) => s.zonaActiva)
  const sesion = useCountingStore((s) => s.sesion)
  const metodoId = useCountingStore((s) => s.metodoEnCurso)
  const registrarCaptura = useCountingStore((s) => s.registrarCaptura)
  const usuario = useSessionStore((s) => s.usuario)

  const st = (location.state ?? {}) as AnomaliaState

  if (!producto || !bodega || !zona || !sesion || !usuario || st.cantidad === undefined) {
    navigate('/conteo/identificar')
    return null
  }

  const cantidad = st.cantidad
  const referencia = st.referencia ?? 0

  const confirmar = () => {
    const captura: Omit<Captura, 'cicloId'> = {
      id: `cap-${producto.id}-${Date.now()}`,
      productoId: producto.id,
      bodegaId: bodega.id,
      zonaId: zona.id,
      sesionId: sesion.id,
      operarioId: usuario.id,
      cantidad,
      unidad: producto.unidad,
      metodoIdentificacion: metodoId ?? 'ruta',
      metodoCaptura: st.metodoCaptura ?? 'voz',
      expresion: st.expresion,
      fraseOriginal: st.fraseOriginal,
      confianza: st.confianza,
      esNovedad: true,
      timestamp: new Date().toISOString(),
    }
    registrarCaptura(captura)
    navigate('/conteo/identificar')
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Confirmación" onBack={() => navigate('/conteo/voz')} />

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-[720px] max-w-full">
          <AmberAlertCard
            headline="Confirma con calma"
            actions={
              <div className="flex gap-4">
                <BigButton variant="blue" size="xl" className="flex-1" onClick={() => navigate('/conteo/voz')}>
                  Recontar
                </BigButton>
                <div className="flex-1">
                  <HoldToConfirm onConfirm={confirmar} label="Mantén para confirmar" />
                </div>
              </div>
            }
          >
            <div className="flex items-end justify-center gap-10 py-4">
              <div className="text-center">
                <div className="text-sm font-semibold text-[color:var(--color-graphite-60)]">Dijiste</div>
                <div className="text-7xl font-extrabold tabular text-[color:var(--color-graphite)]">
                  {cantidad.toLocaleString('es-CO')}
                </div>
              </div>
              <div className="pb-3 text-center">
                <div className="text-sm font-semibold text-[color:var(--color-graphite-60)]">Referencia</div>
                <div className="text-3xl font-bold tabular text-[color:var(--color-graphite-60)]">
                  ≈ {referencia.toLocaleString('es-CO')}
                </div>
                <div className="text-xs text-[color:var(--color-graphite-60)]">el mes pasado</div>
              </div>
            </div>
            <p className="text-center text-lg">
              Dijiste <b>{cantidad.toLocaleString('es-CO')}</b> {unidadPlural(producto.unidad)} — el mes pasado hubo ≈{' '}
              {referencia.toLocaleString('es-CO')}.
            </p>
          </AmberAlertCard>
        </div>
      </div>
    </div>
  )
}
