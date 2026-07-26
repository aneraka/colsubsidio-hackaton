// Tipos de dominio del Agente de Inventario. Fuente de verdad para stores y servicios.

export type Unidad = 'Unidad' | 'Kilogram' | 'Liter'
export type MetodoIdentificacion = 'ruta' | 'escaneo' | 'codigo' | 'nombre'
export type MetodoCaptura = 'voz' | 'teclado'

export interface Bodega {
  id: string
  nombre: string // nombre ERP completo (ej. STOCK ALMACEN SUMINISTROS)
  nombreCorto: string // etiqueta legible para la UI (ej. Almacén Suministros)
  totalArticulos: number
}

export interface Zona {
  id: string
  bodegaId: string
  nombre: string
  orden: number
}

export interface Producto {
  id: string
  nrArticulo: string | null // 260 artículos reales no tienen código
  nombre: string // nombre estandarizado del ERP
  unidad: Unidad
  bodegaId: string
  zonaId: string
  ordenRuta: number // posición en la ruta fija de la zona
  sd: number // teórico del sistema (NUNCA mostrar al operario)
  historico: number[] // existencias de meses anteriores (para anomalías)
}

export interface Captura {
  id: string
  cicloId: string // ciclo de conteo al que pertenece
  productoId: string
  bodegaId: string
  zonaId: string
  sesionId: string
  operarioId: string
  cantidad: number
  unidad: Unidad
  metodoIdentificacion: MetodoIdentificacion
  metodoCaptura: MetodoCaptura
  expresion?: string // "2 × 12 + 5 = 29"
  fraseOriginal?: string // "dos cajas de doce y cinco sueltas"
  confianza?: number // 0–1 del STT/intérprete
  esNovedad: boolean
  timestamp: string
}

export interface SesionConteo {
  id: string
  bodegaId: string
  operarioId: string
  operarioNombre: string
  fechaCiclo: string
  iniciadaEn: string
}

export type Rol = 'contador' | 'auditor'

export interface Usuario {
  id: string // ID visible (ej. "OP-1042")
  nombre: string
  correo: string // ej. "juan.perez@colsubsidio.com"
  pin: string // 4 dígitos
  carne: string // código de barras del carné (ej. "CARNE-1042")
  rol: Rol
}

export interface ResumenCiclo {
  articulosContados: number
  articulosTotales: number
  novedades: number
  bodegasCompletas: number
  operarios: string[]
  duracionMin: number
}

export interface CicloConteo {
  id: string
  fecha: string // "2026-07-31" — último día del mes
  estado: 'activo' | 'cerrado'
  cerradoEn?: string
  cerradoPor?: string
  resumen?: ResumenCiclo // se calcula y congela al cerrar
  capturas: Captura[] // snapshot congelado al cerrar
}

export type TipoAlerta = 'atipico' | 'decimal' | 'sd_negativo'

export interface Alerta {
  id: string
  tipo: TipoAlerta
  productoId: string
  productoNombre: string
  bodegaId: string
  zonaId: string
  cantidad: number
  referencia?: number
  operarioId: string
  timestamp: string
}

/** Resultado del intérprete de conteo (Gemini o parser local). */
export interface ResultadoInterprete {
  tipo: 'cantidad' | 'incremento' | 'comando' | 'no_entendido'
  cantidad?: number
  expresion?: string
  comando?: 'recontar' | 'corregir' | 'estado' | 'guardar'
  confianza: number // 0–1
}

/** Fila del reporte contado vs sistema (Módulo 8). */
export interface FilaReporte {
  producto: Producto
  contado: number | null
  sistema: number // sd
  diferencia: number | null // contado − sd
  esNovedad: boolean
}
