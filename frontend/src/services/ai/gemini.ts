import type { Producto, ResultadoInterprete, Unidad } from '../../types/domain'
import { parseLocal } from './localParser'

/**
 * El cerebro del agente. Con VITE_GEMINI_API_KEY hace la llamada REAL a Gemini;
 * sin key, cae automáticamente al parser local. La demo funciona sin key y, al
 * pegar la key en .env, funciona con IA sin tocar una línea de las pantallas.
 */

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY ?? ''
const MODEL = import.meta.env.VITE_GEMINI_MODEL ?? 'gemini-2.0-flash'

/** ¿Hay key de Gemini configurada? (para mostrar un badge "IA activa" en dev). */
export function geminiActivo(): boolean {
  return API_KEY.trim().length > 0
}

const UNIDAD_ES: Record<Unidad, string> = { Unidad: 'unidades', Kilogram: 'kilogramos', Liter: 'litros' }

function fallback(frase: string): ResultadoInterprete {
  return parseLocal(frase) ?? { tipo: 'no_entendido', confianza: 0 }
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tipo: { type: 'string', enum: ['cantidad', 'incremento', 'comando', 'no_entendido'] },
    cantidad: { type: 'number' },
    expresion: { type: 'string' },
    comando: { type: 'string', enum: ['recontar', 'corregir', 'estado', 'guardar'] },
    confianza: { type: 'number' },
  },
  required: ['tipo', 'confianza'],
}

export async function interpretarConteo(frase: string, producto: Producto): Promise<ResultadoInterprete> {
  if (!geminiActivo()) {
    console.info('[gemini] sin API key — usando parser local')
    return fallback(frase)
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`
  const prompt = [
    'Eres un intérprete de conteos de inventario en español colombiano.',
    `Producto: "${producto.nombre}". Unidad de medida: ${UNIDAD_ES[producto.unidad]}.`,
    'Recibes lo que dijo el operario y devuelves SOLO el JSON del esquema.',
    'Reglas: nunca cantidades negativas; respeta la unidad; detecta comandos',
    '(recontar, corregir/borrar, estado="¿en cuánto voy?", guardar/listo);',
    'calcula la aritmética natural ("dos cajas de doce y cinco sueltas" = 2×12+5=29)',
    'y muestra la operación en "expresion". Si no entiendes, tipo="no_entendido".',
    `Frase del operario: "${frase}"`,
  ].join(' ')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 4000)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    })
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Respuesta vacía de Gemini')
    const parsed = JSON.parse(text) as ResultadoInterprete
    // Blindaje de las reglas de negocio: nunca negativos.
    if (parsed.cantidad !== undefined && parsed.cantidad < 0) parsed.cantidad = Math.abs(parsed.cantidad)
    return parsed
  } catch (err) {
    console.warn('[gemini] fallo o timeout — usando parser local', err)
    return fallback(frase)
  } finally {
    clearTimeout(timeout)
  }
}
