import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock } from 'lucide-react'
import { useCyclesStore } from '../../store/useCyclesStore'
import { useCountingStore } from '../../store/useCountingStore'
import { PRODUCTOS } from '../../data/mock/productos'
import { formatFechaLarga } from '../../lib/fecha'
import { AppCard, BigButton, Chip, ProgressRing, TopBar } from '../../components/ui'

export function HistoricoScreen() {
  const navigate = useNavigate()
  const cicloActivo = useCyclesStore((s) => s.cicloActivo)
  const ciclosCerrados = useCyclesStore((s) => s.ciclosCerrados)
  const getProximaFecha = useCyclesStore((s) => s.getProximaFecha)
  const capturasMap = useCountingStore((s) => s.capturas)
  const sesion = useCountingStore((s) => s.sesion)

  const total = PRODUCTOS.length
  const contados = Object.keys(capturasMap).length

  const cerradosOrdenados = useMemo(
    () => [...ciclosCerrados].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [ciclosCerrados],
  )

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Histórico de conteos" onBack={() => navigate('/inicio')} backLabel="Inicio" />

      <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-y-auto p-6">
        {/* Ciclo actual */}
        <AppCard radius={22} padding="p-6" className="border-l-8 border-[color:var(--color-brand-yellow)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ProgressRing value={contados} total={total} size="lg" label="percent" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">
                    Ciclo {formatFechaLarga(cicloActivo.fecha)}
                  </h2>
                  <Chip variant="warning">En curso</Chip>
                </div>
                <div className="mt-1 text-[color:var(--color-graphite-60)]">{contados}/{total} artículos contados</div>
                <div className="mt-1 flex items-center gap-1 text-sm text-[color:var(--color-graphite-60)]">
                  <Clock size={14} /> Próximo ciclo: {formatFechaLarga(getProximaFecha(), true)}
                </div>
              </div>
            </div>
            <BigButton
              variant="primary"
              size="lg"
              icon={<ChevronRight size={22} />}
              onClick={() => navigate(sesion ? '/conteo/identificar' : '/bodegas')}
            >
              Continuar conteo
            </BigButton>
          </div>
        </AppCard>

        {/* Ciclos cerrados */}
        <h3 className="mt-8 mb-3 text-sm font-extrabold tracking-wider text-[color:var(--color-brand-blue)] uppercase">
          Ciclos cerrados
        </h3>
        <div className="flex flex-col gap-3">
          {cerradosOrdenados.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/reporte?ciclo=${c.id}`)}
              className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-left shadow-[var(--shadow-card)] no-select active:scale-[0.99]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-extrabold text-[color:var(--color-graphite)]">
                    {formatFechaLarga(c.fecha, true)}
                  </span>
                  <Chip variant="success">Cerrado</Chip>
                </div>
                {c.resumen && (
                  <div className="mt-1 text-sm text-[color:var(--color-graphite-60)]">
                    {c.resumen.articulosContados} artículos · {c.resumen.novedades} novedades ·{' '}
                    {c.resumen.operarios.join(', ')} · {c.resumen.duracionMin} min
                  </div>
                )}
              </div>
              <ChevronRight size={24} className="text-[color:var(--color-graphite-60)]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
