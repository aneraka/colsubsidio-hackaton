import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Bodega,
  Captura,
  MetodoIdentificacion,
  Producto,
  SesionConteo,
  Zona,
} from '../types/domain'
import { getProductosDeZona, getProductosDeBodega } from '../data/mock/productos'
import { formatFechaLarga } from '../lib/fecha'
import { guardarCaptura } from '../services/captures'
import { useSyncStore } from './useSyncStore'
import { useCyclesStore } from './useCyclesStore'

interface CountingState {
  bodegaActiva: Bodega | null
  zonaActiva: Zona | null
  sesion: SesionConteo | null
  productoEnCurso: Producto | null
  metodoEnCurso: MetodoIdentificacion | null
  /** capturas de este ciclo, indexadas por productoId */
  capturas: Record<string, Captura>
  zonasCerradas: string[]
  /** productos saltados en la ruta (reaparecen al final) */
  saltados: string[]

  iniciarSesion: (bodega: Bodega, zona: Zona, operarioId: string, operarioNombre: string) => boolean
  identificarProducto: (p: Producto, metodo: MetodoIdentificacion) => void
  registrarCaptura: (c: Omit<Captura, 'cicloId'>) => void
  siguienteEnRuta: () => Producto | null
  saltarProducto: (productoId: string) => Producto | null
  productosPendientes: (zonaId: string) => Producto[]
  contadosEnZona: (zonaId: string) => number
  contadosEnBodega: (bodegaId: string) => number
  cerrarZona: (zonaId: string) => void
  reset: () => void
}

export const useCountingStore = create<CountingState>()(
  persist(
    (set, get) => ({
      bodegaActiva: null,
      zonaActiva: null,
      sesion: null,
      productoEnCurso: null,
      metodoEnCurso: null,
      capturas: {},
      zonasCerradas: [],
      saltados: [],

      iniciarSesion: (bodega, zona, operarioId, operarioNombre) => {
        const yaExistia = get().sesion?.bodegaId === bodega.id && get().zonaActiva?.id === zona.id
        set({
          bodegaActiva: bodega,
          zonaActiva: zona,
          sesion: {
            id: `s-${bodega.id}-${zona.id}`,
            bodegaId: bodega.id,
            operarioId,
            operarioNombre,
            fechaCiclo: formatFechaLarga(useCyclesStore.getState().cicloActivo.fecha),
            iniciadaEn: get().sesion?.iniciadaEn ?? new Date().toISOString(),
          },
          productoEnCurso: null,
          metodoEnCurso: null,
        })
        return yaExistia // true → "Retomando tu conteo"
      },

      identificarProducto: (p, metodo) => set({ productoEnCurso: p, metodoEnCurso: metodo }),

      registrarCaptura: (c) => {
        // Asocia la captura al ciclo activo.
        const captura: Captura = { ...c, cicloId: useCyclesStore.getState().cicloActivo.id }
        set((s) => ({
          capturas: { ...s.capturas, [captura.productoId]: captura },
          saltados: s.saltados.filter((id) => id !== captura.productoId),
        }))
        // Persistencia de servicio (base offline). // TODO(backend): encolar hacia Supabase.
        void guardarCaptura(captura)
        useSyncStore.getState().encolar()
      },

      siguienteEnRuta: () => {
        const zona = get().zonaActiva
        if (!zona) return null
        const pend = get().productosPendientes(zona.id)
        const siguiente = pend[0] ?? null
        set({ productoEnCurso: siguiente, metodoEnCurso: siguiente ? 'ruta' : null })
        return siguiente
      },

      saltarProducto: (productoId) => {
        // marca el producto como saltado (irá al final de la ruta) y avanza al siguiente
        set((s) => ({
          saltados: s.saltados.includes(productoId) ? s.saltados : [...s.saltados, productoId],
        }))
        return get().siguienteEnRuta()
      },

      productosPendientes: (zonaId) => {
        const { capturas, saltados } = get()
        const pend = getProductosDeZona(zonaId).filter((p) => !capturas[p.id])
        // los no saltados van primero (por ordenRuta); los saltados, al final
        const noSaltados = pend.filter((p) => !saltados.includes(p.id))
        const enCola = pend.filter((p) => saltados.includes(p.id))
        return [...noSaltados, ...enCola]
      },

      contadosEnZona: (zonaId) => {
        const capturas = get().capturas
        return getProductosDeZona(zonaId).filter((p) => capturas[p.id]).length
      },

      contadosEnBodega: (bodegaId) => {
        const capturas = get().capturas
        return getProductosDeBodega(bodegaId).filter((p) => capturas[p.id]).length
      },

      cerrarZona: (zonaId) =>
        set((s) => ({
          zonasCerradas: s.zonasCerradas.includes(zonaId)
            ? s.zonasCerradas
            : [...s.zonasCerradas, zonaId],
        })),

      reset: () =>
        set({
          bodegaActiva: null,
          zonaActiva: null,
          sesion: null,
          productoEnCurso: null,
          metodoEnCurso: null,
          capturas: {},
          zonasCerradas: [],
          saltados: [],
        }),
    }),
    { name: 'agente-inventario-v1' },
  ),
)
