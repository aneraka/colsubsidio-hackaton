import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/** Estado de revisión de alertas (persistido). // TODO(backend): alertas por Supabase Realtime. */
interface AlertsState {
  revisadas: string[]
  marcarRevisada: (id: string) => void
  estaRevisada: (id: string) => boolean
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set, get) => ({
      revisadas: [],
      marcarRevisada: (id) =>
        set((s) => ({ revisadas: s.revisadas.includes(id) ? s.revisadas : [...s.revisadas, id] })),
      estaRevisada: (id) => get().revisadas.includes(id),
    }),
    { name: 'agente-inventario-alertas-v1' },
  ),
)
