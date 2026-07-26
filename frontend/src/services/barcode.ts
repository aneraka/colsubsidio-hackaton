import type { Producto } from '../types/domain'
import { BARCODES_MOCK } from '../data/mock/barcodes'
import { getProductoById } from '../data/mock/productos'

/**
 * Mapeo código de barras ↔ artículo. Mock + enrolamiento persistido en localStorage
 * (para que un EAN aprendido en la demo siga funcionando al reescanearlo).
 * // TODO(backend): tabla `barcodes` compartida en Supabase.
 */

const KEY = 'agente-inventario-barcodes-v1'

function leerEnrolados(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

const latencia = <T>(valor: T, ms = 90): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(valor), ms))

export function resolverBarcode(ean: string): Promise<Producto | null> {
  // TODO(backend): supabase.from('barcodes').select('producto_id').eq('ean', ean).maybeSingle()
  const enrolados = leerEnrolados()
  const productoId = enrolados[ean] ?? BARCODES_MOCK[ean]
  return latencia(productoId ? (getProductoById(productoId) ?? null) : null)
}

export async function enrolarBarcode(ean: string, productoId: string): Promise<void> {
  // TODO(backend): supabase.from('barcodes').upsert({ ean, producto_id: productoId })
  const enrolados = leerEnrolados()
  enrolados[ean] = productoId
  localStorage.setItem(KEY, JSON.stringify(enrolados))
}
