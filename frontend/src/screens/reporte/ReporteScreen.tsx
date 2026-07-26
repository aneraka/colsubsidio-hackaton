import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileSpreadsheet, Download, AlertCircle, Lock, CheckCircle2, Zap } from 'lucide-react'
import type { Captura } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useCyclesStore } from '../../store/useCyclesStore'
import { useSyncStore } from '../../store/useSyncStore'
import { construirReporte, limpiarCapturas } from '../../services/captures'
import { PRODUCTOS, getProductosDeBodega } from '../../data/mock/productos'
import { BODEGAS } from '../../data/mock/bodegas'
import { getUsuarioNombre } from '../../data/mock/usuarios'
import { unidadLabel } from '../../lib/unidad'
import { referenciaHistorica } from '../../lib/validation'
import { formatFechaLarga, minutosDesde } from '../../lib/fecha'
import { puedeVerTeorico, puedeCerrarCiclo } from '../../lib/permisos'
import { AppCard, BigButton, Chip, TopBar } from '../../components/ui'

type Filtro = 'todas' | 'novedades' | 'diferencias'

export function ReporteScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const cicloIdParam = params.get('ciclo')

  const usuario = useSessionStore((s) => s.usuario)
  const sesion = useCountingStore((s) => s.sesion)
  const capturasMap = useCountingStore((s) => s.capturas)
  const resetConteo = useCountingStore((s) => s.reset)
  const registrarCaptura = useCountingStore((s) => s.registrarCaptura)
  const cicloActivo = useCyclesStore((s) => s.cicloActivo)
  const getCicloById = useCyclesStore((s) => s.getCicloById)
  const cerrarCicloStore = useCyclesStore((s) => s.cerrarCiclo)

  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [confirmCierre, setConfirmCierre] = useState(false)
  const [cierre, setCierre] = useState<{ cerrada: string; proxima: string } | null>(null)

  const cicloVisto = cicloIdParam ? getCicloById(cicloIdParam) : cicloActivo
  const soloLectura = cicloVisto?.estado === 'cerrado'

  const capturas: Captura[] = useMemo(
    () => (soloLectura && cicloVisto ? cicloVisto.capturas : Object.values(capturasMap)),
    [soloLectura, cicloVisto, capturasMap],
  )
  const filas = useMemo(() => construirReporte(capturas), [capturas])
  const sdNegativos = useMemo(() => PRODUCTOS.filter((p) => p.sd < 0), [])

  if (!usuario || !cicloVisto) {
    navigate('/inicio')
    return null
  }

  const esAud = puedeVerTeorico(usuario)

  // KPIs (congelados si es ciclo cerrado)
  const contados = soloLectura && cicloVisto.resumen ? cicloVisto.resumen.articulosContados : filas.length
  const novedades = soloLectura && cicloVisto.resumen ? cicloVisto.resumen.novedades : filas.filter((f) => f.esNovedad).length
  const totalCatalogo = PRODUCTOS.length
  const duracion = soloLectura && cicloVisto.resumen ? cicloVisto.resumen.duracionMin : sesion ? minutosDesde(sesion.iniciadaEn) : 0
  const operariosTxt = soloLectura && cicloVisto.resumen ? cicloVisto.resumen.operarios.join(', ') : [...new Set(capturas.map((c) => getUsuarioNombre(c.operarioId)))].join(', ') || '—'

  const pendientesBodega = PRODUCTOS.filter((p) => !capturas.some((c) => c.productoId === p.id))
  const enProgreso = !soloLectura && pendientesBodega.length > 0
  const todasCompletas = !soloLectura && pendientesBodega.length === 0 && contados > 0

  const filasFiltradas = filas.filter((f) => {
    if (filtro === 'novedades') return f.esNovedad
    if (filtro === 'diferencias') return (f.diferencia ?? 0) !== 0
    return true
  })

  const exportar = async () => {
    const { generarArchivoConteo } = await import('../../services/exportExcel')
    generarArchivoConteo(capturas, cicloVisto.fecha)
  }
  const exportarCSV = async () => {
    const { generarCSV } = await import('../../services/exportExcel')
    generarCSV(capturas, cicloVisto.fecha)
  }

  const simularCompleto = () => {
    for (const p of PRODUCTOS) {
      if (capturasMap[p.id]) continue
      const cant = referenciaHistorica(p) || Math.max(1, Math.round(Math.abs(p.sd)) || 1)
      registrarCaptura({
        id: `cap-sim-${p.id}`,
        productoId: p.id,
        bodegaId: p.bodegaId,
        zonaId: p.zonaId,
        sesionId: `s-sim-${p.bodegaId}`,
        operarioId: usuario.id,
        cantidad: cant,
        unidad: p.unidad,
        metodoIdentificacion: 'ruta',
        metodoCaptura: 'teclado',
        esNovedad: false,
        timestamp: new Date().toISOString(),
      })
    }
  }

  const cerrar = () => {
    const capArr = Object.values(capturasMap)
    const bodegasCompletas = BODEGAS.filter((b) => {
      const prods = getProductosDeBodega(b.id)
      return prods.length > 0 && prods.every((p) => capturasMap[p.id])
    }).length
    const resumen = {
      articulosContados: capArr.length,
      articulosTotales: totalCatalogo,
      novedades: capArr.filter((c) => c.esNovedad).length,
      bodegasCompletas,
      operarios: [...new Set(capArr.map((c) => getUsuarioNombre(c.operarioId)))],
      duracionMin: sesion ? minutosDesde(sesion.iniciadaEn) : 0,
    }
    const fechaCerrada = cicloActivo.fecha
    const proxima = cerrarCicloStore({ capturas: capArr, resumen, cerradoPor: usuario.nombre })
    resetConteo()
    limpiarCapturas()
    useSyncStore.getState().reset()
    setConfirmCierre(false)
    setCierre({ cerrada: fechaCerrada, proxima })
    setTimeout(() => navigate('/inicio'), 2200)
  }

  // Pantalla de éxito tras cerrar
  if (cierre) {
    return (
      <div className="screen-enter flex min-h-full items-center justify-center p-6">
        <AppCard radius={24} padding="p-10" className="flex w-[520px] max-w-full flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full text-white number-pop" style={{ background: 'var(--color-success)' }}>
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">
            Ciclo {formatFechaLarga(cierre.cerrada)} archivado ✓
          </h1>
          <p className="text-[color:var(--color-graphite-60)]">Próximo conteo: {formatFechaLarga(cierre.proxima, true)}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title={soloLectura ? `Reporte · ${formatFechaLarga(cicloVisto.fecha)}` : 'Reporte de la sesión'}
        onBack={() => navigate(soloLectura ? '/historico' : '/inicio')}
        backLabel={soloLectura ? 'Histórico' : 'Inicio'}
        right={<Chip variant="date">📅 {formatFechaLarga(cicloVisto.fecha)}</Chip>}
      />

      <div className={`grid flex-1 grid-cols-1 gap-5 overflow-y-auto p-5 ${esAud ? 'lg:grid-cols-[1fr_320px]' : ''}`}>
        <div className="flex flex-col gap-5">
          {/* Banner solo lectura */}
          {soloLectura && (
            <div className="flex items-center gap-3 rounded-2xl bg-[#ECEDF0] px-5 py-4">
              <Lock size={22} className="text-[color:var(--color-graphite-60)]" />
              <span className="font-semibold text-[color:var(--color-graphite)]">
                Ciclo cerrado el {formatFechaLarga(cicloVisto.fecha)}{cicloVisto.cerradoPor ? ` por ${cicloVisto.cerradoPor}` : ''} — solo lectura
              </span>
            </div>
          )}

          {/* Aviso conteo en progreso */}
          {enProgreso && (
            <div className="rounded-2xl border-2 px-5 py-4" style={{ background: 'var(--color-warning-bg)', borderColor: 'var(--color-warning)' }}>
              <div className="flex items-center gap-3">
                <AlertCircle size={24} style={{ color: 'var(--color-warning)' }} />
                <div className="font-extrabold text-[color:var(--color-graphite)]">
                  Conteo en progreso — {contados}/{totalCatalogo} artículos
                </div>
              </div>
              <div className="mt-2 text-sm text-[color:var(--color-graphite)]">
                {esAud ? 'Puedes generar el archivo con lo contado hasta ahora. ' : ''}Pendientes:{' '}
                {pendientesBodega.slice(0, 8).map((p) => p.nombre).join(', ')}
                {pendientesBodega.length > 8 ? ` y ${pendientesBodega.length - 8} más…` : ''}
              </div>
            </div>
          )}

          {/* KPIs (ambos roles) */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Kpi label="Artículos contados" valor={String(contados)} />
            <Kpi label="Novedades" valor={String(novedades)} acento="var(--color-warning)" />
            <Kpi label="Tiempo" valor={`${duracion} min`} />
            <Kpi label="Operarios" valor={operariosTxt} />
          </div>

          {/* Tabla comparativa — SOLO auditor (conteo ciego para el contador) */}
          {esAud ? (
            <>
              <AppCard radius={20} padding="p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-extrabold text-[color:var(--color-graphite)]">Contado vs. Sistema</h2>
                  <div className="flex gap-2">
                    {(['todas', 'novedades', 'diferencias'] as Filtro[]).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFiltro(f)}
                        className="rounded-full px-3.5 py-1.5 text-sm font-bold no-select"
                        style={{ background: filtro === f ? 'var(--color-brand-blue)' : '#ECEDF0', color: filtro === f ? '#fff' : 'var(--color-graphite-60)' }}
                      >
                        {f === 'todas' ? 'Todas' : f === 'novedades' ? 'Solo novedades' : 'Solo diferencias'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[#E7E8EC] text-sm text-[color:var(--color-graphite-60)]">
                        <th className="py-2 pr-4 font-semibold">Artículo</th>
                        <th className="py-2 pr-4 text-right font-semibold">Contado</th>
                        <th className="py-2 pr-4 text-right font-semibold">Sistema</th>
                        <th className="py-2 text-right font-semibold">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filasFiltradas.map((f) => {
                        const dif = f.diferencia ?? 0
                        const color = dif > 0 ? 'var(--color-success)' : dif < 0 ? 'var(--color-danger)' : 'var(--color-graphite-60)'
                        return (
                          <tr key={f.producto.id} className="border-b border-[#F0F1F4]">
                            <td className="py-3 pr-4">
                              <div className="font-semibold text-[color:var(--color-graphite)]">{f.producto.nombre}</div>
                              <div className="text-xs text-[color:var(--color-graphite-60)]">{unidadLabel(f.producto.unidad)}</div>
                            </td>
                            <td className="py-3 pr-4 text-right font-bold tabular text-[color:var(--color-graphite)]">{f.contado?.toLocaleString('es-CO')}</td>
                            <td className="py-3 pr-4 text-right tabular text-[color:var(--color-graphite-60)]">{f.sistema.toLocaleString('es-CO')}</td>
                            <td className="py-3 text-right font-bold tabular" style={{ color }}>
                              {dif > 0 ? '+' : ''}{dif.toLocaleString('es-CO')}
                            </td>
                          </tr>
                        )
                      })}
                      {filasFiltradas.length === 0 && (
                        <tr><td colSpan={4} className="py-6 text-center text-[color:var(--color-graphite-60)]">Sin registros para este filtro.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </AppCard>

              {sdNegativos.length > 0 && (
                <AppCard radius={20} padding="p-5">
                  <h2 className="text-xl font-extrabold text-[color:var(--color-graphite)]">Novedades de reconciliación</h2>
                  <p className="mt-1 mb-3 text-sm text-[color:var(--color-graphite-60)]">Artículos con stock del sistema negativo — requieren reconciliación.</p>
                  <div className="flex flex-col gap-2">
                    {sdNegativos.map((p) => (
                      <div key={p.id} className="flex items-center justify-between rounded-2xl bg-[color:var(--color-warning-bg)] px-4 py-3">
                        <span className="font-semibold text-[color:var(--color-graphite)]">{p.nombre}</span>
                        <span className="font-bold tabular text-[color:var(--color-danger)]">SD {p.sd}</span>
                      </div>
                    ))}
                  </div>
                </AppCard>
              )}
            </>
          ) : (
            <AppCard radius={20} padding="p-6" className="text-center">
              <p className="text-[color:var(--color-graphite)]">
                El reporte comparativo y la exportación están disponibles para el rol <b>auditor</b>.
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-graphite-60)]">Tu conteo se registra a ciegas: no ves teóricos ni diferencias.</p>
            </AppCard>
          )}
        </div>

        {/* Columna de exportación + cierre — SOLO auditor */}
        {esAud && (
          <div className="flex flex-col gap-4">
            <AppCard radius={20} padding="p-6" className="flex flex-col gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#E4F5EC' }}>
                <FileSpreadsheet size={30} style={{ color: 'var(--color-success)' }} />
              </div>
              <p className="text-sm text-[color:var(--color-graphite-60)]">
                Columnas: <b>CANTIDAD, Nr.Artículo, Artículo, Unidad, SD</b> — una hoja por bodega.
              </p>
              <BigButton variant="blue" size="xl" fullWidth icon={<Download size={24} />} onClick={exportar} disabled={capturas.length === 0}>
                {soloLectura ? 'Descargar Excel de este ciclo' : 'Generar archivo Excel'}
              </BigButton>
              <BigButton variant="secondary" size="md" fullWidth onClick={exportarCSV} disabled={capturas.length === 0}>
                Descargar CSV
              </BigButton>
            </AppCard>

            {/* Cierre de ciclo (solo ciclo activo) */}
            {!soloLectura && puedeCerrarCiclo(usuario) && (
              <AppCard radius={20} padding="p-6" className="flex flex-col gap-3">
                <h3 className="text-lg font-extrabold text-[color:var(--color-graphite)]">Cierre de ciclo</h3>
                {todasCompletas ? (
                  <BigButton variant="primary" size="lg" fullWidth onClick={() => setConfirmCierre(true)}>
                    Cerrar ciclo de conteo ✓
                  </BigButton>
                ) : (
                  <p className="text-sm text-[color:var(--color-graphite-60)]">
                    El ciclo se puede cerrar cuando todas las bodegas estén completas.
                  </p>
                )}
                {import.meta.env.DEV && !todasCompletas && (
                  <BigButton variant="secondary" size="md" fullWidth icon={<Zap size={20} />} onClick={simularCompleto}>
                    Simular ciclo completo
                  </BigButton>
                )}
              </AppCard>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de cierre */}
      {confirmCierre && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={() => setConfirmCierre(false)}>
          <div className="w-[480px] max-w-full rounded-3xl bg-white p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Cerrar ciclo de conteo</h2>
            <p className="mt-2 text-[color:var(--color-graphite-60)]">
              Se archivará el conteo del {formatFechaLarga(cicloActivo.fecha)} con {Object.keys(capturasMap).length} capturas.
              Esta acción congela el ciclo.
            </p>
            <div className="mt-6 flex gap-4">
              <button onClick={cerrar} className="h-16 flex-1 rounded-2xl bg-[color:var(--color-brand-yellow)] text-lg font-bold text-[color:var(--color-graphite)]">
                Cerrar ciclo ✓
              </button>
              <button onClick={() => setConfirmCierre(false)} className="h-16 flex-1 rounded-2xl border-2 border-[color:var(--color-graphite)] text-lg font-bold text-[color:var(--color-graphite)]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Kpi({ label, valor, acento }: { label: string; valor: string; acento?: string }) {
  return (
    <AppCard radius={16} padding="p-4">
      <div className="text-sm text-[color:var(--color-graphite-60)]">{label}</div>
      <div className="mt-1 truncate text-2xl font-extrabold" style={{ color: acento ?? 'var(--color-graphite)' }}>{valor}</div>
    </AppCard>
  )
}
