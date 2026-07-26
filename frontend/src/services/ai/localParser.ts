import type { ResultadoInterprete } from '../../types/domain'

/**
 * Parser de conteos en español SIN IA. Sirve de fallback de Gemini y de validador.
 * Resuelve: números en palabras/dígitos, decimales, fracciones, aritmética natural
 * ("N cajas de M y K sueltas"), comandos y conteo incremental.
 */

const UNITS: Record<string, number> = {
  cero: 0, un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6,
  siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14,
  quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19,
  veinte: 20, veintiuno: 21, veintiuna: 21, veintidos: 22, veintitres: 23,
  veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27,
  veintiocho: 28, veintinueve: 29, treinta: 30, cuarenta: 40, cincuenta: 50,
  sesenta: 60, setenta: 70, ochenta: 80, noventa: 90,
}

const HUNDREDS: Record<string, number> = {
  cien: 100, ciento: 100, doscientos: 200, doscientas: 200, trescientos: 300,
  trescientas: 300, cuatrocientos: 400, cuatrocientas: 400, quinientos: 500,
  quinientas: 500, seiscientos: 600, seiscientas: 600, setecientos: 700,
  setecientas: 700, ochocientos: 800, ochocientas: 800, novecientos: 900, novecientas: 900,
}

const UNIT_WORDS = new Set(['kilo', 'kilos', 'kilogramo', 'kilogramos', 'litro', 'litros', 'gramo', 'gramos'])
const CONTAINERS = new Set(['caja', 'cajas', 'paquete', 'paquetes', 'bolsa', 'bolsas', 'canasta', 'canastas', 'paca', 'pacas', 'docena', 'docenas'])

