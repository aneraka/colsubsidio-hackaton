import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Upload, Download, X } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { puedeEditarBodegas } from '../../lib/permisos'
import { normalizar } from '../../lib/texto'
import { getTitularesDeBodegas } from '../../services/usuarios'
import {
  listarBodegasAdmin,
  renombrarBodega,
  getLiderDeSede,
  asignarLiderDeSede,
  listarCandidatosLider,
  listarOperariosDisponibles,
  getOperariosDeBodega,
  asignarOperariosDeBodega,
  listarProductosDeBodega,
  buscarProductosCatalogo,
  agregarProductoABodega,
  quitarProductoDeBodega,
  descargarPlantillaProductos,
  cargarProductosDesdeExcel,
  type BodegaAdmin,
  type ProductoBodega,
  type ProductoCatalogo,
  type ResultadoCarga,
} from '../../services/bodegas'
import { AppCard, BigButton, ListRow, TopBar } from '../../components/ui'

type Mensaje = { tipo: 'ok' | 'error'; texto: string } | null

export function GestionBodegasScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const puedeEditar = puedeEditarBodegas(usuario)

  const [bodegas, setBodegas] = useState<BodegaAdmin[] | null>(null)
  const [titulares, setTitulares] = useState<Record<string, { principal?: unknown; revisor?: unknown }>>({})
  const [busqueda, setBusqueda] = useState('')
  const [soloSinAsignar, setSoloSinAsignar] = useState(false)
  const [seleccionada, setSeleccionada] = useState<BodegaAdmin | null>(null)

  const cargar = () => {
    listarBodegasAdmin().then(setBodegas)
    getTitularesDeBodegas().then(setTitulares)
  }

  useEffect(() => {
    cargar()
  }, [])

  const filtradas = useMemo(() => {
    if (!bodegas) return null
    const q = normalizar(busqueda)
    return bodegas.filter((b) => {
      if (q && !normalizar(b.nombre).includes(q)) return false
      if (soloSinAsignar) {
        const t = titulares[b.id]
        if (t?.principal && t?.revisor) return false
      }
      return true
    })
  }, [bodegas, busqueda, soloSinAsignar, titulares])

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Gestión de bodegas" onBack={() => navigate('/inicio')} backLabel="Inicio" />

      <div className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto p-6">
        <div className="relative mb-3">
          <Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-graphite-60)]"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar bodega por nombre…"
            className="h-14 w-full rounded-xl border border-[#D8D9DD] bg-white pl-12 pr-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
        </div>

        {puedeEditar && (
          <button
            onClick={() => setSoloSinAsignar((v) => !v)}
            className="mb-4 rounded-full px-4 py-2 text-sm font-bold no-select"
            style={
              soloSinAsignar
                ? { background: 'var(--color-brand-blue)', color: '#fff' }
                : { background: '#ECEDF0', color: 'var(--color-graphite-60)' }
            }
          >
            Bodegas sin asignar
          </button>
        )}

        {bodegas === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(filtradas ?? []).map((b) => {
              const t = titulares[b.id]
              const faltante = !t?.principal || !t?.revisor
              return (
                <ListRow
                  key={b.id}
                  title={b.nombre}
                  subtitle={b.siteNombre}
                  right={
                    faltante ? (
                      <span className="text-sm font-bold text-[color:var(--color-warning)]">Sin asignar</span>
                    ) : undefined
                  }
                  onClick={() => setSeleccionada(b)}
                />
              )
            })}
          </div>
        )}
      </div>

      {seleccionada && (
        <DetalleBodegaDialog
          bodega={seleccionada}
          puedeEditar={puedeEditar}
          onClose={() => setSeleccionada(null)}
          onActualizado={cargar}
        />
      )}
    </div>
  )
}

