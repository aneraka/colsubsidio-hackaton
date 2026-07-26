import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, ChevronRight } from 'lucide-react'
import type { Zona } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useCyclesStore } from '../../store/useCyclesStore'
import { BODEGAS, getBodegaById } from '../../data/mock/bodegas'
import { getZonasDeBodega } from '../../data/mock/zonas'
import { getProductosDeBodega, getProductosDeZona } from '../../data/mock/productos'
import { formatFechaLarga } from '../../lib/fecha'
import { unidadLabel } from '../../lib/unidad'
import { AppCard, BigButton, Chip, ProgressRing, TopBar } from '../../components/ui'
import { X } from 'lucide-react'

export function RegistrosScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const cicloActivo = useCyclesStore((s) => s.cicloActivo)
  const capturasMap = useCountingStore((s) => s.capturas)
  const iniciarSesion = useCountingStore((s) => s.iniciarSesion)
  const [verZona, setVerZona] = useState<Zona | null>(null)

  const bodegasConActividad = BODEGAS.filter((b) =>
    getProductosDeBodega(b.id).some((p) => capturasMap[p.id]),
  )

  const continuarZona = (bodegaId: string, zona: Zona) => {
    const bodega = getBodegaById(bodegaId)
    if (!bodega || !usuario) return
    iniciarSesion(bodega, zona, usuario.id, usuario.nombre)
    navigate('/conteo/identificar')
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title="Registros cargados"
        onBack={() => navigate('/inicio')}
        backLabel="Inicio"
        right={<Chip variant="date">📅 {formatFechaLarga(cicloActivo.fecha)}</Chip>}
      />

      <div className="mx-auto w-full max-w-[1000px] flex-1 overflow-y-auto p-6">
        {bodegasConActividad.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <ClipboardList size={64} className="text-[color:var(--color-graphite-60)]" />
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Aún no hay registros</h2>
            <p className="text-[color:var(--color-graphite-60)]">Inicia tu primer conteo para ver aquí lo capturado.</p>
            <BigButton variant="primary" size="lg" onClick={() => navigate('/bodegas')}>
              Inicia tu primer conteo
            </BigButton>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {bodegasConActividad.map((b) => {
              const prods = getProductosDeBodega(b.id)
              const total = prods.length
              const capt = prods.filter((p) => capturasMap[p.id]).length
              const nov = prods.filter((p) => capturasMap[p.id]?.esNovedad).length
              const completa = capt >= total
              return (
                <AppCard key={b.id} radius={20} padding="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xl font-extrabold text-[color:var(--color-graphite)]">{b.nombreCorto}</div>
                      <div className="text-sm text-[color:var(--color-graphite-60)]">
                        {capt}/{total} artículos{nov > 0 ? ` · ${nov} novedades` : ''}
                      </div>
                    </div>
                    <Chip variant={completa ? 'success' : 'warning'}>{completa ? 'Completa' : 'Incompleta'}</Chip>
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    {getZonasDeBodega(b.id)
                      .filter((z) => getProductosDeZona(z.id).some((p) => capturasMap[p.id]))
                      .map((z) => {
                        const zprods = getProductosDeZona(z.id)
                        const ztotal = zprods.length
                        const zcapt = zprods.filter((p) => capturasMap[p.id]).length
                        const zcompleta = zcapt >= ztotal
                        return (
                          <div key={z.id} className="flex items-center justify-between rounded-2xl border border-[#E7E8EC] px-4 py-3">
                            <div className="flex items-center gap-3">
                              <ProgressRing value={zcapt} total={ztotal} size="sm" />
                              <div>
                                <div className="font-bold text-[color:var(--color-graphite)]">{z.nombre}</div>
                                <div className="text-sm text-[color:var(--color-graphite-60)]">{zcapt}/{ztotal}</div>
                              </div>
                            </div>
                            {zcompleta ? (
                              <button onClick={() => setVerZona(z)} className="font-semibold text-[color:var(--color-brand-blue)] active:scale-95">
                                Ver capturas
                              </button>
                            ) : (
                              <button onClick={() => continuarZona(b.id, z)} className="inline-flex items-center gap-1 font-bold text-[color:var(--color-brand-blue)] active:scale-95">
                                Continuar conteo <ChevronRight size={18} />
                              </button>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </AppCard>
              )
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[#E7E8EC] bg-white p-5">
        <BigButton variant="secondary" size="lg" onClick={() => navigate('/reporte')}>
          Ir al reporte ›
        </BigButton>
      </div>

      {/* Ver capturas de una zona (sin teóricos ni diferencias) */}
      {verZona && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-6" onClick={() => setVerZona(null)}>
          <AppCard radius={24} padding="p-6" className="max-h-[80vh] w-[560px] max-w-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Capturas · {verZona.nombre}</h2>
              <button onClick={() => setVerZona(null)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF0]">
                <X size={22} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {getProductosDeZona(verZona.id)
                .filter((p) => capturasMap[p.id])
                .map((p) => {
                  const c = capturasMap[p.id]
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[color:var(--color-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-bold text-[color:var(--color-graphite)]">{p.nombre}</div>
                        <div className="text-sm text-[color:var(--color-graphite-60)]">
                          {new Date(c.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · {c.metodoCaptura}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold tabular text-[color:var(--color-graphite)]">
                          {c.cantidad} <span className="text-xs font-normal text-[color:var(--color-graphite-60)]">{unidadLabel(p.unidad)}</span>
                        </span>
                        {c.esNovedad && <Chip variant="warning">Novedad</Chip>}
                      </div>
                    </div>
                  )
                })}
            </div>
          </AppCard>
        </div>
      )}
    </div>
  )
}
