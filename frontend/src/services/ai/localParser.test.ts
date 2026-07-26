import { describe, it, expect } from 'vitest'
import { parseLocal } from './localParser'

describe('parseLocal — números simples', () => {
  it('"doce" → 12', () => {
    const r = parseLocal('doce')
    expect(r?.tipo).toBe('cantidad')
    expect(r?.cantidad).toBe(12)
  })
  it('"novecientos cincuenta" → 950', () => {
    expect(parseLocal('novecientos cincuenta')?.cantidad).toBe(950)
  })
  it('dígitos "137" → 137', () => {
    expect(parseLocal('137')?.cantidad).toBe(137)
  })
  it('"ciento cincuenta" → 150', () => {
    expect(parseLocal('ciento cincuenta')?.cantidad).toBe(150)
  })
  it('"dos mil" → 2000', () => {
    expect(parseLocal('dos mil')?.cantidad).toBe(2000)
  })
})

describe('parseLocal — aritmética natural', () => {
  it('"dos cajas de doce y cinco sueltas" → 29 con expresión', () => {
    const r = parseLocal('dos cajas de doce y cinco sueltas')
    expect(r?.cantidad).toBe(29)
    expect(r?.expresion).toBe('2 × 12 + 5 = 29')
  })
  it('"tres cajas de veinticuatro" → 72', () => {
    const r = parseLocal('tres cajas de veinticuatro')
    expect(r?.cantidad).toBe(72)
    expect(r?.expresion).toBe('3 × 24 = 72')
  })
  it('"dos docenas" → 24', () => {
    expect(parseLocal('dos docenas')?.cantidad).toBe(24)
  })
  it('dígitos "4 paquetes de 6 y 3 sueltos" → 27', () => {
    expect(parseLocal('4 paquetes de 6 y 3 sueltos')?.cantidad).toBe(27)
  })
})

describe('parseLocal — decimales y fracciones', () => {
  it('"tres litros y medio" → 3.5', () => {
    expect(parseLocal('tres litros y medio')?.cantidad).toBe(3.5)
  })
  it('"ocho kilos trescientos" → 8.3', () => {
    expect(parseLocal('ocho kilos trescientos')?.cantidad).toBe(8.3)
  })
  it('"novecientas cincuenta porciones y media" → 950.5', () => {
    expect(parseLocal('novecientas cincuenta porciones y media')?.cantidad).toBe(950.5)
  })
  it('"medio" → 0.5', () => {
    expect(parseLocal('medio')?.cantidad).toBe(0.5)
  })
  it('"tres cuartos" → 0.75', () => {
    expect(parseLocal('tres cuartos')?.cantidad).toBe(0.75)
  })
})

describe('parseLocal — comandos', () => {
  it('"recontar" → comando recontar', () => {
    const r = parseLocal('recontar')
    expect(r?.tipo).toBe('comando')
    expect(r?.comando).toBe('recontar')
  })
  it('"borra eso" → comando corregir', () => {
    expect(parseLocal('borra eso')?.comando).toBe('corregir')
  })
  it('"¿en cuánto voy?" → comando estado', () => {
    expect(parseLocal('¿en cuánto voy?')?.comando).toBe('estado')
  })
  it('"listo guardar" → comando guardar', () => {
    expect(parseLocal('listo guardar')?.comando).toBe('guardar')
  })
})

describe('parseLocal — incremento y no entendido', () => {
  it('"otro" → incremento', () => {
    expect(parseLocal('otro')?.tipo).toBe('incremento')
  })
  it('frase sin número → no_entendido', () => {
    expect(parseLocal('hola qué tal')?.tipo).toBe('no_entendido')
  })
  it('nunca produce negativos', () => {
    const r = parseLocal('menos cinco')
    // "cinco" se interpreta como 5 (nunca negativo)
    expect((r?.cantidad ?? 0) >= 0).toBe(true)
  })
})
