import * as XLSX from 'xlsx'
import type { Captura } from '../types/domain'
import { BODEGAS, getBodegaById } from '../data/mock/bodegas'
import { getProductoById } from '../data/mock/productos'

/**
 * Generación del archivo final del ERP (REAL desde ya). Columnas EXACTAS:
 *   CANTIDAD | Nr.Artículo | Artículo | Unidad | SD
 * donde CANTIDAD es el consecutivo de fila y SD es la cantidad contada.
 * Una hoja por bodega contada (nombre de hoja = nombre de la bodega, ≤31 chars).
 */

interface FilaExcel {
  CANTIDAD: number
  'Nr.Artículo': string
  Artículo: string
  Unidad: string
  SD: number
}

function agruparPorBodega(capturas: Captura[]): Map<string, Captura[]> {
  const mapa = new Map<string, Captura[]>()
  for (const c of capturas) {
    const arr = mapa.get(c.bodegaId) ?? []
    arr.push(c)
    mapa.set(c.bodegaId, arr)
  }
  return mapa
}

function filasDeBodega(capturas: Captura[]): FilaExcel[] {
  return capturas.map((c, i) => {
    const p = getProductoById(c.productoId)
    return {
      CANTIDAD: i + 1,
      'Nr.Artículo': p?.nrArticulo ?? '',
      Artículo: p?.nombre ?? c.productoId,
      Unidad: p?.unidad ?? c.unidad,
      SD: c.cantidad,
    }
  })
}

function nombreHoja(bodegaId: string): string {
  const nombre = getBodegaById(bodegaId)?.nombre ?? bodegaId
  // Excel limita a 31 chars y prohíbe : \ / ? * [ ]
  return nombre.replace(/[:\\/?*[\]]/g, ' ').slice(0, 31)
}

export function construirLibro(capturas: Captura[]): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const porBodega = agruparPorBodega(capturas)

  // Respeta el orden oficial de las bodegas
  const idsOrdenadas = BODEGAS.map((b) => b.id).filter((id) => porBodega.has(id))
  for (const bodegaId of idsOrdenadas) {
    const filas = filasDeBodega(porBodega.get(bodegaId)!)
    const ws = XLSX.utils.json_to_sheet(filas, {
      header: ['CANTIDAD', 'Nr.Artículo', 'Artículo', 'Unidad', 'SD'],
    })
    ws['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 42 }, { wch: 12 }, { wch: 12 }]
    XLSX.utils.book_append_sheet(wb, ws, nombreHoja(bodegaId))
  }
  return wb
}

/** Genera y descarga el .xlsx del inventario físico. */
export function generarArchivoConteo(capturas: Captura[], fechaCiclo: string): void {
  const wb = construirLibro(capturas)
  const nombreArchivo = `INVENTARIO_FISICO_${fechaCiclo}.xlsx`
  XLSX.writeFile(wb, nombreArchivo)
}

/** Alternativa: descarga un CSV de la primera bodega contada. */
export function generarCSV(capturas: Captura[], fechaCiclo: string): void {
  const wb = construirLibro(capturas)
  const primeraHoja = wb.SheetNames[0]
  if (!primeraHoja) return
  const csv = XLSX.utils.sheet_to_csv(wb.Sheets[primeraHoja])
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `INVENTARIO_FISICO_${fechaCiclo}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
