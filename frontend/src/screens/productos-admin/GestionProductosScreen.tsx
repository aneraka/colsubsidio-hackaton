import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Download, Upload } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { puedeEditarProductos } from '../../lib/permisos'
import {
  listarProductosAdmin,
  listarCategorias,
  crearProducto,
  actualizarProducto,
  cambiarActivoProducto,
  filtrarProductos,
  descargarPlantillaCatalogo,
  cargarCatalogoDesdeExcel,
  type ProductoAdmin,
  type Categoria,
  type DatosProducto,
  type ResultadoCargaCatalogo,
} from '../../services/productos'
import { AppCard, BigButton, ListRow, TopBar } from '../../components/ui'

type Mensaje = { tipo: 'ok' | 'error'; texto: string } | null
const UNIDADES = ['Unidad', 'Kilogram', 'Liter'] as const

export function GestionProductosScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const puedeEditar = puedeEditarProductos(usuario)

  const [productos, setProductos] = useState<ProductoAdmin[] | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [seleccionado, setSeleccionado] = useState<ProductoAdmin | null>(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [cargandoExcel, setCargandoExcel] = useState(false)
  const [resumenCarga, setResumenCarga] = useState<ResultadoCargaCatalogo | null>(null)
  const [errorCarga, setErrorCarga] = useState('')

  const cargar = () => {
    listarProductosAdmin().then(setProductos)
  }

  useEffect(() => {
    cargar()
    listarCategorias().then(setCategorias)
  }, [])

  const subirExcel = async (file: File) => {
    setCargandoExcel(true)
    setResumenCarga(null)
    setErrorCarga('')
    try {
      const resultado = await cargarCatalogoDesdeExcel(file)
      setResumenCarga(resultado)
      cargar()
      listarCategorias().then(setCategorias)
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : 'No se pudo cargar el archivo')
    } finally {
      setCargandoExcel(false)
    }
  }

  const filtrados = useMemo(() => {
    if (!productos) return null
    return filtrarProductos(productos, busqueda, soloActivos)
  }, [productos, busqueda, soloActivos])

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title="Gestión de productos"
        onBack={() => navigate('/inicio')}
        backLabel="Inicio"
        right={
          puedeEditar ? (
            <BigButton variant="blue" size="md" icon={<Plus size={20} />} onClick={() => setCrearAbierto(true)}>
              Crear producto
            </BigButton>
          ) : undefined
        }
      />

      <div className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto p-6">
        {puedeEditar && (
          <div className="mb-4 flex flex-wrap gap-3">
            <BigButton variant="secondary" size="md" icon={<Download size={18} />} onClick={descargarPlantillaCatalogo}>
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

        {errorCarga && (
          <p className="mb-4 text-sm font-semibold text-[color:var(--color-danger)]">{errorCarga}</p>
        )}

        {resumenCarga && (
          <div className="mb-4 rounded-xl border border-[#E7E8EC] p-4">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-[color:var(--color-success)]">
                {resumenCarga.creados} producto(s) creado(s)
              </p>
              <button
                onClick={() => setResumenCarga(null)}
                className="rounded-full p-1 hover:bg-black/5"
                aria-label="Cerrar resumen"
              >
                <X size={18} />
              </button>
            </div>

            {resumenCarga.categoriasCreadas.length > 0 && (
              <p className="mt-2 text-sm text-[color:var(--color-graphite-60)]">
                Categorías creadas: {resumenCarga.categoriasCreadas.join(', ')}
              </p>
            )}

            {resumenCarga.omitidos.length > 0 && (
              <>
                <p className="mt-3 font-semibold text-[color:var(--color-danger)]">
                  {resumenCarga.omitidos.length} fila(s) omitida(s):
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {resumenCarga.omitidos.map((o) => (
                    <li key={o.fila} className="text-sm text-[color:var(--color-graphite-60)]">
                      Fila {o.fila} · {o.articulo} — {o.razon}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )}

        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="mb-3 h-14 w-full rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
        />
        <button
          onClick={() => setSoloActivos((v) => !v)}
          className="mb-4 rounded-full px-4 py-2 text-sm font-bold no-select"
          style={
            soloActivos
              ? { background: 'var(--color-brand-blue)', color: '#fff' }
              : { background: '#ECEDF0', color: 'var(--color-graphite-60)' }
          }
        >
          {soloActivos ? 'Mostrando solo activos' : 'Mostrando todos'}
        </button>

        {productos === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(filtrados ?? []).map((p) => (
              <ListRow
                key={p.id}
                title={p.nombre}
                subtitle={`${p.sku ?? 'Sin código'} · ${p.categoriaNombre ?? 'Sin categoría'}`}
                right={
                  !p.activo ? (
                    <span className="text-sm font-bold text-[color:var(--color-graphite-60)]">Inhabilitado</span>
                  ) : undefined
                }
                onClick={() => setSeleccionado(p)}
              />
            ))}
          </div>
        )}
      </div>

      {seleccionado && (
        <DetalleProductoDialog
          producto={seleccionado}
          categorias={categorias}
          puedeEditar={puedeEditar}
          onClose={() => setSeleccionado(null)}
          onActualizado={cargar}
        />
      )}

      {crearAbierto && (
        <CrearProductoDialog
          categorias={categorias}
          onClose={() => setCrearAbierto(false)}
          onCreado={() => {
            setCrearAbierto(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function FormularioProducto({
  datos,
  setDatos,
  categorias,
  disabled,
}: {
  datos: DatosProducto
  setDatos: (d: DatosProducto) => void
  categorias: Categoria[]
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      <input
        value={datos.nombre}
        onChange={(e) => setDatos({ ...datos, nombre: e.target.value })}
        placeholder="Nombre del producto"
        disabled={disabled}
        className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)] disabled:opacity-60"
      />
      <select
        value={datos.categoriaId ?? ''}
        onChange={(e) => setDatos({ ...datos, categoriaId: e.target.value || null })}
        disabled={disabled}
        className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)] disabled:opacity-60"
      >
        <option value="">Sin categoría</option>
        {categorias.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nombre}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        {UNIDADES.map((u) => (
          <button
            key={u}
            type="button"
            disabled={disabled}
            onClick={() => setDatos({ ...datos, unidad: u })}
            className="flex-1 rounded-xl px-3 py-3 text-sm font-bold no-select disabled:opacity-60"
            style={
              datos.unidad === u
                ? { background: 'var(--color-brand-blue)', color: '#fff' }
                : { background: '#ECEDF0', color: 'var(--color-graphite-60)' }
            }
          >
            {u}
          </button>
        ))}
      </div>
      <input
        type="number"
        step="0.01"
        value={datos.costoPorUnidad}
        onChange={(e) => setDatos({ ...datos, costoPorUnidad: Number(e.target.value) })}
        placeholder="Costo por unidad"
        disabled={disabled}
        className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)] disabled:opacity-60"
      />
      <input
        value={datos.sku ?? ''}
        onChange={(e) => setDatos({ ...datos, sku: e.target.value })}
        placeholder="Nr.Artículo / SKU (opcional)"
        disabled={disabled}
        className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)] disabled:opacity-60"
      />
      <input
        value={datos.codigoBarras ?? ''}
        onChange={(e) => setDatos({ ...datos, codigoBarras: e.target.value })}
        placeholder="Código de barras (opcional)"
        disabled={disabled}
        className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)] disabled:opacity-60"
      />
    </div>
  )
}

