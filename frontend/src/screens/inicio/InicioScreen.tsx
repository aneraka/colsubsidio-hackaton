import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Warehouse, ClipboardList, History, FileSpreadsheet, Play, CheckCircle2 } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { useCyclesStore } from '../../store/useCyclesStore'
import { useCountingStore } from '../../store/useCountingStore'
import { PRODUCTOS, getProductosDeBodega, getProductosDeZona } from '../../data/mock/productos'
import { getBodegaById } from '../../data/mock/bodegas'
import { BODEGAS } from '../../data/mock/bodegas'
import { formatFechaLarga } from '../../lib/fecha'
import { puedeExportar } from '../../lib/permisos'
import { AppCard, BrandLogo, Chip, ProgressRing, RolPill } from '../../components/ui'
import { SalirButton } from '../../components/layout/SalirButton'
import { AlertBell } from '../../components/layout/AlertBell'
import { NavMenu } from '../../components/layout/NavMenu'

export function InicioScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const cicloActivo = useCyclesStore((s) => s.cicloActivo)
  const ciclosCerrados = useCyclesStore((s) => s.ciclosCerrados)
  const capturasMap = useCountingStore((s) => s.capturas)
  const sesion = useCountingStore((s) => s.sesion)
  const zona = useCountingStore((s) => s.zonaActiva)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const contadosEnZona = useCountingStore((s) => s.contadosEnZona)

  const bodegasStats = useMemo(() => {
    let completas = 0, enProgreso = 0, sinIniciar = 0
    for (const b of BODEGAS) {
      const total = getProductosDeBodega(b.id).length
      const capt = getProductosDeBodega(b.id).filter((p) => capturasMap[p.id]).length
      if (total > 0 && capt >= total) completas++
      else if (capt > 0) enProgreso++
      else sinIniciar++
    }
    return { completas, enProgreso, sinIniciar }
  }, [capturasMap])

  const ultimoCerrado = useMemo(
    () => [...ciclosCerrados].sort((a, b) => b.fecha.localeCompare(a.fecha))[0],
    [ciclosCerrados],
  )

  if (!usuario) return null

  const capturas = Object.values(capturasMap)
  const totalCatalogo = PRODUCTOS.length
  const contados = capturas.length
  const novedades = capturas.filter((c) => c.esNovedad).length

  const hayEnProgreso = !!(sesion && zona && bodega)
  const totalZona = zona ? getProductosDeZona(zona.id).length : 0
  const contZona = zona ? contadosEnZona(zona.id) : 0

  const esAud = puedeExportar(usuario)

  return (
    <div className="screen-enter min-h-full">
      <div className="mx-auto max-w-[1200px] px-6 py-6">
        {/* Encabezado */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/inicio')} aria-label="Inicio">
              <BrandLogo size="md" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-[color:var(--color-graphite)]">Hola, {usuario.nombre} 👋</h1>
                <RolPill rol={usuario.rol} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                {ultimoCerrado && (
                  <button
                    onClick={() => navigate(`/reporte?ciclo=${ultimoCerrado.id}`)}
                    className="inline-flex items-center gap-1 font-semibold text-[color:var(--color-success)] active:scale-95"
                  >
                    <CheckCircle2 size={16} /> Último conteo: {formatFechaLarga(ultimoCerrado.fecha)}
                  </button>
                )}
                <span className="text-[color:var(--color-graphite-60)]">·</span>
                <Chip variant="date">📅 Ciclo actual: {formatFechaLarga(cicloActivo.fecha)}</Chip>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AlertBell />
            <NavMenu variant="inline" />
            <SalirButton />
          </div>
        </div>

        {/* Banda de estado */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <AppCard radius={16} padding="p-4" className="flex items-center gap-4">
            <ProgressRing value={contados} total={totalCatalogo} size="sm" label="percent" />
            <div>
              <div className="text-sm text-[color:var(--color-graphite-60)]">Avance total</div>
              <div className="text-xl font-extrabold text-[color:var(--color-graphite)]">{contados}/{totalCatalogo}</div>
            </div>
          </AppCard>

          <AppCard radius={16} padding="p-4">
            <div className="text-sm text-[color:var(--color-graphite-60)]">Bodegas</div>
            <div className="mt-1 flex flex-col gap-0.5 text-sm font-semibold">
              <span style={{ color: 'var(--color-success)' }}>{bodegasStats.completas} completas</span>
              <span style={{ color: 'var(--color-warning)' }}>{bodegasStats.enProgreso} en progreso</span>
              <span className="text-[color:var(--color-graphite-60)]">{bodegasStats.sinIniciar} sin iniciar</span>
            </div>
          </AppCard>

          <AppCard radius={16} padding="p-4">
            <div className="text-sm text-[color:var(--color-graphite-60)]">Capturas del ciclo</div>
            <div className="mt-1 text-3xl font-extrabold text-[color:var(--color-graphite)]">{contados}</div>
          </AppCard>

          <AppCard
            radius={16}
            padding="p-4"
            className={esAud && novedades > 0 ? 'cursor-pointer active:scale-[0.98]' : ''}
            onClick={esAud && novedades > 0 ? () => navigate('/alertas') : undefined}
          >
            <div className="text-sm text-[color:var(--color-graphite-60)]">Novedades</div>
            <div className="mt-1 text-3xl font-extrabold" style={{ color: novedades > 0 ? 'var(--color-warning)' : 'var(--color-graphite-60)' }}>
              {novedades}
            </div>
          </AppCard>
        </div>

        {/* Continuar donde ibas */}
        {hayEnProgreso && (
          <AppCard radius={22} padding="p-6" className="mt-6 border-l-8 border-[color:var(--color-brand-yellow)]">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold text-[color:var(--color-graphite-60)]">Tienes un conteo en progreso</div>
                <div className="mt-1 text-2xl font-extrabold text-[color:var(--color-graphite)]">
                  {getBodegaById(bodega!.id)?.nombreCorto} › {zona!.nombre} · {contZona}/{totalZona} artículos
                </div>
                <div className="mt-3 h-2 w-64 max-w-full overflow-hidden rounded-full bg-[#E7E8EC]">
                  <div className="h-full rounded-full bg-[color:var(--color-brand-blue)]" style={{ width: `${totalZona ? (contZona / totalZona) * 100 : 0}%` }} />
                </div>
              </div>
              <button
                onClick={() => navigate('/conteo/identificar')}
                className="inline-flex h-16 items-center gap-2 rounded-2xl bg-[color:var(--color-brand-yellow)] px-8 text-xl font-bold text-[color:var(--color-graphite)] shadow-[var(--shadow-card)] active:scale-[0.98]"
              >
                <Play size={24} fill="currentColor" /> Continuar donde ibas
              </button>
            </div>
          </AppCard>
        )}

        {/* Tarjetas de acción */}
        <div className={`mt-6 grid gap-5 ${esAud ? 'grid-cols-2 xl:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
          <ActionCard
            icon={<Warehouse size={30} />}
            titulo="Contar bodega"
            desc="Selecciona bodega y zona para iniciar o continuar el conteo."
            onClick={() => navigate('/bodegas')}
          />
          <ActionCard
            icon={<ClipboardList size={30} />}
            titulo="Registros cargados"
            desc="Revisa lo capturado y lo que falta por contar."
            badge={bodegasStats.enProgreso > 0 ? `${bodegasStats.enProgreso} incompletas` : undefined}
            onClick={() => navigate('/registros')}
          />
          <ActionCard
            icon={<History size={30} />}
            titulo="Histórico de conteos"
            desc="Consulta los ciclos anteriores."
            badge={`${ciclosCerrados.length}`}
            onClick={() => navigate('/historico')}
          />
          {esAud && (
            <ActionCard
              icon={<FileSpreadsheet size={30} />}
              titulo="Exportar archivo"
              desc={contados < totalCatalogo ? 'Conteo en progreso — se exporta lo capturado.' : 'Genera el Excel/CSV del ciclo.'}
              verde
              onClick={() => navigate('/reporte')}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function ActionCard({
  icon,
  titulo,
  desc,
  badge,
  verde,
  onClick,
}: {
  icon: React.ReactNode
  titulo: string
  desc: string
  badge?: string
  verde?: boolean
  onClick: () => void
}) {
  return (
    <AppCard
      radius={20}
      padding="p-6"
      className="relative flex min-h-[200px] cursor-pointer flex-col gap-3 transition-transform active:scale-[0.98]"
      onClick={onClick}
    >
      {badge && (
        <span className="absolute top-4 right-4 rounded-full px-2.5 py-1 text-xs font-extrabold text-white" style={{ background: 'var(--color-warning)' }}>
          {badge}
        </span>
      )}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={verde ? { background: '#E4F5EC', color: 'var(--color-success)' } : { background: 'var(--color-brand-blue-soft)', color: 'var(--color-brand-blue)' }}
      >
        {icon}
      </div>
      <div className="text-2xl font-extrabold text-[color:var(--color-graphite)]">{titulo}</div>
      <div className="text-[color:var(--color-graphite-60)]">{desc}</div>
    </AppCard>
  )
}
