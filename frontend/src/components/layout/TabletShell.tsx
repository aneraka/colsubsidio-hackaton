import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'
import { RotateOverlay } from './RotateOverlay'
import { ToastHost } from './ToastHost'

/**
 * Contenedor full-viewport landscape. Cuerpo scrolleable + StatusBar inferior fija.
 */
export function TabletShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[color:var(--color-bg)]">
      <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      <StatusBar />
      <ToastHost />
      <RotateOverlay />
    </div>
  )
}
