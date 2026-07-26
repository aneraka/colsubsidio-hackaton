import type { Unidad } from '../types/domain'

/** Traduce la unidad del catálogo (inglés del ERP) a la etiqueta en español para la UI. */
export function unidadLabel(u: Unidad): string {
  switch (u) {
    case 'Unidad':
      return 'UNIDAD'
    case 'Kilogram':
      return 'KILOGRAMO'
    case 'Liter':
      return 'LITRO'
  }
}

/** Forma en plural minúscula para frases: "unidades" / "kilogramos" / "litros". */
export function unidadPlural(u: Unidad): string {
  switch (u) {
    case 'Unidad':
      return 'unidades'
    case 'Kilogram':
      return 'kilogramos'
    case 'Liter':
      return 'litros'
  }
}
