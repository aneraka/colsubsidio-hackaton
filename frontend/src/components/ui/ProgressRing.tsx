type Size = 'sm' | 'md' | 'lg'

const dims: Record<Size, { box: number; stroke: number; font: number; sub: number }> = {
  sm: { box: 64, stroke: 7, font: 16, sub: 9 },
  md: { box: 96, stroke: 9, font: 22, sub: 11 },
  lg: { box: 132, stroke: 12, font: 30, sub: 13 },
}

interface ProgressRingProps {
  value: number
  total: number
  size?: Size
  /** 'fraction' → x/y, 'percent' → % */
  label?: 'fraction' | 'percent'
}

/** Anillo SVG: track gris, progreso azul (verde al 100%), fracción/porcentaje centrado. */
export function ProgressRing({ value, total, size = 'md', label = 'fraction' }: ProgressRingProps) {
  const { box, stroke, font, sub } = dims[size]
  const r = (box - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = total > 0 ? Math.min(1, value / total) : 0
  const done = total > 0 && value >= total
  const progressColor = done ? 'var(--color-success)' : 'var(--color-brand-blue)'

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: box, height: box }}>
      <svg width={box} height={box} className="-rotate-90">
        <circle cx={box / 2} cy={box / 2} r={r} fill="none" stroke="#E7E8EC" strokeWidth={stroke} />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={r}
          fill="none"
          stroke={progressColor}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 400ms ease, stroke 200ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center no-select">
        {label === 'fraction' ? (
          <span className="tabular font-extrabold leading-none" style={{ fontSize: font, color: 'var(--color-graphite)' }}>
            {value}
            <span style={{ color: 'var(--color-graphite-60)' }}>/{total}</span>
          </span>
        ) : (
          <span className="tabular font-extrabold leading-none" style={{ fontSize: font, color: 'var(--color-graphite)' }}>
            {Math.round(pct * 100)}%
          </span>
        )}
        {label === 'fraction' && (
          <span className="uppercase tracking-wide" style={{ fontSize: sub, color: 'var(--color-graphite-60)' }}>
            {done ? 'completo' : 'contados'}
          </span>
        )}
      </div>
    </div>
  )
}
