import { useState } from 'react'
import { Delete, X } from 'lucide-react'
import { BigButton } from '../ui'

interface TecladoNumericoProps {
  onCerrar: () => void
  onConfirmar: (valor: number) => void
}

/** Teclado numérico con separador decimal (coma) — fallback táctil del conteo por voz. */
export function TecladoNumerico({ onCerrar, onConfirmar }: TecladoNumericoProps) {
  const [texto, setTexto] = useState('')

  const agregar = (c: string) => {
    if (c === ',' && texto.includes(',')) return
    setTexto((t) => (t.length < 12 ? t + c : t))
  }

  const confirmar = () => {
    const n = parseFloat(texto.replace(',', '.'))
    if (!Number.isNaN(n) && n >= 0) onConfirmar(n)
  }

  const KEY =
    'flex h-16 items-center justify-center rounded-2xl bg-white border border-[#E1E2E6] text-3xl font-bold text-[color:var(--color-graphite)] no-select active:bg-[color:var(--color-brand-yellow)]'

  return (
    <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/40" onClick={onCerrar}>
      <div className="screen-enter w-full max-w-md rounded-t-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-[color:var(--color-graphite)]">Teclear cantidad</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF0]">
            <X size={22} />
          </button>
        </div>
        <div className="mb-4 flex h-16 items-center justify-center rounded-2xl border-2 border-[#D8D9DD] text-4xl font-extrabold tabular text-[color:var(--color-graphite)]">
          {texto || <span className="text-[color:var(--color-graphite-60)]">0</span>}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button key={d} className={KEY} onClick={() => agregar(d)}>
              {d}
            </button>
          ))}
          <button className={KEY} onClick={() => agregar(',')}>
            ,
          </button>
          <button className={KEY} onClick={() => agregar('0')}>
            0
          </button>
          <button className={KEY} onClick={() => setTexto((t) => t.slice(0, -1))} aria-label="Borrar">
            <Delete size={26} />
          </button>
        </div>
        <div className="mt-4">
          <BigButton variant="primary" size="lg" fullWidth disabled={!texto} onClick={confirmar}>
            Usar esta cantidad
          </BigButton>
        </div>
      </div>
    </div>
  )
}
