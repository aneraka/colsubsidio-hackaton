import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario } from '../types/domain'
import { validarPin, validarCorreo, validarCarne } from '../data/mock/usuarios'

interface SessionState {
  usuario: Usuario | null
  loginPin: (pin: string) => boolean
  loginCorreo: (correo: string) => boolean
  loginCarne: (carne: string) => boolean
  logout: () => void
  esAuditor: () => boolean
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      usuario: null,
      loginPin: (pin) => {
        const u = validarPin(pin)
        if (!u) return false
        set({ usuario: u })
        return true
      },
      loginCorreo: (correo) => {
        const u = validarCorreo(correo)
        if (!u) return false
        set({ usuario: u })
        return true
      },
      loginCarne: (carne) => {
        const u = validarCarne(carne)
        if (!u) return false
        set({ usuario: u })
        return true
      },
      logout: () => set({ usuario: null }),
      esAuditor: () => get().usuario?.rol === 'auditor',
    }),
    { name: 'agente-inventario-sesion-v1' },
  ),
)