function DetalleBodegaDialog({
  bodega,
  puedeEditar,
  onClose,
  onActualizado,
}: {
  bodega: BodegaAdmin
  puedeEditar: boolean
  onClose: () => void
  onActualizado: () => void
}) {
  const [tab, setTab] = useState<'general' | 'productos'>('general')

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <AppCard
        radius={24}
        padding="p-8"
        className="max-h-[85vh] w-[640px] max-w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">{bodega.nombre}</h2>
            <p className="text-[color:var(--color-graphite-60)]">{bodega.siteNombre}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        <div className="mb-6 flex gap-2 border-b border-[#E7E8EC]">
          {(['general', 'productos'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="-mb-px border-b-2 px-4 py-2 text-sm font-bold no-select"
              style={
                tab === t
                  ? { borderColor: 'var(--color-brand-blue)', color: 'var(--color-brand-blue)' }
                  : { borderColor: 'transparent', color: 'var(--color-graphite-60)' }
              }
            >
              {t === 'general' ? 'General' : 'Agregar productos'}
            </button>
          ))}
        </div>

        {tab === 'general' ? (
          <TabGeneral bodega={bodega} puedeEditar={puedeEditar} onActualizado={onActualizado} />
        ) : (
          <TabProductos bodega={bodega} puedeEditar={puedeEditar} />
        )}

        <BigButton variant="secondary" size="md" fullWidth className="mt-7" onClick={onClose}>
          Cerrar
        </BigButton>
      </AppCard>
    </div>
  )
}

