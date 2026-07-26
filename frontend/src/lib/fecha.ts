const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

/** Último día del mes actual como fecha del ciclo. Ej: "31 de julio". */
export function fechaCicloTexto(hoy: Date = new Date()): string {
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  return `${ultimo.getDate()} de ${MESES[ultimo.getMonth()]}`
}

/** Fecha del ciclo en formato de archivo. Ej: "2026-07-31". */
export function fechaCicloISO(hoy: Date = new Date()): string {
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  const mm = String(ultimo.getMonth() + 1).padStart(2, '0')
  const dd = String(ultimo.getDate()).padStart(2, '0')
  return `${ultimo.getFullYear()}-${mm}-${dd}`
}

/** Minutos transcurridos desde una marca ISO. */
export function minutosDesde(iso: string, ahora: Date = new Date()): number {
  const t = new Date(iso).getTime()
  return Math.max(0, Math.round((ahora.getTime() - t) / 60000))
}

// ---- Fechas de ciclo (a partir de una fecha ISO "YYYY-MM-DD", sin depender del reloj) ----

/** "2026-07-31" → "31 de julio" (o "31 de julio 2026" con año). */
export function formatFechaLarga(iso: string, conAnio = false): string {
  const [y, m, d] = iso.split('-').map(Number)
  const txt = `${d} de ${MESES[m - 1]}`
  return conAnio ? `${txt} ${y}` : txt
}

/** Último día del mes siguiente al del ciclo dado. "2026-07-31" → "2026-08-31". */
export function proximaFechaCiclo(iso: string): string {
  const [y, m] = iso.split('-').map(Number) // m: 1..12
  const next = new Date(y, m + 1, 0) // día 0 del mes (m+2) = último día del mes (m+1)
  const mm = String(next.getMonth() + 1).padStart(2, '0')
  const dd = String(next.getDate()).padStart(2, '0')
  return `${next.getFullYear()}-${mm}-${dd}`
}

/** ID de ciclo a partir de su fecha. */
export function cicloIdDeFecha(iso: string): string {
  return `ciclo-${iso}`
}
