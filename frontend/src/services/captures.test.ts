import { describe, it, expect } from 'vitest'
import { construirReporte } from './captures'
import { validarCaptura } from '../lib/validation'
import { getProductoById } from '../data/mock/productos'
import type { Captura } from '../types/domain'

function captura(productoId: string, cantidad: number, esNovedad = false): Captura {
  return {
    id: `c-${productoId}`,
    cicloId: 'ciclo-2026-07-31',
    productoId,
    bodegaId: 'b-almacen-sumin',
    zonaId: 'z-almacen-sumin-aseo',
    sesionId: 's-test',
    operarioId: 'op-1',
    cantidad,
    unidad: 'Unidad',
    metodoIdentificacion: 'ruta',
    metodoCaptura: 'voz',
    esNovedad,
    timestamp: '2026-07-25T10:00:00.000Z',
  }
}

describe('construirReporte — contado vs sistema', () => {
  it('calcula la diferencia = contado − sd', () => {
    const araganSd = getProductoById('p-001')!.sd // 24
    const filas = construirReporte([captura('p-001', 30)])
    expect(filas).toHaveLength(1)
    expect(filas[0].sistema).toBe(araganSd)
    expect(filas[0].contado).toBe(30)
    expect(filas[0].diferencia).toBe(30 - araganSd)
  })
  it('diferencia negativa cuando se cuenta menos que el sistema', () => {
    const filas = construirReporte([captura('p-001', 10)])
    expect(filas[0].diferencia).toBeLessThan(0)
  })
})

describe('validarCaptura — reglas de negocio', () => {
  const aragan = getProductoById('p-001')! // Unidad, histórico ~24
  const agua = getProductoById('p-014')! // AGUA BOTELLON, Unidad, sd 109.0065

  it('bloquea negativos', () => {
    expect(validarCaptura(-5, aragan).tipo).toBe('bloqueada')
  })
  it('decimal en "Unidad" pide confirmación', () => {
    expect(validarCaptura(109.0065, agua).tipo).toBe('confirmar_decimal')
  })
  it('valor dentro de la banda histórica → ok', () => {
    expect(validarCaptura(24, aragan).tipo).toBe('ok')
  })
  it('valor muy alto → atípico con referencia', () => {
    const v = validarCaptura(900, aragan)
    expect(v.tipo).toBe('atipico')
    if (v.tipo === 'atipico') expect(v.referencia).toBeGreaterThan(0)
  })
  it('confianza STT baja → repetir', () => {
    expect(validarCaptura(24, aragan, 0.4).tipo).toBe('repetir')
  })
})
