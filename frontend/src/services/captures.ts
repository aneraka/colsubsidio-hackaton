import type { Captura, FilaReporte } from '../types/domain'
import { getProductoById } from '../data/mock/productos'

/**
 * Persistencia de capturas — hoy en localStorage (base offline de la demo).
 * // TODO(backend): reemplazar por insert/select en Supabase (tabla capturas + RLS por operario).
 */

const KEY = 'agente-inventario-capturas-v1'

function leer(): Captura[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Captura[]) : []
  } catch {
    return []
  }
}

function escribir(capturas: Captura[]): void {
  localStorage.setItem(KEY, JSON.stringify(capturas))
}

export async function guardarCaptura(c: Captura): Promise<Captura> {
  // TODO(backend): supabase.from('capturas').insert(c)
  const todas = leer()
  // una captura por producto+sesión: reemplaza si ya existía (reconteo)
  const idx = todas.findIndex((x) => x.sesionId === c.sesionId && x.productoId === c.productoId)
  if (idx >= 0) todas[idx] = c
  else todas.push(c)
  escribir(todas)
  return c
}

export async function getCapturasSesion(sesionId: string): Promise<Captura[]> {
  // TODO(backend): supabase.from('capturas').select().eq('sesion_id', sesionId)
  return leer().filter((c) => c.sesionId === sesionId)
}

/** Función pura: arma el reporte contado vs sistema (diferencia = contado − sd). */
export function construirReporte(capturas: Captura[]): FilaReporte[] {
  const filas: FilaReporte[] = []
  for (const c of capturas) {
    const producto = getProductoById(c.productoId)
    if (!producto) continue
    filas.push({
      producto,
      contado: c.cantidad,
      sistema: producto.sd,
      diferencia: Math.round((c.cantidad - producto.sd) * 10000) / 10000,
      esNovedad: c.esNovedad,
    })
  }
  return filas
}

/** Reporte contado vs sistema de una sesión (lee las capturas persistidas). */
export async function getReporteSesion(sesionId: string): Promise<FilaReporte[]> {
  return construirReporte(await getCapturasSesion(sesionId))
}

export function limpiarCapturas(): void {
  localStorage.removeItem(KEY)
}
