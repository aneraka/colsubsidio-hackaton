import * as XLSX from 'xlsx'
import { supabase } from './supabase'
import { normalizar } from '../lib/texto'

/**
 * Gestión de productos (admin/super_admin editan; líder/operario ven en solo lectura) — real
 * contra Supabase, catálogo global (tabla products + categories). No hay borrado: un producto
 * se INHABILITA (active=false) en vez de eliminarse, para no perder vínculos/historial ya
 * existentes en warehouse_products/inventory_logs.
 */

export interface ProductoAdmin {
  id: string
  nombre: string
  sku: string | null
  codigoBarras: string | null
  unidad: string
  costoPorUnidad: number
  categoriaId: string | null
  categoriaNombre: string | null
  activo: boolean
}

export interface Categoria {
  id: string
  nombre: string
}

export async function listarCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase.from('categories').select('id, name').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((c) => ({ id: c.id, nombre: c.name }))
}

export async function listarProductosAdmin(): Promise<ProductoAdmin[]> {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, codigo_barras, unit, cost_per_unit, category_id, active, categories(name)')
    .order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => {
    const categoria = Array.isArray(p.categories) ? p.categories[0] : p.categories
    return {
      id: p.id,
      nombre: p.name,
      sku: p.sku,
      codigoBarras: p.codigo_barras,
      unidad: p.unit,
      costoPorUnidad: p.cost_per_unit,
      categoriaId: p.category_id,
      categoriaNombre: categoria?.name ?? null,
      activo: p.active,
    }
  })
}

export interface DatosProducto {
  nombre: string
  categoriaId: string | null
  unidad: string
  costoPorUnidad: number
  sku: string | null
  codigoBarras: string | null
}

export async function crearProducto(datos: DatosProducto): Promise<void> {
  const { error } = await supabase.from('products').insert({
    name: datos.nombre,
    category_id: datos.categoriaId,
    unit: datos.unidad,
    cost_per_unit: datos.costoPorUnidad,
    sku: datos.sku || null,
    codigo_barras: datos.codigoBarras || null,
  })
  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un producto con ese SKU o código de barras')
    throw new Error(error.message)
  }
}

export async function actualizarProducto(id: string, datos: DatosProducto): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({
      name: datos.nombre,
      category_id: datos.categoriaId,
      unit: datos.unidad,
      cost_per_unit: datos.costoPorUnidad,
      sku: datos.sku || null,
      codigo_barras: datos.codigoBarras || null,
    })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') throw new Error('Ya existe un producto con ese SKU o código de barras')
    throw new Error(error.message)
  }
}

