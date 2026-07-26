import type { Captura, CicloConteo, ResumenCiclo } from '../../types/domain'
import { PRODUCTOS, getProductosDeBodega } from './productos'
import { BODEGAS } from './bodegas'

/**
 * Ciclos de conteo CERRADOS (historia de la demo): 30 abr, 31 may, 30 jun 2026.
 * Las capturas de cada ciclo se derivan del `historico` de cada producto
 * (historico[0]=abril, [1]=mayo, [2]=junio), de modo que la validación de atípicos
 * ("el mes pasado hubo ≈ N") apunta a un conteo REAL archivado del 30 de junio.
 * Seed fija para reproducibilidad.
 */

function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const OPERARIOS_MOCK = ['OP-1042', 'OP-2088'] // Juan P., Sandra M.

interface CicloSpec {
  fecha: string
  idxHistorico: 0 | 1 | 2
  fraccion: number // % del catálogo contado (junio = 1 para que toda referencia exista)
  duracionMin: number
  seed: number
}

const SPECS: CicloSpec[] = [
  { fecha: '2026-04-30', idxHistorico: 0, fraccion: 0.84, duracionMin: 49, seed: 4040 },
  { fecha: '2026-05-31', idxHistorico: 1, fraccion: 0.9, duracionMin: 54, seed: 5050 },
  { fecha: '2026-06-30', idxHistorico: 2, fraccion: 1, duracionMin: 52, seed: 6060 },
]

function generarCapturas(spec: CicloSpec): Captura[] {
  const cicloId = `ciclo-${spec.fecha}`
  const rnd = seeded(spec.seed)
  const capturas: Captura[] = []
  let n = 0
  for (const p of PRODUCTOS) {
    const incluir = spec.fraccion >= 1 || rnd() < spec.fraccion
    if (!incluir) continue
    const base = p.historico[spec.idxHistorico] ?? Math.abs(p.sd)
    const cantidad = p.unidad === 'Unidad' ? Math.round(base) : Math.round(base * 100) / 100
    const esNovedad = rnd() < 0.06
    n++
    capturas.push({
      id: `cap-${cicloId}-${p.id}`,
      cicloId,
      productoId: p.id,
      bodegaId: p.bodegaId,
      zonaId: p.zonaId,
      sesionId: `s-${cicloId}-${p.bodegaId}`,
      operarioId: OPERARIOS_MOCK[n % OPERARIOS_MOCK.length],
      cantidad,
      unidad: p.unidad,
      metodoIdentificacion: 'ruta',
      metodoCaptura: rnd() < 0.7 ? 'voz' : 'teclado',
      esNovedad,
      timestamp: `${spec.fecha}T${String(8 + (n % 8)).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}:00.000Z`,
    })
  }
  return capturas
}

function resumen(spec: CicloSpec, capturas: Captura[]): ResumenCiclo {
  const capturados = new Set(capturas.map((c) => c.productoId))
  const bodegasCompletas = BODEGAS.filter((b) => {
    const prods = getProductosDeBodega(b.id)
    return prods.length > 0 && prods.every((p) => capturados.has(p.id))
  }).length
  const operarios = [...new Set(capturas.map((c) => c.operarioId))].map((id) =>
    id === 'OP-1042' ? 'Juan P.' : id === 'OP-2088' ? 'Sandra M.' : id,
  )
  return {
    articulosContados: capturas.length,
    articulosTotales: PRODUCTOS.length,
    novedades: capturas.filter((c) => c.esNovedad).length,
    bodegasCompletas,
    operarios,
    duracionMin: spec.duracionMin,
  }
}

export const CICLOS_CERRADOS: CicloConteo[] = SPECS.map((spec) => {
  const capturas = generarCapturas(spec)
  return {
    id: `ciclo-${spec.fecha}`,
    fecha: spec.fecha,
    estado: 'cerrado' as const,
    cerradoEn: `${spec.fecha}T18:00:00.000Z`,
    cerradoPor: 'Viviana R.',
    resumen: resumen(spec, capturas),
    capturas,
  }
})
