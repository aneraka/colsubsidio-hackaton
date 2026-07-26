import { useEffect, useState } from 'react'
import { RotateCw } from 'lucide-react'

/**
 * Overlay a pantalla completa cuando la tablet está en portrait.
 * El diseño es SOLO landscape (regla de CLAUDE.md).
 */
export function RotateOverlay() {
  const [isPortrait, setIsPortrait] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)')
    const update = () => setIsPortrait(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  if (!isPortrait) return null

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6 bg-[color:var(--color-graphite)] px-10 text-center text-white no-select">
      <RotateCw size={96} className="animate-pulse text-[color:var(--color-brand-yellow)]" />
      <p className="text-3xl font-extrabold">Gira la tablet para continuar</p>
      <p className="max-w-md text-lg text-white/70">
        El Agente de Inventario funciona en horizontal (landscape).
      </p>
    </div>
  )
}
