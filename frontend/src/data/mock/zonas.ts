import type { Zona } from '../../types/domain'
import { BODEGAS } from './bodegas'

// Zonas por bodega, con `orden` para la ruta guiada.
const ZONAS_POR_BODEGA: Record<string, string[]> = {
  'b-almacen-sumin': ['Aseo', 'Cocina', 'Bebidas', 'Abarrotes', 'Congelados'],
  'b-almacen-ayb': ['Abarrotes', 'Bebidas', 'Congelados', 'Lácteos', 'Desechables'],
  'b-rest-fuentes-ayb': ['Cocina', 'Bebidas', 'Congelados', 'Postres'],
  'b-rest-fuentes-sumin': ['Aseo', 'Empaques', 'Utensilios'],
  'b-kiosco-taquilla': ['Snacks', 'Bebidas', 'Helados'],
  'b-kiosco-piscigiros': ['Snacks', 'Bebidas'],
  'b-zoologico': ['Alimento animal', 'Aseo'],
  'b-zoologico-sumin': ['Alimento animal', 'Aseo', 'Empaques'],
}

function slug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
}

export const ZONAS: Zona[] = BODEGAS.flatMap((b) =>
  (ZONAS_POR_BODEGA[b.id] ?? ['General']).map((nombre, i) => ({
    id: `z-${b.id.replace('b-', '')}-${slug(nombre)}`,
    bodegaId: b.id,
    nombre,
    orden: i + 1,
  })),
)

export const getZonasDeBodega = (bodegaId: string): Zona[] =>
  ZONAS.filter((z) => z.bodegaId === bodegaId).sort((a, b) => a.orden - b.orden)

export const getZonaById = (id: string): Zona | undefined => ZONAS.find((z) => z.id === id)
