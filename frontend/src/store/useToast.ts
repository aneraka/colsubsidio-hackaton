import { create } from 'zustand'

export interface Toast {
  id: number
  mensaje: string
  tono: 'success' | 'info' | 'warning'
}

interface ToastState {
  toasts: Toast[]
  mostrar: (mensaje: string, tono?: Toast['tono']) => void
  quitar: (id: number) => void
}

let seq = 0

export const useToast = create<ToastState>((set) => ({
  toasts: [],
  mostrar: (mensaje, tono = 'info') => {
    const id = ++seq
    set((s) => ({ toasts: [...s.toasts, { id, mensaje, tono }] }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 2600)
  },
  quitar: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
