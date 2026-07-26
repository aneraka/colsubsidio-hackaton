import { useState } from 'react'
import { X } from 'lucide-react'
import type { Producto } from '../../types/domain'
import { getPorCodigo } from '../../services/catalog'
import { BigButton, PinKeypad } from '../ui'

interface CodigoDialogProps {
  onCerrar: () => void
  onEncontrado: (p: Producto) => void
}

/** Diálogo para digitar el Nr.Artículo con teclado numérico gigante. */
export function CodigoDialog({ onCerrar, onEncontrado }: CodigoDialogProps) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState(false)
  const [buscando, setBuscando] = useState(false)

  const confirmar = async () => {
    if (!codigo) return
    setBuscando(true)
    const p = await getPorCodigo(codigo)
    setBuscando(false)
    if (p) onEncontrado(p)
    else setError(true)
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-6" onClick={onCerrar}>
      <div
        className="w-[440px] max-w-full rounded-3xl bg-white p-7 shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Digita el código</h2>
          <button onClick={onCerrar} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF0]">
            <X size={22} />
          </button>
        </div>

        <div
          className="mb-5 flex h-16 items-center justify-center rounded-2xl border-2 text-3xl font-extrabold tabular"
          style={{ borderColor: error ? 'var(--color-danger)' : '#D8D9DD', color: 'var(--color-graphite)' }}
        >
          {codigo || <span className="text-[color:var(--color-graphite-60)]">Nr. Artículo</span>}
        </div>

        {error && (
          <p className="mb-3 text-center font-semibold text-[color:var(--color-danger)]">
            No encontrado — intenta por nombre.
          </p>
        )}

        <div className="flex justify-center">
          <PinKeypad
            onDigit={(d) => {
              setError(false)
              setCodigo((c) => c + d)
            }}
            onBackspace={() => setCodigo((c) => c.slice(0, -1))}
          />
        </div>

        <div className="mt-5">
          <BigButton variant="blue" size="lg" fullWidth disabled={!codigo || buscando} onClick={confirmar}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
