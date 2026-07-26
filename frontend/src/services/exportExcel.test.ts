import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import { construirLibro } from './exportExcel'
import type { Captura } from '../types/domain'

function cap(productoId: string, bodegaId: string, cantidad: number): Captura {
  return {
    id: `c-${productoId}`,
    cicloId: 'ciclo-2026-07-31',
    productoId,
    bodegaId,
    zonaId: 'z',
    sesionId: 's',
    operarioId: 'op-1',
    cantidad,
    unidad: 'Unidad',
    metodoIdentificacion: 'ruta',
    metodoCaptura: 'voz',
    esNovedad: false,
    timestamp: '2026-07-25T10:00:00.000Z',
  }
}

describe('exportExcel — estructura del libro', () => {
  const wb = construirLibro([
    cap('p-001', 'b-almacen-sumin', 24), // Almacén Suministros
    cap('p-014', 'b-almacen-sumin', 109.0065),
    cap('p-029', 'b-almacen-ayb', 80), // Almacén AyB
  ])

  it('crea una hoja por bodega contada, con el nombre de la bodega', () => {
    expect(wb.SheetNames).toContain('STOCK ALMACEN SUMINISTROS')
    expect(wb.SheetNames).toContain('STOCK ALMACEN AYB')
    expect(wb.SheetNames).toHaveLength(2)
  })

  it('usa las columnas exactas CANTIDAD, Nr.Artículo, Artículo, Unidad, SD', () => {
    const ws = wb.Sheets['STOCK ALMACEN SUMINISTROS']
    const filas = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)
    expect(Object.keys(filas[0])).toEqual(['CANTIDAD', 'Nr.Artículo', 'Artículo', 'Unidad', 'SD'])
    // CANTIDAD = consecutivo de fila; SD = cantidad contada
    expect(filas[0].CANTIDAD).toBe(1)
    expect(filas[0].SD).toBe(24)
    expect(filas[1].SD).toBe(109.0065)
  })
})