function normalizar(frase: string): string {
  return frase
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Convierte una secuencia de tokens (palabras o dígitos) a número. null si no hay número. */
function wordsToNumber(tokens: string[]): number | null {
  let total = 0
  let current = 0
  let found = false
  for (const tok of tokens) {
    if (/^\d+$/.test(tok)) {
      current += parseInt(tok, 10)
      found = true
    } else if (tok in HUNDREDS) {
      current += HUNDREDS[tok]
      found = true
    } else if (tok in UNITS) {
      current += UNITS[tok]
      found = true
    } else if (tok === 'mil') {
      current = (current === 0 ? 1 : current) * 1000
      total += current
      current = 0
      found = true
    } else if (tok === 'millon' || tok === 'millones') {
      total += (current === 0 ? 1 : current) * 1_000_000
      current = 0
      found = true
    }
    // 'y' y palabras desconocidas se ignoran
  }
  if (!found) return null
  return total + current
}

/** Detecta fracción explícita en la frase: medio/media/cuarto/tres cuartos. */
function detectarFraccion(norm: string): number {
  if (/tres\s+cuartos/.test(norm)) return 0.75
  if (/(un\s+)?cuarto/.test(norm)) return 0.25
  if (/\bmedi[oa]\b/.test(norm)) return 0.5
  return 0
}

/** Quita las palabras que forman la fracción para no sumarlas dos veces al número base. */
function quitarFraccion(norm: string, fraccion: number): string {
  if (fraccion === 0.75) return norm.replace(/tres\s+cuartos/g, ' ')
  if (fraccion === 0.25) return norm.replace(/(un\s+)?cuarto/g, ' ')
  if (fraccion === 0.5) return norm.replace(/\b(y\s+)?medi[oa]\b/g, ' ')
  return norm
}

const OK = 0.9

export function parseLocal(frase: string): ResultadoInterprete | null {
  const norm = normalizar(frase)
  if (!norm) return null
  const tokens = norm.split(' ')

  // ---- 1. Comandos ----
  if (/\b(recontar|recuenta|recuento|vuelve a contar|de nuevo)\b/.test(norm))
    return { tipo: 'comando', comando: 'recontar', confianza: OK }
  if (/\b(corrige|corregir|borra|borrar|limpia|limpiar|error)\b/.test(norm))
    return { tipo: 'comando', comando: 'corregir', confianza: OK }
  if (/(voy en|en cuanto voy|cuanto voy|cuanto llevo|cuantos llevo|cuanto va)/.test(norm))
    return { tipo: 'comando', comando: 'estado', confianza: OK }
  if (/\b(guardar|guarda|listo|confirmar|confirma|siguiente producto)\b/.test(norm))
    return { tipo: 'comando', comando: 'guardar', confianza: OK }

  // ---- 2. Conteo incremental (sumar 1) ----
  if (/^(mas|otro|otra|siguiente|uno mas|mas uno|suma uno|mas 1|1 mas)$/.test(norm))
    return { tipo: 'incremento', confianza: OK }

  // ---- 3. Aritmética natural: "N cajas de M (y K sueltas)" ----
  const containerIdx = tokens.findIndex((t) => CONTAINERS.has(t))
  if (containerIdx >= 0) {
    const container = tokens[containerIdx]
    const esDocena = container === 'docena' || container === 'docenas'
    const n = wordsToNumber(tokens.slice(0, containerIdx)) ?? 1
    const deIdx = tokens.indexOf('de', containerIdx)

    if (esDocena && deIdx < 0) {
      const total = n * 12
      return { tipo: 'cantidad', cantidad: total, expresion: `${n} × 12 = ${total}`, confianza: OK }
    }

    if (deIdx >= 0) {
      // busca conector para las "sueltas"
      let connIdx = -1
      for (let i = deIdx + 1; i < tokens.length; i++) {
        if (tokens[i] === 'y' || tokens[i] === 'mas' || tokens[i] === 'sueltas' || tokens[i] === 'sueltos') {
          connIdx = i
          break
        }
      }
      const m = wordsToNumber(tokens.slice(deIdx + 1, connIdx < 0 ? undefined : connIdx))
      if (m !== null) {
        const k = connIdx >= 0 ? (wordsToNumber(tokens.slice(connIdx + 1)) ?? 0) : 0
        const total = n * m + k
        const expresion = k > 0 ? `${n} × ${m} + ${k} = ${total}` : `${n} × ${m} = ${total}`
        return { tipo: 'cantidad', cantidad: total, expresion, confianza: OK }
      }
    }
  }

  // ---- 4. Decimales con unidad de peso/volumen: "ocho kilos trescientos" ----
  const uIdx = tokens.findIndex((t) => UNIT_WORDS.has(t))
  const fraccion = detectarFraccion(norm)
  if (uIdx >= 0) {
    const entero = wordsToNumber(tokens.slice(0, uIdx)) ?? 0
    const resto = tokens.slice(uIdx + 1)
    if (fraccion > 0) {
      const total = redondear(entero + fraccion)
      return { tipo: 'cantidad', cantidad: total, confianza: OK }
    }
    const gramos = wordsToNumber(resto)
    if (gramos !== null && gramos > 0 && gramos < 1000) {
      const total = redondear(entero + gramos / 1000)
      return { tipo: 'cantidad', cantidad: total, confianza: OK }
    }
    if (entero > 0 || tokens.length === 1) {
      return { tipo: 'cantidad', cantidad: entero, confianza: OK }
    }
  }

  // ---- 5. Número simple (palabras o dígitos) + fracción opcional ----
  const tokensBase = fraccion > 0 ? quitarFraccion(norm, fraccion).split(' ').filter(Boolean) : tokens
  const base = wordsToNumber(tokensBase)
  if (base !== null) {
    const total = redondear(base + fraccion)
    return { tipo: 'cantidad', cantidad: total, confianza: OK }
  }
  if (fraccion > 0) {
    return { tipo: 'cantidad', cantidad: fraccion, confianza: OK }
  }

  // ---- 6. No entendido ----
  return { tipo: 'no_entendido', confianza: 0 }
}

function redondear(n: number): number {
  return Math.round(n * 10000) / 10000
}
