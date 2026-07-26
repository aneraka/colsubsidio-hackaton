import { useCallback, useEffect, useRef, useState } from 'react'

interface HoldToConfirmProps {
  onConfirm: () => void
  label?: string
  durationMs?: number
  className?: string
}

/**
 * Botón "Mantén presionado para confirmar": un fill amarillo progresa de izquierda a
 * derecha durante `durationMs`. Si se suelta antes, se resetea. Al completar dispara
 * `onConfirm` con feedback háptico. Funciona con mouse y touch (pointer events).
 */
export function HoldToConfirm({
  onConfirm,
  label = 'Mantén presionado para confirmar',
  durationMs = 1500,
  className = '',
}: HoldToConfirmProps) {
  const [progress, setProgress] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)
  const doneRef = useRef(false)

  const stop = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    startRef.current = null
    if (!doneRef.current) setProgress(0)
  }, [])

  const tick = useCallback(
    (now: number) => {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const p = Math.min(1, elapsed / durationMs)
      setProgress(p)
      if (p >= 1) {
        doneRef.current = true
        if ('vibrate' in navigator) navigator.vibrate(50)
        onConfirm()
        return
      }
      rafRef.current = requestAnimationFrame(tick)
    },
    [durationMs, onConfirm],
  )

  const start = useCallback(() => {
    if (doneRef.current) return
    rafRef.current = requestAnimationFrame(tick)
  }, [tick])

  useEffect(() => () => stop(), [stop])

  return (
    <button
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      className={[
        'relative h-[72px] w-full overflow-hidden rounded-2xl bg-[color:var(--color-graphite)]',
        'select-none text-white no-select active:scale-[0.99]',
        className,
      ].join(' ')}
      style={{ touchAction: 'none' }}
    >
      <span
        className="absolute inset-y-0 left-0 bg-[color:var(--color-brand-yellow)]"
        style={{ width: `${progress * 100}%`, transition: progress === 0 ? 'width 150ms ease' : 'none' }}
      />
      <span
        className="relative z-10 flex h-full items-center justify-center px-6 text-lg font-bold"
        style={{ color: progress > 0.5 ? 'var(--color-graphite)' : '#fff', transition: 'color 120ms' }}
      >
        {label}
      </span>
    </button>
  )
}
