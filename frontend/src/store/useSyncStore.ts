import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useToast } from './useToast'

/**
 * Cola de sincronización offline. En esta fase TODAS las capturas entran a la cola
 * (base offline de la demo). // TODO(backend): flush real de la cola hacia Supabase al reconectar.
 */
interface SyncState {
  pendientes: number
  sincronizando: boolean
  encolar: () => void
  sincronizar: () => Promise<void>
  reset: () => void
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      pendientes: 0,
      sincronizando: false,
      encolar: () => set((s) => ({ pendientes: s.pendientes + 1 })),
      sincronizar: async () => {
        const n = get().pendientes
        if (n === 0 || get().sincronizando) return
        set({ sincronizando: true })
        // TODO(backend): POST de las capturas encoladas a Supabase.
        await new Promise((r) => setTimeout(r, 1500))
        set({ pendientes: 0, sincronizando: false })
        useToast.getState().mostrar(`✓ ${n} captura${n > 1 ? 's' : ''} sincronizada${n > 1 ? 's' : ''}`, 'success')
      },
      reset: () => set({ pendientes: 0, sincronizando: false }),
    }),
    { name: 'agente-inventario-sync-v1' },
  ),
)