function DetalleProductoDialog({
  producto,
  categorias,
  puedeEditar,
  onClose,
  onActualizado,
}: {
  producto: ProductoAdmin
  categorias: Categoria[]
  puedeEditar: boolean
  onClose: () => void
  onActualizado: () => void
}) {
  const [datos, setDatos] = useState<DatosProducto>({
    nombre: producto.nombre,
    categoriaId: producto.categoriaId,
    unidad: producto.unidad,
    costoPorUnidad: producto.costoPorUnidad,
    sku: producto.sku,
    codigoBarras: producto.codigoBarras,
  })
  const [msg, setMsg] = useState<Mensaje>(null)
  const [guardando, setGuardando] = useState(false)
  const [cambiandoActivo, setCambiandoActivo] = useState(false)

  const guardar = async () => {
    if (!datos.nombre.trim()) {
      setMsg({ tipo: 'error', texto: 'El nombre no puede estar vacío' })
      return
    }
    setGuardando(true)
    try {
      await actualizarProducto(producto.id, datos)
      setMsg({ tipo: 'ok', texto: 'Producto actualizado' })
      onActualizado()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setGuardando(false)
    }
  }

  const toggleActivo = async () => {
    setCambiandoActivo(true)
    try {
      await cambiarActivoProducto(producto.id, !producto.activo)
      onActualizado()
      onClose()
    } catch (e) {
      setMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setCambiandoActivo(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <AppCard
        radius={24}
        padding="p-8"
        className="max-h-[85vh] w-[520px] max-w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">{producto.nombre}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-black/5" aria-label="Cerrar">
            <X size={22} />
          </button>
        </div>

        {!producto.activo && (
          <p className="mb-4 rounded-lg bg-[#ECEDF0] px-3 py-2 text-sm font-semibold text-[color:var(--color-graphite-60)]">
            Este producto está inhabilitado.
          </p>
        )}

        <FormularioProducto datos={datos} setDatos={setDatos} categorias={categorias} disabled={!puedeEditar} />

        {msg && (
          <p className={`mt-3 text-sm font-semibold ${msg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>
            {msg.texto}
          </p>
        )}

        {puedeEditar && (
          <div className="mt-6 flex flex-col gap-3">
            <BigButton variant="blue" size="md" fullWidth disabled={guardando} onClick={guardar}>
              Guardar
            </BigButton>
            <BigButton
              variant="secondary"
              size="md"
              fullWidth
              disabled={cambiandoActivo}
              onClick={toggleActivo}
            >
              {producto.activo ? 'Inhabilitar producto' : 'Habilitar producto'}
            </BigButton>
          </div>
        )}

        <BigButton variant="secondary" size="md" fullWidth className="mt-4" onClick={onClose}>
          Cerrar
        </BigButton>
      </AppCard>
    </div>
  )
}

function CrearProductoDialog({
  categorias,
  onClose,
  onCreado,
}: {
  categorias: Categoria[]
  onClose: () => void
  onCreado: () => void
}) {
  const [datos, setDatos] = useState<DatosProducto>({
    nombre: '',
    categoriaId: null,
    unidad: 'Unidad',
    costoPorUnidad: 0,
    sku: '',
    codigoBarras: '',
  })
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const crear = async () => {
    if (!datos.nombre.trim()) {
      setError('El nombre es obligatorio')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await crearProducto(datos)
      onCreado()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el producto')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <AppCard radius={24} padding="p-8" className="w-[520px] max-w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-5 text-2xl font-extrabold text-[color:var(--color-graphite)]">Crear producto</h2>
        <FormularioProducto datos={datos} setDatos={setDatos} categorias={categorias} disabled={false} />
        {error && <p className="mt-3 text-sm font-semibold text-[color:var(--color-danger)]">{error}</p>}
        <div className="mt-6 flex gap-4">
          <BigButton variant="blue" size="md" fullWidth disabled={guardando} onClick={crear}>
            Crear
          </BigButton>
          <BigButton variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancelar
          </BigButton>
        </div>
      </AppCard>
    </div>
  )
}
