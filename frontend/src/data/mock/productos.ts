import type { Producto, Unidad } from '../../types/domain'
import { BODEGAS } from './bodegas'
import { getZonasDeBodega } from './zonas'

/**
 * Catálogo mock (~50 productos) con nombres estilo ERP real, repartidos por bodega/zona.
 * `historico` se genera con una semilla fija para que la demo sea reproducible.
 */

// Generador pseudoaleatorio determinista (mulberry32) — semilla fija.
function seeded(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Spec {
  nrArticulo: string | null
  nombre: string
  unidad: Unidad
  bodegaId: string
  zona: string // nombre de zona
  sd: number
}

// b = Almacén Suministros zonas: Aseo, Cocina, Bebidas, Abarrotes, Congelados
const SUM = 'b-almacen-sumin'
const AYB = 'b-almacen-ayb'
const FUENTES = 'b-rest-fuentes-ayb'
const ZOO = 'b-zoologico-sumin'

const SPECS: Spec[] = [
  // ---- Almacén Suministros · Aseo (la ruta de la demo) ----
  { nrArticulo: '95006025', nombre: 'ARAGAN MEDIANO 51 CMS C/PALO', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 24 },
  { nrArticulo: '95006031', nombre: 'ALCOHOL GLICERINADO 500ML CON VALVULA', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 40 },
  { nrArticulo: '95006040', nombre: 'JABON LIQUIDO MANOS GALON', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 18 },
  { nrArticulo: null, nombre: 'ESCOBA CERDA SUAVE', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 12 },
  { nrArticulo: '95006058', nombre: 'BOLSA BASURA NEGRA 55X60 PAQ', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 65 },
  { nrArticulo: null, nombre: 'GUANTES NITRILO CAJA X100', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 30 },
  { nrArticulo: '95006072', nombre: 'HIPOCLORITO 5% GALON', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 22 },
  { nrArticulo: '95006089', nombre: 'TOALLA MANOS ROLLO INSTITUCIONAL', unidad: 'Unidad', bodegaId: SUM, zona: 'Aseo', sd: 48 },

  // ---- Almacén Suministros · Cocina ----
  { nrArticulo: '84001', nombre: 'ACEITE GIRASOL 20L', unidad: 'Liter', bodegaId: SUM, zona: 'Cocina', sd: 15 },
  { nrArticulo: '84010', nombre: 'SAL REFINADA 25KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Cocina', sd: 8 },
  { nrArticulo: '84022', nombre: 'AZUCAR BLANCA 50KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Cocina', sd: 12 },
  { nrArticulo: null, nombre: 'PANELA PASTILLA BLOQUE', unidad: 'Unidad', bodegaId: SUM, zona: 'Cocina', sd: 40 },
  { nrArticulo: '84045', nombre: 'HARINA DE TRIGO 25KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Cocina', sd: 10 },

  // ---- Almacén Suministros · Bebidas ----
  { nrArticulo: '84120', nombre: 'AGUA BOTELLON', unidad: 'Unidad', bodegaId: SUM, zona: 'Bebidas', sd: 109.0065 },
  { nrArticulo: '84130', nombre: 'GASEOSA COLA 1.5L SIXPACK', unidad: 'Unidad', bodegaId: SUM, zona: 'Bebidas', sd: 55 },
  { nrArticulo: '84138', nombre: 'JUGO CAJA SURTIDO 200ML', unidad: 'Unidad', bodegaId: SUM, zona: 'Bebidas', sd: 220 },
  { nrArticulo: '84142', nombre: 'AGUA BOTELLA 600ML PAQ X24', unidad: 'Unidad', bodegaId: SUM, zona: 'Bebidas', sd: 48 },

  // ---- Almacén Suministros · Abarrotes (arroz para desambiguar) ----
  { nrArticulo: '84120b', nombre: 'ARROZ BLANCO x 500G', unidad: 'Unidad', bodegaId: SUM, zona: 'Abarrotes', sd: 140 },
  { nrArticulo: '84131', nombre: 'ARROZ DOÑA PEPA x 1KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Abarrotes', sd: 90 },
  { nrArticulo: '84150', nombre: 'ARROZ INTEGRAL x 500G', unidad: 'Unidad', bodegaId: SUM, zona: 'Abarrotes', sd: 60 },
  { nrArticulo: '84160', nombre: 'LENTEJA BULTO 25KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Abarrotes', sd: 6 },
  { nrArticulo: '84165', nombre: 'FRIJOL CARGAMANTO 25KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Abarrotes', sd: 5 },
  { nrArticulo: null, nombre: 'PASTA ESPAGUETI 500G PAQ', unidad: 'Unidad', bodegaId: SUM, zona: 'Abarrotes', sd: 130 },
  { nrArticulo: '84180', nombre: 'ATUN LOMITOS LATA 170G', unidad: 'Unidad', bodegaId: SUM, zona: 'Abarrotes', sd: 96 },

  // ---- Almacén Suministros · Congelados ----
  { nrArticulo: '84200', nombre: 'PECHUGA POLLO CONGELADA KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Congelados', sd: 45 },
  { nrArticulo: '84210', nombre: 'CARNE MOLIDA RES KG', unidad: 'Kilogram', bodegaId: SUM, zona: 'Congelados', sd: 38 },
  { nrArticulo: '84220', nombre: 'PAPA A LA FRANCESA 2.5KG', unidad: 'Unidad', bodegaId: SUM, zona: 'Congelados', sd: 60 },
  { nrArticulo: '84230', nombre: 'HELADO VAINILLA 4L', unidad: 'Liter', bodegaId: SUM, zona: 'Congelados', sd: 20 },

  // ---- Almacén AyB ----
  { nrArticulo: '70010', nombre: 'CAFE MOLIDO 500G', unidad: 'Unidad', bodegaId: AYB, zona: 'Abarrotes', sd: 80 },
  { nrArticulo: '70020', nombre: 'CHOCOLATE MESA PASTILLA', unidad: 'Unidad', bodegaId: AYB, zona: 'Abarrotes', sd: 150 },
  { nrArticulo: null, nombre: 'SERVILLETA CUADRADA PAQ X500', unidad: 'Unidad', bodegaId: AYB, zona: 'Desechables', sd: 200 },
  { nrArticulo: '70045', nombre: 'VASO DESECHABLE 7OZ PAQ X50', unidad: 'Unidad', bodegaId: AYB, zona: 'Desechables', sd: 320 },
  { nrArticulo: '70050', nombre: 'LECHE ENTERA UHT LITRO', unidad: 'Liter', bodegaId: AYB, zona: 'Lácteos', sd: 90 },
  { nrArticulo: '70060', nombre: 'QUESO CAMPESINO KG', unidad: 'Kilogram', bodegaId: AYB, zona: 'Lácteos', sd: 25 },
  { nrArticulo: '70070', nombre: 'GASEOSA NARANJA 2.5L', unidad: 'Unidad', bodegaId: AYB, zona: 'Bebidas', sd: 44 },
  { nrArticulo: '70080', nombre: 'HIELO BOLSA 5KG', unidad: 'Unidad', bodegaId: AYB, zona: 'Congelados', sd: 30 },

  // ---- Restaurante Fuentes AyB ----
  { nrArticulo: '60010', nombre: 'TOMATE CHONTO KG', unidad: 'Kilogram', bodegaId: FUENTES, zona: 'Cocina', sd: 40 },
  { nrArticulo: '60020', nombre: 'CEBOLLA CABEZONA KG', unidad: 'Kilogram', bodegaId: FUENTES, zona: 'Cocina', sd: 35 },
  { nrArticulo: null, nombre: 'PLATANO VERDE UND', unidad: 'Unidad', bodegaId: FUENTES, zona: 'Cocina', sd: 120 },
  { nrArticulo: '60040', nombre: 'GASEOSA PERSONAL 400ML', unidad: 'Unidad', bodegaId: FUENTES, zona: 'Bebidas', sd: 96 },
  { nrArticulo: '60050', nombre: 'HELADO PALETA SURTIDA', unidad: 'Unidad', bodegaId: FUENTES, zona: 'Postres', sd: 140 },

  // ---- Zoológico Suministros ----
  { nrArticulo: '50010', nombre: 'CONCENTRADO CANINO BULTO 40KG', unidad: 'Kilogram', bodegaId: ZOO, zona: 'Alimento animal', sd: 18 },
  { nrArticulo: '50020', nombre: 'HENO PACA', unidad: 'Unidad', bodegaId: ZOO, zona: 'Alimento animal', sd: 22 },
  { nrArticulo: '50030', nombre: 'MAIZ AMARILLO BULTO 40KG', unidad: 'Kilogram', bodegaId: ZOO, zona: 'Alimento animal', sd: 15 },

  // ---- Casos de SD negativo (novedades de reconciliación en el reporte) ----
  { nrArticulo: '84300', nombre: 'VINAGRE BLANCO GALON', unidad: 'Unidad', bodegaId: SUM, zona: 'Cocina', sd: -3 },
  { nrArticulo: '70090', nombre: 'MOSTAZA DISPENSADOR 3.7KG', unidad: 'Unidad', bodegaId: AYB, zona: 'Abarrotes', sd: -7 },
  { nrArticulo: null, nombre: 'SALSA DE TOMATE DISPENSADOR', unidad: 'Unidad', bodegaId: AYB, zona: 'Abarrotes', sd: -2 },
]

function zonaId(bodegaId: string, zona: string): string {
  const slug = zona
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
  return `z-${bodegaId.replace('b-', '')}-${slug}`
}

// ---- Generación de relleno: cada bodega llega a 12–25 artículos repartidos en sus zonas ----
// Pools de nombres realistas por tipo de zona (se reparten en round-robin).
const POOLS: Record<string, string[]> = {
  Aseo: ['DETERGENTE POLVO 5KG', 'LIMPIADOR PISOS GALON', 'LIMPIAVIDRIOS 500ML', 'TRAPERO INDUSTRIAL', 'LIMPION MICROFIBRA PAQ', 'JABON BARRA X3', 'DESINFECTANTE LAVANDA GALON', 'AMBIENTADOR AEROSOL', 'CEPILLO SANITARIO', 'ESPONJA ABRASIVA PAQ', 'GUANTE CAUCHO PAR', 'BOLSA ROJA BIOSEGURIDAD PAQ'],
  Cocina: ['ACEITE VEGETAL 3L', 'SALSA SOYA GALON', 'CALDO GALLINA CAJA', 'COMINO MOLIDO 500G', 'PIMIENTA NEGRA 250G', 'MARGARINA 2KG', 'FECULA MAIZ 500G', 'LEVADURA 500G', 'CANELA ASTILLA 250G', 'COLOR COMIDA 500G'],
  Bebidas: ['GASEOSA COLA 3L', 'AGUA CON GAS 1.5L', 'JUGO HIT LITRO', 'TE FRIO 1.5L', 'ENERGIZANTE LATA', 'MALTA 330ML SIXPACK', 'LIMONADA POLVO 1KG', 'SODA 1.5L'],
  Abarrotes: ['LENTEJA 500G PAQ', 'GARBANZO 500G', 'MAIZ PIRA 500G', 'GALLETA SODA PAQ', 'AZUCAR 500G', 'PANELA PULVERIZADA 500G', 'CHOCOLATE INSTANT 400G', 'AVENA HOJUELA 500G', 'SPAGHETTI 250G', 'SARDINA LATA 425G'],
  Congelados: ['NUGGETS POLLO 1KG', 'PESCADO FILETE 1KG', 'VERDURA MIX 1KG', 'AREPA CONGELADA PAQ', 'PAPA CRIOLLA 2KG', 'CHORIZO PAQ X10'],
  'Lácteos': ['LECHE DESLACTOSADA LITRO', 'YOGURT GARRAFA 1.7KG', 'QUESO DOBLE CREMA KG', 'MANTEQUILLA 500G', 'CREMA LECHE LITRO', 'KUMIS LITRO'],
  Desechables: ['VASO 9OZ PAQ X50', 'PLATO CARTON PAQ X25', 'CUCHARA PLASTICA PAQ X50', 'SERVILLETA PAQ X100', 'BOLSA DOMICILIO PAQ', 'CONTENEDOR ICOPOR PAQ'],
  Postres: ['GELATINA 1KG', 'FLAN VAINILLA 1KG', 'AREQUIPE 500G', 'MORA PULPA 1KG', 'GALLETA WAFER PAQ'],
  Snacks: ['PAPAS FRITAS PAQ', 'CHOCORAMO UND', 'MANI SALADO 1KG', 'DORITOS PAQ', 'CHICLE CAJA', 'CHOCOLATINA CAJA'],
  Helados: ['PALETA FRUTA CAJA', 'CONO VAINILLA CAJA', 'SANDWICH HELADO CAJA', 'BOLA HELADO 4L'],
  Empaques: ['CAJA CARTON MEDIANA', 'CINTA EMBALAJE ROLLO', 'VINIPEL ROLLO', 'BOLSA VACIO PAQ', 'ETIQUETA PRECIO ROLLO', 'PAPEL KRAFT ROLLO'],
  Utensilios: ['CUCHILLO CHEF', 'TABLA PICAR', 'OLLA ALUMINIO 40CM', 'CUCHARON ACERO', 'COLADOR GRANDE', 'PINZA COCINA'],
  'Alimento animal': ['CONCENTRADO GATO 15KG', 'ALIMENTO AVES 40KG', 'SAL MINERALIZADA 30KG', 'FRUTA ANIMAL KG', 'VITAMINA ANIMAL LITRO', 'PELLET PECES 5KG'],
}

function unidadDeNombre(nombre: string): Unidad {
  if (/\bKG\b|BULTO|\bKGS\b/.test(nombre)) return 'Kilogram'
  if (/GALON|LITRO/.test(nombre)) return 'Liter'
  return 'Unidad'
}

const OBJETIVO_POR_BODEGA = 16 // cada bodega llega al menos a este número de artículos

function generarRelleno(): Spec[] {
  const generados: Spec[] = []
  for (const bodega of BODEGAS) {
    const zonas = getZonasDeBodega(bodega.id)
    if (zonas.length === 0) continue
    const existentes = SPECS.filter((s) => s.bodegaId === bodega.id).length
    const faltan = Math.max(0, OBJETIVO_POR_BODEGA - existentes)
    const rnd = seeded(7000 + bodega.id.length * 13)
    for (let k = 0; k < faltan; k++) {
      const zona = zonas[k % zonas.length]
      const pool = POOLS[zona.nombre] ?? POOLS['Abarrotes']
      const idx = Math.floor(k / zonas.length)
      const baseNombre = pool[idx % pool.length]
      const nombre = idx < pool.length ? baseNombre : `${baseNombre} Nº${Math.floor(idx / pool.length) + 1}`
      const sd = Math.round((10 + rnd() * 280) * 100) / 100
      generados.push({
        // ~1 de cada 5 sin código (caso real: 260 artículos sin Nr.Artículo)
        nrArticulo: rnd() < 0.2 ? null : `9${(bodega.id.length * 1000 + k * 7).toString().padStart(6, '0')}`,
        nombre,
        unidad: unidadDeNombre(nombre),
        bodegaId: bodega.id,
        zona: zona.nombre,
        sd,
      })
    }
  }
  return generados
}

const ALL_SPECS: Spec[] = [...SPECS, ...generarRelleno()]

// Ensambla los productos: ids, ordenRuta por zona e histórico determinista.
const ordenPorZona: Record<string, number> = {}

export const PRODUCTOS: Producto[] = ALL_SPECS.map((s, i) => {
  const zid = zonaId(s.bodegaId, s.zona)
  ordenPorZona[zid] = (ordenPorZona[zid] ?? 0) + 1

  const rnd = seeded(1000 + i * 7)
  const base = Math.abs(s.sd) // el histórico se calcula sobre magnitud
  const historico = base === 0
    ? [0, 0, 0]
    : [0, 1, 2].map(() => {
        const factor = 0.85 + rnd() * 0.3 // 0.85–1.15
        return Math.round(base * factor * 100) / 100
      })

  return {
    id: `p-${String(i + 1).padStart(3, '0')}`,
    nrArticulo: s.nrArticulo,
    nombre: s.nombre,
    unidad: s.unidad,
    bodegaId: s.bodegaId,
    zonaId: zid,
    ordenRuta: ordenPorZona[zid],
    sd: s.sd,
    historico,
  }
})

export const getProductosDeBodega = (bodegaId: string): Producto[] =>
  PRODUCTOS.filter((p) => p.bodegaId === bodegaId)

export const getProductosDeZona = (zonaId: string): Producto[] =>
  PRODUCTOS.filter((p) => p.zonaId === zonaId).sort((a, b) => a.ordenRuta - b.ordenRuta)

export const getProductoById = (id: string): Producto | undefined => PRODUCTOS.find((p) => p.id === id)
