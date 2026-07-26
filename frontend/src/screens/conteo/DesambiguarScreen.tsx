import { useLocation, useNavigate } from 'react-router-dom'
import type { Producto } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { unidadLabel } from '../../lib/unidad'
import { AppCard, BigButton, Chip, TopBar } from '../../components/ui'

interface DesambiguarState {
  candidatos?: Producto[]
  termino?: string
}

export function DesambiguarScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const identificar = useCountingStore((s) => s.identificarProducto)
  const { candidatos, termino } = (location.state ?? {}) as DesambiguarState

  if (!candidatos || candidatos.length === 0) {
    navigate('/conteo/identificar')
    return null
  }

  const elegir = (p: Producto) => {
    // TODO(alias): aprender jerga→producto elegido para acelerar futuras búsquedas.
    identificar(p, 'nombre')
    navigate('/conteo/ficha')
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Desambiguación" onBack={() => navigate('/conteo/identificar')} />

      <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-[color:var(--color-graphite)]">¿Cuál de estos?</h1>
          {termino && (
            <p className="mt-3 flex items-center justify-center gap-2 text-lg text-[color:var(--color-graphite-60)]">
              Dijiste:
              <Chip variant="date">{termino}</Chip>
            </p>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-5">
          {candidatos.map((p) => (
            <AppCard key={p.id} radius={20} padding="p-6" className="flex w-64 flex-col gap-3">
              <div className="min-h-[72px]">
                <h2 className="text-xl font-extrabold leading-tight text-[color:var(--color-graphite)]">
                  {p.nombre}
                </h2>
                <p className="mt-1 text-sm text-[color:var(--color-graphite-60)]">
                  {p.nrArticulo ? `Nr. ${p.nrArticulo}` : 'Sin código'}
                </p>
              </div>
              <Chip variant="unit">{unidadLabel(p.unidad)}</Chip>
              <BigButton variant="blue" size="md" fullWidth onClick={() => elegir(p)}>
                Seleccionar
              </BigButton>
            </AppCard>
          ))}
        </div>

        <BigButton variant="ghost" onClick={() => navigate('/conteo/identificar')}>
          Ninguno — buscar de nuevo
        </BigButton>
      </div>
    </div>
  )
}
