import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse } from 'lucide-react'
import type { Bodega } from '../../types/domain'
import { getBodegas } from '../../services/catalog'
import { getProductosDeBodega } from '../../data/mock/productos'
import { useCountingStore } from '../../store/useCountingStore'
import { fechaCicloTexto } from '../../lib/fecha'
import { AppCard, Chip, ProgressRing, TopBar } from '../../components/ui'

export function BodegasScreen() {
  const navigate = useNavigate()
  const [bodegas, setBodegas] = useState<Bodega[] | null>(null)
  const contadosEnBodega = useCountingStore((s) => s.contadosEnBodega)
  const capturas = useCountingStore((s) => s.capturas) // fuerza re-render al capturar

  useEffect(() => {
    getBodegas().then(setBodegas)
  }, [])

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Selecciona tu bodega" right={<Chip variant="date">📅 {fechaCicloTexto()}</Chip>} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-3 gap-6 xl:grid-cols-4">
          {bodegas === null
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[190px] animate-pulse rounded-3xl bg-white/60" />
              ))
            : bodegas.map((b) => {
                const total = getProductosDeBodega(b.id).length
                const contados = contadosEnBodega(b.id)
                void capturas
                return (
                  <AppCard
                    key={b.id}
                    radius={22}
                    padding="p-5"
                    className="flex h-[190px] cursor-pointer flex-col justify-between transition-transform active:scale-[0.98]"
                    onClick={() => navigate(`/bodegas/${b.id}/zonas`)}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl"
                      style={{ background: 'var(--color-brand-blue-soft)' }}
                    >
                      <Warehouse size={26} style={{ color: 'var(--color-brand-blue)' }} />
                    </div>
                    <div className="flex items-end justify-between gap-3">
                      <div className="min-w-0">
                        <div className="line-clamp-2 text-lg leading-tight font-bold text-[color:var(--color-graphite)]">
                          {b.nombreCorto}
                        </div>
                        <div className="mt-1 text-xs text-[color:var(--color-graphite-60)]">
                          {total} artículos
                        </div>
                      </div>
                      <ProgressRing value={contados} total={total} size="sm" />
                    </div>
                  </AppCard>
                )
              })}
        </div>
      </div>
    </div>
  )
}
