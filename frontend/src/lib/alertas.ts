import type { Alerta, Captura } from '../types/domain'
import { getProductoById } from '../data/mock/productos'
import { referenciaHistorica } from './validation'

/**
 * Deriva las alertas de auditoría a partir de las capturas del ciclo activo (sin duplicar datos):
 * - atípico confirmado (esNovedad por hold-to-confirm)
 * - decimal en unidad "Unidad"
 * - producto con stock del sistema (sd) negativo → requiere reconciliación
 */
export function getAlertas(capturas: Captura[]): Alerta[] {
  const alertas: Alerta[] = []
  for (const c of capturas) {
    const p = getProductoById(c.productoId)
    if (!p) continue
    const base = {
      productoId: p.id,
      productoNombre: p.nombre,
      bodegaId: c.bodegaId,
      zonaId: c.zonaId,
      cantidad: c.cantidad,
      operarioId: c.operarioId,
      timestamp: c.timestamp,
    }
    const esDecimal = p.unidad === 'Unidad' && !Number.isInteger(c.cantidad)
    if (esDecimal) {
      alertas.push({ id: `al-${c.id}-decimal`, tipo: 'decimal', ...base })
    } else if (c.esNovedad) {
      alertas.push({ id: `al-${c.id}-atipico`, tipo: 'atipico', referencia: referenciaHistorica(p), ...base })
    }
    if (p.sd < 0) {
      alertas.push({ id: `al-${c.id}-sdneg`, tipo: 'sd_negativo', ...base })
    }
  }
  // recientes primero
  return alertas.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

export function textoAlerta(a: Alerta): string {
  switch (a.tipo) {
    case 'atipico':
      return `Atípico confirmado: ${a.productoNombre} — contado ${a.cantidad}, histórico ≈ ${a.referencia}`
    case 'decimal':
      return `Decimal en unidad entera: ${a.productoNombre} = ${String(a.cantidad).replace('.', ',')}`
    case 'sd_negativo':
      return `Stock del sistema negativo: ${a.productoNombre} — requiere reconciliación`
  }
}
