import { useEffect, useState } from 'react'

interface GiantNumberProps {
  value: number | null
  /** color del número (por defecto grafito) */
  color?: string
}

/**
 * El número de conteo. Weight 900, tabular-nums, con "pop" al cambiar de valor.
 * Decimales en coma (es-CO) y con la parte decimal más pequeña: 109,0065.
 */
export function GiantNumber({ value, color = 'var(--color-graphite)' }: GiantNumberProps) {
  const [pop, setPop] = useState(false)

  useEffect(() => {
    if (value === null) return
    setPop(true)
    const t = setTimeout(() => setPop(false), 160)
    return () => clearTimeout(t)
  }, [value])

  if (value === null) {
    return (
      <span
        className="tabular no-select leading-none"
        style={{ fontSize: 'var(--text-giant)', fontWeight: 900, color: 'var(--color-graphite-60)' }}
      >
        —
      </span>
    )
  }

  const [entero, decimal] = String(value).split('.')
  const enteroFmt = Number(entero).toLocaleString('es-CO')

  return (
    <span
      key={value}
      className={['tabular no-select inline-flex items-baseline leading-none', pop ? 'number-pop' : ''].join(' ')}
      style={{ color }}
    >
      <span style={{ fontSize: 'var(--text-giant)', fontWeight: 900 }}>{enteroFmt}</span>
      {decimal !== undefined && (
        <span style={{ fontSize: 'calc(var(--text-giant) * 0.42)', fontWeight: 800 }}>
          ,{decimal}
        </span>
      )}
    </span>
  )
}
