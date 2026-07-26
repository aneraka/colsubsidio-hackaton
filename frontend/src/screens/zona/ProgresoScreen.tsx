import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import type { Producto } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { getProductosDeZona } from '../../data/mock/productos'
import { getZonasDeBodega } from '../../data/mock/zonas'
import { unidadLabel } from '../../lib/unidad'
import { AppCard, BigButton, Chip, ListRow, ProgressRing, TopBar } from '../../components/ui'

export function ProgresoScreen() {
  const navigate = useNavigate()
  const zona = useCountingStore((s) => s.zonaActiva)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const capturas = useCountingStore((s) => s.capturas)
  const identificar = useCountingStore((s) => s.identificarProducto)
  const cerrarZona = useCountingStore((s) => s.cerrarZona)
  const zonasCerradas = useCountingStore((s) => s.zonasCerradas)
  const [detalle, setDetalle] = useState<Producto | null>(null)

  if (!zona || !bodega) {
    navigate('/conteo/identificar')
    return null
  }

  const productos = getProductosDeZona(zona.id)
  const contados = productos.filter((p) => capturas[p.id])
  const novedades = contados.filter((p) => capturas[p.id]?.esNovedad).length
  const pendientes = productos.length - contados.length

  const cerrar = () => {
    cerrarZona(zona.id)
    const zonasBodega = getZonasDeBodega(bodega.id)
    const cerradasTotales = new Set([...zonasCerradas, zona.id])
    const bodegaCompleta = zonasBodega.every((z) => cerradasTotales.has(z.id))
    navigate(bodegaCompleta ? '/reporte' : `/bodegas/${bodega.id}/zonas`)
  }

  const recontarItem = (p: Producto) => {
    identificar(p, 'ruta')
    setDetalle(null)
    navigate('/conteo/ficha')
  }

  const captDetalle = detalle ? capturas[detalle.id] : undefined

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title={`Zona ${zona.nombre}`}
        onBack={() => navigate('/conteo/identificar')}
        right={
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-extrabold text-[color:var(--color-graphite)]">
                {contados.length}/{productos.length}
              </div>
              {novedades > 0 && (
                <div className="text-sm font-semibold" style={{ color: 'var(--color-warning)' }}>
                  {novedades} novedad{novedades > 1 ? 'es' : ''}
                </div>
              )}
            </div>
            <ProgressRing value={contados.length} total={productos.length} size="md" />
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {productos.map((p) => {
          const c = capturas[p.id]
          return (
            <ListRow
              key={p.id}
              title={p.nombre}
              subtitle={p.nrArticulo ? `Nr. ${p.nrArticulo}` : 'Sin código'}
              onClick={c ? () => setDetalle(p) : undefined}
              showChevron={!!c}
              right={
                c?.esNovedad ? (
                  <Chip variant="warning">Novedad · {c.cantidad}</Chip>
                ) : c ? (
                  <Chip variant="success">✓ {c.cantidad}</Chip>
                ) : (
                  <Chip variant="neutral">Pendiente</Chip>
                )
              }
            />
          )
        })}
      </div>

      <div className="flex gap-4 border-t border-[#E7E8EC] bg-white p-5">
        <BigButton
          variant="primary"
          size="xl"
          className="flex-[7]"
          disabled={pendientes > 0}
          onClick={cerrar}
        >
          {pendientes > 0 ? `Faltan ${pendientes} por contar` : 'Cerrar zona ✓'}
        </BigButton>
        <BigButton
          variant="secondary"
          size="xl"
          className="flex-[3]"
          onClick={() => navigate(`/bodegas/${bodega.id}/zonas`)}
        >
          Siguiente zona ›
        </BigButton>
      </div>

      {/* Detalle de captura */}
      {detalle && captDetalle && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-6" onClick={() => setDetalle(null)}>
          <AppCard radius={24} padding="p-8" className="w-[520px] max-w-full" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between">
              <h2 className="pr-4 text-2xl font-extrabold text-[color:var(--color-graphite)]">{detalle.nombre}</h2>
              <button onClick={() => setDetalle(null)} aria-label="Cerrar" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#ECEDF0]">
                <X size={22} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Detalle label="Cantidad" valor={`${captDetalle.cantidad.toLocaleString('es-CO')} · ${unidadLabel(detalle.unidad)}`} />
              <Detalle label="Hora" valor={new Date(captDetalle.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} />
              <Detalle label="Método" valor={`${captDetalle.metodoIdentificacion} · ${captDetalle.metodoCaptura}`} />
              <Detalle label="Operación" valor={captDetalle.expresion ?? '—'} />
            </div>
            <div className="mt-6">
              <BigButton variant="blue" size="lg" fullWidth onClick={() => recontarItem(detalle)}>
                Recontar este ítem
              </BigButton>
            </div>
          </AppCard>
        </div>
      )}
    </div>
  )
}

function Detalle({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-[color:var(--color-bg)] p-4">
      <div className="text-xs font-semibold tracking-wide text-[color:var(--color-graphite-60)] uppercase">{label}</div>
      <div className="mt-1 font-bold text-[color:var(--color-graphite)]">{valor}</div>
    </div>
  )
}
