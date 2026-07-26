import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Captura, CicloConteo, ResumenCiclo } from '../types/domain'
import { CICLOS_CERRADOS } from '../data/mock/ciclos'
import { cicloIdDeFecha, proximaFechaCiclo } from '../lib/fecha'

// El ciclo activo arranca el 31 de julio de 2026 (sigue a los 3 ciclos cerrados de la historia).
const FECHA_INICIAL = '2026-07-31'

function crearCiclo(fecha: string): CicloConteo {
  return { id: cicloIdDeFecha(fecha), fecha, estado: 'activo', capturas: [] }
}

interface CyclesState {
  cicloActivo: CicloConteo
  ciclosCerrados: CicloConteo[]
  getProximaFecha: () => string
  cerrarCiclo: (params: { capturas: Captura[]; resumen: ResumenCiclo; cerradoPor: string }) => string
  getCicloById: (id: string) => CicloConteo | undefined
}

export const useCyclesStore = create<CyclesState>()(
  persist(
    (set, get) => ({
      cicloActivo: crearCiclo(FECHA_INICIAL),
      ciclosCerrados: CICLOS_CERRADOS,

      getProximaFecha: () => proximaFechaCiclo(get().cicloActivo.fecha),

      cerrarCiclo: ({ capturas, resumen, cerradoPor }) => {
        const activo = get().cicloActivo
        const cerrado: CicloConteo = {
          ...activo,
          estado: 'cerrado',
          cerradoEn: new Date().toISOString(),
          cerradoPor,
          resumen,
          capturas, // snapshot congelado
        }
        const proxima = proximaFechaCiclo(activo.fecha)
        // TODO(backend): persistir el ciclo cerrado y sus capturas en Supabase (tabla ciclos + capturas.ciclo_id).
        set({
          ciclosCerrados: [cerrado, ...get().ciclosCerrados],
          cicloActivo: crearCiclo(proxima),
        })
        return proxima
      },

      getCicloById: (id) => {
        if (get().cicloActivo.id === id) return get().cicloActivo
        return get().ciclosCerrados.find((c) => c.id === id)
      },
    }),
    { name: 'agente-inventario-ciclos-v1' },
  ),
)
