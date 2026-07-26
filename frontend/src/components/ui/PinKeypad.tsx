import { Delete } from 'lucide-react'

interface PinKeypadProps {
  onDigit: (d: string) => void
  onBackspace: () => void
}

const KEY = 'flex h-[76px] w-[76px] items-center justify-center rounded-2xl bg-white border border-[#E1E2E6] text-3xl font-bold text-[color:var(--color-graphite)] no-select transition-colors active:bg-[color:var(--color-brand-yellow)] active:border-[color:var(--color-brand-yellow)]'

/** Teclado numérico 3×4: 1–9, 0 centrado, backspace. Teclas ~76px, feedback amarillo. */
export function PinKeypad({ onDigit, onBackspace }: PinKeypadProps) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
        <button key={d} className={KEY} onClick={() => onDigit(d)}>
          {d}
        </button>
      ))}
      <span />
      <button className={KEY} onClick={() => onDigit('0')}>
        0
      </button>
      <button
        className={KEY + ' !text-[color:var(--color-graphite-60)]'}
        onClick={onBackspace}
        aria-label="Borrar"
      >
        <Delete size={28} />
      </button>
    </div>
  )
}

interface PinDotsProps {
  length: number
  filled: number
  error?: boolean
}

/** 4 cajas grandes que se llenan con puntos. */
export function PinDots({ length, filled, error = false }: PinDotsProps) {
  return (
    <div className={['flex items-center justify-center gap-3', error ? 'shake' : ''].join(' ')}>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="flex h-14 w-14 items-center justify-center rounded-2xl border-2"
          style={{
            borderColor: error ? 'var(--color-danger)' : i < filled ? 'var(--color-brand-blue)' : '#D8D9DD',
            background: '#fff',
          }}
        >
          {i < filled && (
            <span
              className="h-4 w-4 rounded-full"
              style={{ background: error ? 'var(--color-danger)' : 'var(--color-graphite)' }}
            />
          )}
        </div>
      ))}
    </div>
  )
}