function TabGeneral({
  bodega,
  puedeEditar,
  onActualizado,
}: {
  bodega: BodegaAdmin
  puedeEditar: boolean
  onActualizado: () => void
}) {
  const [nombre, setNombre] = useState(bodega.nombre)
  const [nombreMsg, setNombreMsg] = useState<Mensaje>(null)
  const [guardandoNombre, setGuardandoNombre] = useState(false)

  const [lider, setLider] = useState<{ id: string; nombre: string } | null | undefined>(undefined)
  const [candidatosLider, setCandidatosLider] = useState<{ id: string; nombre: string }[]>([])
  const [liderSeleccionado, setLiderSeleccionado] = useState('')
  const [liderMsg, setLiderMsg] = useState<Mensaje>(null)
  const [guardandoLider, setGuardandoLider] = useState(false)

  const [operarios, setOperarios] = useState<{ principal?: { id: string; nombre: string }; revisor?: { id: string; nombre: string } } | null>(null)
  const [candidatosOperario, setCandidatosOperario] = useState<{ id: string; nombre: string }[]>([])
  const [principalSel, setPrincipalSel] = useState('')
  const [revisorSel, setRevisorSel] = useState('')
  const [operariosMsg, setOperariosMsg] = useState<Mensaje>(null)
  const [guardandoOperarios, setGuardandoOperarios] = useState(false)

  useEffect(() => {
    getLiderDeSede(bodega.siteId).then((l) => {
      setLider(l)
      setLiderSeleccionado(l?.id ?? '')
    })
    if (puedeEditar) listarCandidatosLider().then(setCandidatosLider)
    getOperariosDeBodega(bodega.id).then((o) => {
      setOperarios(o)
      setPrincipalSel(o.principal?.id ?? '')
      setRevisorSel(o.revisor?.id ?? '')
    })
    if (puedeEditar) listarOperariosDisponibles(bodega.siteId).then(setCandidatosOperario)
  }, [bodega.id, bodega.siteId, puedeEditar])

  const guardarNombre = async () => {
    if (!nombre.trim()) {
      setNombreMsg({ tipo: 'error', texto: 'El nombre no puede estar vacío' })
      return
    }
    setGuardandoNombre(true)
    try {
      await renombrarBodega(bodega.id, nombre.trim())
      setNombreMsg({ tipo: 'ok', texto: 'Nombre actualizado' })
      onActualizado()
    } catch (e) {
      setNombreMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setGuardandoNombre(false)
    }
  }

  const guardarLider = async () => {
    if (!liderSeleccionado) return
    setGuardandoLider(true)
    try {
      await asignarLiderDeSede(bodega.siteId, liderSeleccionado)
      setLiderMsg({ tipo: 'ok', texto: 'Líder de la sede actualizado' })
      const l = await getLiderDeSede(bodega.siteId)
      setLider(l)
    } catch (e) {
      setLiderMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setGuardandoLider(false)
    }
  }

  const guardarOperarios = async () => {
    setGuardandoOperarios(true)
    setOperariosMsg(null)
    try {
      await asignarOperariosDeBodega(bodega.id, principalSel || null, revisorSel || null)
      setOperariosMsg({ tipo: 'ok', texto: 'Operarios guardados' })
      onActualizado()
    } catch (e) {
      setOperariosMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally {
      setGuardandoOperarios(false)
    }
  }

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">Nombre de la bodega</h3>
        {puedeEditar ? (
          <div className="flex gap-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="h-14 flex-1 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
            />
            <BigButton variant="blue" size="md" disabled={guardandoNombre} onClick={guardarNombre}>
              Guardar
            </BigButton>
          </div>
        ) : (
          <p className="text-lg font-semibold text-[color:var(--color-graphite)]">{bodega.nombre}</p>
        )}
        {nombreMsg && (
          <p className={`mt-2 text-sm font-semibold ${nombreMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
            {nombreMsg.texto}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-1 font-bold text-[color:var(--color-graphite)]">Líder de la sede</h3>
        <p className="mb-2 text-sm text-[color:var(--color-graphite-60)]">
          Aplica a todas las bodegas de {bodega.siteNombre}
        </p>
        {puedeEditar ? (
          <div className="flex gap-3">
            <select
              value={liderSeleccionado}
              onChange={(e) => setLiderSeleccionado(e.target.value)}
              className="h-14 flex-1 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
            >
              <option value="">Sin asignar</option>
              {candidatosLider.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
            <BigButton variant="blue" size="md" disabled={guardandoLider || !liderSeleccionado} onClick={guardarLider}>
              Guardar
            </BigButton>
          </div>
        ) : (
          <p className="text-lg font-semibold text-[color:var(--color-graphite)]">
            {lider === undefined ? 'Cargando…' : (lider?.nombre ?? 'Sin asignar')}
          </p>
        )}
        {liderMsg && (
          <p className={`mt-2 text-sm font-semibold ${liderMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
            {liderMsg.texto}
          </p>
        )}
      </div>

      <div>
        <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">Operarios</h3>
        {puedeEditar ? (
          <div className="flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-[color:var(--color-graphite-60)]">Principal</label>
              <select
                value={principalSel}
                onChange={(e) => setPrincipalSel(e.target.value)}
                className="h-14 w-full rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
              >
                <option value="">Sin asignar</option>
                {candidatosOperario.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-[color:var(--color-graphite-60)]">Secundario</label>
              <select
                value={revisorSel}
                onChange={(e) => setRevisorSel(e.target.value)}
                className="h-14 w-full rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
              >
                <option value="">Sin asignar</option>
                {candidatosOperario.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <BigButton variant="blue" size="md" disabled={guardandoOperarios} onClick={guardarOperarios}>
              Guardar operarios
            </BigButton>
          </div>
        ) : (
          <div className="flex flex-col gap-1 text-lg font-semibold text-[color:var(--color-graphite)]">
            <p>Principal: {operarios?.principal?.nombre ?? 'Sin asignar'}</p>
            <p>Secundario: {operarios?.revisor?.nombre ?? 'Sin asignar'}</p>
          </div>
        )}
        {operariosMsg && (
          <p className={`mt-2 text-sm font-semibold ${operariosMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
            {operariosMsg.texto}
          </p>
        )}
      </div>
    </div>
  )
}

function TabProductos({ bodega, puedeEditar }: { bodega: BodegaAdmin; puedeEditar: boolean }) {
  const [productos, setProductos] = useState<ProductoBodega[] | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState<ProductoCatalogo[]>([])
  const [buscando, setBuscando] = useState(false)
  const [cargandoExcel, setCargandoExcel] = useState(false)
  const [resumenCarga, setResumenCarga] = useState<ResultadoCarga | null>(null)
  const [msg, setMsg] = useState<Mensaje>(null)

  const cargar = () => {
    listarProductosDeBodega(bodega.id).then(setProductos)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodega.id])

  useEffect(() => {
    if (!puedeEditar || !busqueda.trim()) {
      setResultados([])
      return
    }
    let cancelado = false
    setBuscando(true)
    buscarProductosCatalogo(busqueda).then((r) => {
      if (!cancelado) {
        setResultados(r)
        setBuscando(false)
      }
    })
    return () => {
      cancelado = true
    }
  }, [busqueda, puedeEditar])

  const agregar = async (productId: string) => {
    try {
      await agregarProductoABodega(bodega.id, productId)
      setBusqueda('')
      setResultados([])
      cargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo agregar' })
    }
  }

  const quitar = async (productId: string) => {
    try {
      await quitarProductoDeBodega(bodega.id, productId)
      cargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo quitar' })
    }
  }

  const subirExcel = async (file: File) => {
    setCargandoExcel(true)
    setResumenCarga(null)
    setMsg(null)
    try {
      const resultado = await cargarProductosDesdeExcel(bodega.id, file)
      setResumenCarga(resultado)
      cargar()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo cargar el archivo' })
    } finally {
      setCargandoExcel(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {puedeEditar && (
        <div className="flex flex-wrap gap-3">
          <BigButton variant="secondary" size="md" icon={<Download size={18} />} onClick={descargarPlantillaProductos}>
            Descargar plantilla
          </BigButton>
          <label className="inline-flex h-[52px] cursor-pointer items-center gap-2 rounded-xl bg-[#ECEDF0] px-4 text-sm font-bold text-[color:var(--color-graphite)] no-select">
            <Upload size={18} />
            {cargandoExcel ? 'Cargando…' : 'Subir Excel'}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              disabled={cargandoExcel}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void subirExcel(file)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      )}

      {resumenCarga && (
        <div className="rounded-xl border border-[#E7E8EC] p-4">
          <p className="font-semibold text-[color:var(--color-success)]">{resumenCarga.cargados} producto(s) vinculado(s)</p>
          {resumenCarga.noEncontrados.length > 0 && (
            <>
              <p className="mt-2 font-semibold text-[color:var(--color-danger)]">
                {resumenCarga.noEncontrados.length} no encontrado(s) en el catálogo:
              </p>
              <p className="text-sm text-[color:var(--color-graphite-60)]">{resumenCarga.noEncontrados.join(', ')}</p>
            </>
          )}
        </div>
      )}

      {puedeEditar && (
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-graphite-60)]" />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar producto del catálogo para vincular…"
            className="h-12 w-full rounded-xl border border-[#D8D9DD] bg-white pl-11 pr-4 text-base outline-none focus:border-[color:var(--color-brand-blue)]"
          />
          {buscando && <p className="mt-1 text-sm text-[color:var(--color-graphite-60)]">Buscando…</p>}
          {resultados.length > 0 && (
            <div className="mt-2 flex flex-col gap-2 rounded-xl border border-[#E7E8EC] p-2">
              {resultados.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-black/5">
                  <span className="text-sm font-semibold text-[color:var(--color-graphite)]">
                    {p.nombre} {p.sku ? `· ${p.sku}` : ''}
                  </span>
                  <button
                    onClick={() => agregar(p.id)}
                    className="rounded-full bg-[color:var(--color-brand-blue)] px-3 py-1 text-xs font-bold text-white"
                  >
                    Agregar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {msg && (
        <p className={`text-sm font-semibold ${msg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
          {msg.texto}
        </p>
      )}

      <div>
        <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">
          Productos de esta bodega {productos ? `(${productos.length})` : ''}
        </h3>
        {productos === null ? (
          <p className="text-[color:var(--color-graphite-60)]">Cargando…</p>
        ) : productos.length === 0 ? (
          <p className="text-[color:var(--color-graphite-60)]">Sin productos vinculados todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {productos.map((p) => (
              <div key={p.productId} className="flex items-center justify-between rounded-xl border border-[#E7E8EC] px-4 py-3">
                <div>
                  <p className="font-semibold text-[color:var(--color-graphite)]">{p.nombre}</p>
                  <p className="text-sm text-[color:var(--color-graphite-60)]">
                    {p.sku ?? 'Sin código'} · {p.unidad} · Stock: {p.currentStock}
                  </p>
                </div>
                {puedeEditar && (
                  <button
                    onClick={() => quitar(p.productId)}
                    className="rounded-full p-2 text-[color:var(--color-danger)] hover:bg-black/5"
                    aria-label="Quitar"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
