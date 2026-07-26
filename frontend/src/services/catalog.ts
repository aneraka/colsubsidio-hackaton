import type { Bodega, Producto, Zona } from '../types/domain'
import { BODEGAS } from '../data/mock/bodegas'
import { getZonasDeBodega } from '../data/mock/zonas'
import { PRODUCTOS, getProductosDeZona as getProductosDeZonaMock } from '../data/mock/productos'
import { normalizar } from '../lib/texto'

/**
 * Catálogo — hoy resuelve desde mock con latencia simulada.
 * // TODO(backend): reemplazar cada función por un select de Supabase (misma interfaz).
 */

const latencia = <T>(valor: T, ms = 80 + Math.random() * 70): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms))

export function getBodegas(): Promise<Bodega[]> {
  // TODO(backend): supabase.from('bodegas').select()
  return latencia(BODEGAS)
}

export function getZonas(bodegaId: string): Promise<Zona[]> {
  // TODO(backend): supabase.from('zonas').select().eq('bodega_id', bodegaId)
  return latencia(getZonasDeBodega(bodegaId))
}

export function getProductosDeZona(zonaId: string): Promise<Producto[]> {
  // TODO(backend): supabase.from('catalogo_items').select().eq('zona_id', zonaId).order('orden_ruta')
  return latencia(getProductosDeZonaMock(zonaId))
}

export function getPorCodigo(nrArticulo: string): Promise<Producto | null> {
  // TODO(backend): supabase.from('catalogo_items').select().eq('nr_articulo', nrArticulo).maybeSingle()
  const limpio = nrArticulo.trim()
  const p = PRODUCTOS.find((x) => x.nrArticulo === limpio) ?? null
  return latencia(p)
}

// ---------- Búsqueda fuzzy propia (sin librerías) ----------

function score(query: string, producto: Producto, zonaActual?: string): number {
  const q = normalizar(query)
  if (!q) return 0
  const nombre = normalizar(producto.nombre)
  const qTokens = q.split(' ')
  const nTokens = nombre.split(' ')

  let s = 0
  if (nombre.includes(q)) s += 6 // subcadena completa
  for (const qt of qTokens) {
    if (qt.length < 2) continue
    if (nTokens.some((nt) => nt === qt)) s += 3 // token exacto
    else if (nTokens.some((nt) => nt.startsWith(qt))) s += 2 // prefijo
    else if (nombre.includes(qt)) s += 1 // subcadena parcial
  }
  // El bono de zona solo prioriza entre coincidencias reales (no crea falsos positivos).
  if (s > 0 && zonaActual && producto.zonaId === zonaActual) s += 1.5
  return s
}

export function buscarPorNombre(query: string, zonaId?: string): Promise<Producto[]> {
  // TODO(backend): usar full-text search de Postgres (websearch_to_tsquery) manteniendo esta interfaz
  const resultados = PRODUCTOS.map((p) => ({ p, s: score(query, p, zonaId) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.p)
  return latencia(resultados)
}
