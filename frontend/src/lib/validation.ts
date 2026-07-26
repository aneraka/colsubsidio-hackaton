import type { Producto } from '../types/domain'

/**
 * Validación local de una captura (SIN IA). Implementa las reglas de negocio
 * críticas de CLAUDE.md antes de guardar.
 */

export type Validacion =
  | { tipo: 'ok' }
  | { tipo: 'bloqueada' } // negativo — la UI nunca debería permitir llegar aquí
  | { tipo: 'confirmar_decimal' } // decimal en unidad "Unidad" (ej. AGUA BOTELLON 109,0065)
  | { tipo: 'atipico'; referencia: number } // fuera de la banda histórica
  | { tipo: 'repetir' } // confianza del STT demasiado baja

export function promedioHistorico(producto: Producto): number {
  const h = producto.historico.filter((v) => v > 0)
  if (h.length === 0) return 0
  return h.reduce((a, b) => a + b, 0) / h.length
}

/**
 * Referencia histórica para atípicos: el conteo del último ciclo cerrado (junio),
 * que existe archivado. Si no hay, cae al promedio de los ciclos previos.
 */
export function referenciaHistorica(producto: Producto): number {
  const h = producto.historico.filter((v) => v > 0)
  if (h.length === 0) return 0
  const junio = h[h.length - 1] // último ciclo archivado
  return Math.round(junio)
}

export function validarCaptura(
  cantidad: number,
  producto: Producto,
  confianza = 1,
): Validacion {
  if (cantidad < 0) return { tipo: 'bloqueada' }

  const esDecimal = !Number.isInteger(cantidad)
  if (esDecimal && producto.unidad === 'Unidad') return { tipo: 'confirmar_decimal' }

  if (confianza < 0.6) return { tipo: 'repetir' }

  const ref = referenciaHistorica(producto)
  if (ref > 0) {
    if (cantidad < ref * 0.5 || cantidad > ref * 1.5) {
      return { tipo: 'atipico', referencia: ref }
    }
  }

  return { tipo: 'ok' }
}
