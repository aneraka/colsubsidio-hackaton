import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Hash, Type, X, PartyPopper, ChevronRight } from 'lucide-react'
import type { MetodoIdentificacion, Producto } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { getBodegaById } from '../../data/mock/bodegas'
import { getProductosDeZona } from '../../data/mock/productos'
import { AppCard, BigButton, Chip, TopBar } from '../../components/ui'
import { CodigoDialog } from '../../components/conteo/CodigoDialog'
import { BuscadorNombre } from '../../components/conteo/BuscadorNombre'

export function IdentificarScreen() {
  const navigate = useNavigate()
  const zona = useCountingStore((s) => s.zonaActiva)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const identificar = useCountingStore((s) => s.identificarProducto)
  const productosPendientes = useCountingStore((s) => s.productosPendientes)
  const saltarProducto = useCountingStore((s) => s.saltarProducto)
  const contadosEnZona = useCountingStore((s) => s.contadosEnZona)
  // Suscripción a capturas y saltados: fuerza el re-render al capturar/saltar productos.
  const capturas = useCountingStore((s) => s.capturas)
  const saltados = useCountingStore((s) => s.saltados)
  const [panel, setPanel] = useState<'none' | 'codigo' | 'nombre'>('none')

  if (!zona || !bodega) {
    navigate('/bodegas')
    return null
  }

  void capturas // dependencias de re-render (el cálculo real ocurre en productosPendientes)
  void saltados
  const pendientes = productosPendientes(zona.id)
  const siguiente = pendientes[0] ?? null
  const total = getProductosDeZona(zona.id).length
  const contados = contadosEnZona(zona.id)

  const irAFicha = (p: Producto, metodo: MetodoIdentificacion) => {
    identificar(p, metodo)
    navigate('/conteo/ficha')
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title="Identifica el producto"
        breadcrumb={`${getBodegaById(bodega.id)?.nombreCorto} › ${zona.nombre}`}
        onBack={() => navigate(`/bodegas/${bodega.id}/zonas`)}
        backLabel="Zonas"
        right={
          <button onClick={() => navigate('/zona/progreso')} className="no-select active:scale-95">
            <Chip variant="info">{contados}/{total}</Chip>
          </button>
        }
      />

      <div className="grid flex-1 grid-cols-1 gap-5 p-5 lg:grid-cols-[65%_35%]">
        {/* Columna izquierda — ruta guiada */}
        <AppCard radius={24} padding="p-8" className="flex flex-col justify-center">
          {siguiente ? (
            <>
              <span className="text-sm font-extrabold tracking-widest text-[color:var(--color-brand-blue)] uppercase">
                Siguiente en la ruta
              </span>
              <h1 className="mt-3 text-5xl leading-tight font-extrabold text-[color:var(--color-graphite)]">
                {siguiente.nombre}
              </h1>
              <p className="mt-3 text-xl text-[color:var(--color-graphite-60)]">
                {siguiente.nrArticulo ? `Nr. ${siguiente.nrArticulo}` : 'Sin código'}
              </p>
              <div className="mt-8 flex flex-col gap-3">
                <BigButton variant="primary" size="xl" fullWidth onClick={() => irAFicha(siguiente, 'ruta')}>
                  Es este ✓
                </BigButton>
                <BigButton
                  variant="ghost"
                  size="md"
                  fullWidth
                  iconRight={<ChevronRight size={22} />}
                  onClick={() => saltarProducto(siguiente.id)}
                >
                  Saltar este
                </BigButton>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-5 py-8 text-center">
              <PartyPopper size={64} style={{ color: 'var(--color-success)' }} />
              <h1 className="text-4xl font-extrabold text-[color:var(--color-graphite)]">Zona completa 🎉</h1>
              <BigButton variant="blue" size="lg" onClick={() => navigate('/zona/progreso')}>
                Ver progreso
              </BigButton>
            </div>
          )}
        </AppCard>

        {/* Columna derecha — 3 filtros */}
        <div className="flex flex-col gap-4">
          <FiltroBtn variant="blue" icon={<Camera size={28} />} label="Escanear" onClick={() => navigate('/conteo/escanear')} />
          <FiltroBtn variant="secondary" icon={<Hash size={28} />} label="Código" onClick={() => setPanel('codigo')} />
          <FiltroBtn variant="secondary" icon={<Type size={28} />} label="Nombre" onClick={() => setPanel('nombre')} />
        </div>
      </div>

      {panel === 'codigo' && (
        <CodigoDialog onCerrar={() => setPanel('none')} onEncontrado={(p) => irAFicha(p, 'codigo')} />
      )}

      {panel === 'nombre' && (
        <div className="fixed inset-0 z-[600] flex justify-end bg-black/40" onClick={() => setPanel('none')}>
          <div
            className="screen-enter flex h-full w-[560px] max-w-full flex-col gap-4 bg-white p-6 shadow-[-8px_0_32px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Buscar por nombre</h2>
              <button onClick={() => setPanel('none')} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF0]">
                <X size={22} />
              </button>
            </div>
            <BuscadorNombre
              zonaId={zona.id}
              autoFocus
              onElegir={(p) => irAFicha(p, 'nombre')}
              onMultiples={(candidatos, termino) =>
                navigate('/conteo/desambiguar', { state: { candidatos, termino } })
              }
            />
          </div>
        </div>
      )}
    </div>
  )
}

function FiltroBtn({
  variant,
  icon,
  label,
  onClick,
}: {
  variant: 'blue' | 'secondary'
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <BigButton variant={variant} onClick={onClick} fullWidth icon={icon} className="!h-24 !justify-start !text-2xl">
      {label}
    </BigButton>
  )
}
