import type { Bodega } from '../../types/domain'

// Las 8 bodegas reales del insumo (Piscilago) con sus totales de artículos.
export const BODEGAS: Bodega[] = [
  { id: 'b-almacen-sumin', nombre: 'STOCK ALMACEN SUMINISTROS', nombreCorto: 'Almacén Suministros', totalArticulos: 298 },
  { id: 'b-almacen-ayb', nombre: 'STOCK ALMACEN AYB', nombreCorto: 'Almacén AyB', totalArticulos: 272 },
  { id: 'b-rest-fuentes-ayb', nombre: 'STOCK RESTAURANTE FUENTES AYB', nombreCorto: 'Rest. Fuentes AyB', totalArticulos: 346 },
  { id: 'b-rest-fuentes-sumin', nombre: 'STOCK RESTAURANTE FUENTES SUMIN', nombreCorto: 'Rest. Fuentes Suministros', totalArticulos: 135 },
  { id: 'b-kiosco-taquilla', nombre: 'STOCK KIOSCO TAQUILLA AYB', nombreCorto: 'Kiosco Taquilla AyB', totalArticulos: 60 },
  { id: 'b-kiosco-piscigiros', nombre: 'STOCK KIOSCO PISCIGIROS AYB', nombreCorto: 'Kiosco Piscigiros AyB', totalArticulos: 58 },
  { id: 'b-zoologico', nombre: 'ZOOLOGICO', nombreCorto: 'Zoológico', totalArticulos: 57 },
  { id: 'b-zoologico-sumin', nombre: 'ZOOLOGICO SUMINISTROS', nombreCorto: 'Zoológico Suministros', totalArticulos: 195 },
]

export const getBodegaById = (id: string): Bodega | undefined => BODEGAS.find((b) => b.id === id)