export async function cambiarActivoProducto(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from('products').update({ active: activo }).eq('id', id)
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------------------
// Carga masiva del catálogo por Excel
// ---------------------------------------------------------------------------

const UNIDADES_VALIDAS = ['Unidad', 'Kilogram', 'Liter'] as const
const COLUMNAS_PLANTILLA = ['Nr.Artículo', 'Artículo', 'Unidad', 'Categoría', 'Costo', 'Código de barras']

/** Descarga la plantilla .xlsx para el cargue masivo de productos del catálogo. */
export function descargarPlantillaCatalogo(): void {
  const ejemplo = [
    {
      'Nr.Artículo': '95006025',
      Artículo: 'ARAGAN MEDIANO 51 CMS C/PALO',
      Unidad: 'Unidad',
      Categoría: 'Aseo',
      Costo: 12500,
      'Código de barras': '7701234567890',
    },
    {
      'Nr.Artículo': '',
      Artículo: 'AGUA BOTELLON',
      Unidad: 'Liter',
      Categoría: 'Bebidas',
      Costo: 9800,
      'Código de barras': '',
    },
  ]
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_PLANTILLA })
  ws['!cols'] = [{ wch: 14 }, { wch: 42 }, { wch: 12 }, { wch: 18 }, { wch: 12 }, { wch: 20 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.writeFile(wb, 'plantilla_catalogo_productos.xlsx')
}

interface FilaCatalogo {
  'Nr.Artículo'?: string | number
  Artículo?: string
  Unidad?: string
  Categoría?: string
  Costo?: number | string
  'Código de barras'?: string | number
}

export interface FilaOmitida {
  fila: number
  articulo: string
  razon: string
}

export interface ResultadoCargaCatalogo {
  creados: number
  omitidos: FilaOmitida[]
  categoriasCreadas: string[]
}

const texto = (v: unknown): string => (v === undefined || v === null ? '' : String(v).trim())

/** Normaliza la unidad a una de las tres válidas; devuelve null si no coincide. */
function unidadCanonica(valor: string): string | null {
  const n = normalizar(valor)
  return UNIDADES_VALIDAS.find((u) => normalizar(u) === n) ?? null
}

/**
 * Crea productos del catálogo global desde un Excel con las columnas de la plantilla.
 * Reglas:
 *  - `Artículo` y `Unidad` son obligatorios; unidad debe ser Unidad/Kilogram/Liter.
 *  - Nunca sobrescribe: si el SKU o el código de barras ya existe (en la base o repetido
 *    dentro del propio archivo), la fila se omite y se reporta.
 *  - Las categorías que no existan se crean automáticamente (no hay otra forma de crearlas
 *    hoy) y se reportan de vuelta para que el cambio no sea silencioso.
 */
export async function cargarCatalogoDesdeExcel(file: File): Promise<ResultadoCargaCatalogo> {
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })
  const primeraHoja = wb.SheetNames[0]
  if (!primeraHoja) return { creados: 0, omitidos: [], categoriasCreadas: [] }
  const filas = XLSX.utils.sheet_to_json<FilaCatalogo>(wb.Sheets[primeraHoja])
  if (filas.length === 0) return { creados: 0, omitidos: [], categoriasCreadas: [] }

  // Estado actual de la base para detectar duplicados (los índices únicos son sobre lower()).
  // El nombre también cuenta: ~260 artículos reales no tienen Nr.Artículo, así que sin esto
  // volver a subir el mismo archivo los duplicaría en silencio.
  const { data: existentes, error: errExistentes } = await supabase
    .from('products')
    .select('name, sku, codigo_barras')
  if (errExistentes) throw new Error(errExistentes.message)
  const skusUsados = new Set<string>()
  const barrasUsados = new Set<string>()
  const nombresUsados = new Set<string>()
  for (const p of existentes ?? []) {
    if (p.sku) skusUsados.add(normalizar(p.sku))
    if (p.codigo_barras) barrasUsados.add(normalizar(p.codigo_barras))
    nombresUsados.add(normalizar(p.name))
  }

  const categorias = await listarCategorias()
  const categoriaPorNombre = new Map(categorias.map((c) => [normalizar(c.nombre), c.id]))

  const omitidos: FilaOmitida[] = []
  const nuevas: { nombre: string; categoriaNombre: string; unidad: string; costo: number; sku: string; barras: string }[] = []
  const categoriasFaltantes = new Map<string, string>() // normalizado -> nombre original

  filas.forEach((fila, i) => {
    const numeroFila = i + 2 // +1 por el encabezado, +1 porque Excel empieza en 1
    const nombre = texto(fila['Artículo'])
    const sku = texto(fila['Nr.Artículo'])
    const barras = texto(fila['Código de barras'])
    const etiqueta = nombre || sku || '(sin nombre)'

    if (!nombre) {
      omitidos.push({ fila: numeroFila, articulo: etiqueta, razon: 'Falta el nombre del artículo' })
      return
    }
    const unidad = unidadCanonica(texto(fila.Unidad))
    if (!unidad) {
      omitidos.push({
        fila: numeroFila,
        articulo: etiqueta,
        razon: `Unidad inválida (usa ${UNIDADES_VALIDAS.join(', ')})`,
      })
      return
    }
    if (sku && skusUsados.has(normalizar(sku))) {
      omitidos.push({ fila: numeroFila, articulo: etiqueta, razon: `El Nr.Artículo ${sku} ya existe` })
      return
    }
    if (barras && barrasUsados.has(normalizar(barras))) {
      omitidos.push({ fila: numeroFila, articulo: etiqueta, razon: `El código de barras ${barras} ya existe` })
      return
    }
    if (nombresUsados.has(normalizar(nombre))) {
      omitidos.push({ fila: numeroFila, articulo: etiqueta, razon: 'Ya existe un producto con ese nombre' })
      return
    }

    // Reserva los códigos/nombre para que un duplicado dentro del mismo archivo también se detecte.
    if (sku) skusUsados.add(normalizar(sku))
    if (barras) barrasUsados.add(normalizar(barras))
    nombresUsados.add(normalizar(nombre))

    const categoriaNombre = texto(fila.Categoría)
    if (categoriaNombre && !categoriaPorNombre.has(normalizar(categoriaNombre))) {
      categoriasFaltantes.set(normalizar(categoriaNombre), categoriaNombre)
    }

    const costoCrudo = Number(fila.Costo)
    nuevas.push({
      nombre,
      categoriaNombre,
      unidad,
      costo: Number.isFinite(costoCrudo) ? costoCrudo : 0,
      sku,
      barras,
    })
  })

  // Crea las categorías nuevas antes de insertar los productos que las referencian.
  const categoriasCreadas: string[] = []
  if (categoriasFaltantes.size > 0) {
    const aCrear = [...categoriasFaltantes.values()]
    const { data: creadas, error: errCat } = await supabase
      .from('categories')
      .insert(aCrear.map((name) => ({ name })))
      .select('id, name')
    if (errCat) throw new Error(errCat.message)
    for (const c of creadas ?? []) {
      categoriaPorNombre.set(normalizar(c.name), c.id)
      categoriasCreadas.push(c.name)
    }
  }

  if (nuevas.length === 0) return { creados: 0, omitidos, categoriasCreadas }

  const { error: errInsert } = await supabase.from('products').insert(
    nuevas.map((n) => ({
      name: n.nombre,
      category_id: n.categoriaNombre ? (categoriaPorNombre.get(normalizar(n.categoriaNombre)) ?? null) : null,
      unit: n.unidad,
      cost_per_unit: n.costo,
      sku: n.sku || null,
      codigo_barras: n.barras || null,
    })),
  )
  if (errInsert) throw new Error(errInsert.message)

  return { creados: nuevas.length, omitidos, categoriasCreadas }
}

export function filtrarProductos(productos: ProductoAdmin[], query: string, soloActivos: boolean): ProductoAdmin[] {
  const q = normalizar(query)
  return productos.filter((p) => {
    if (soloActivos && !p.activo) return false
    if (!q) return true
    return normalizar(p.nombre).includes(q) || (p.sku && normalizar(p.sku).includes(q))
  })
}
