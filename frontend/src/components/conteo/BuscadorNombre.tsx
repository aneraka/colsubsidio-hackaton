import { useEffect, useRef, useState } from 'react'
import { Mic, Search } from 'lucide-react'
import type { Producto } from '../../types/domain'
import { buscarPorNombre } from '../../services/catalog'
import { unidadLabel } from '../../lib/unidad'
import { sttDisponible, iniciar, detener } from '../../services/stt'
import { Chip } from '../ui/Chip'

interface BuscadorNombreProps {
  zonaId?: string
  /** Un resultado tocado directamente en la lista. */
  onElegir: (p: Producto) => void
  /** Dictado/enter con varios candidatos → normalmente navega a desambiguar. */
  onMultiples?: (candidatos: Producto[], termino: string) => void
  autoFocus?: boolean
}

/** Buscador por nombre: input grande + dictado por voz + resultados en vivo. */
export function BuscadorNombre({ zonaId, onElegir, onMultiples, autoFocus }: BuscadorNombreProps) {
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<Producto[]>([])
  const [escuchando, setEscuchando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  useEffect(() => {
    if (query.trim().length < 2) {
      setResultados([])
      return
    }
    let vivo = true
    buscarPorNombre(query, zonaId).then((r) => vivo && setResultados(r))
    return () => {
      vivo = false
    }
  }, [query, zonaId])

  useEffect(() => () => detener(), [])

  const dictar = () => {
    if (escuchando) {
      detener()
      setEscuchando(false)
      return
    }
    if (!sttDisponible()) {
      inputRef.current?.focus()
      return
    }
    setEscuchando(true)
    iniciar({
      onFinal: async (texto) => {
        detener()
        setEscuchando(false)
        setQuery(texto)
        const r = await buscarPorNombre(texto, zonaId)
        if (r.length === 1) onElegir(r[0])
        else if (r.length >= 2 && onMultiples) onMultiples(r.slice(0, 4), texto)
      },
      onError: () => setEscuchando(false),
    })
  }

  const submit = async () => {
    const r = await buscarPorNombre(query, zonaId)
    if (r.length === 1) onElegir(r[0])
    else if (r.length >= 2 && onMultiples) onMultiples(r.slice(0, 4), query)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={22}
            className="absolute top-1/2 left-4 -translate-y-1/2 text-[color:var(--color-graphite-60)]"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Escribe el nombre del producto…"
            className="h-16 w-full rounded-2xl border border-[#D8D9DD] bg-white pr-4 pl-12 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
        </div>
        <button
          onClick={dictar}
          aria-label="Dictar nombre"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl no-select active:scale-95"
          style={{
            background: escuchando ? 'var(--color-brand-blue)' : 'var(--color-brand-yellow)',
            color: escuchando ? '#fff' : 'var(--color-graphite)',
          }}
        >
          <Mic size={26} />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {resultados.map((p) => (
          <button
            key={p.id}
            onClick={() => onElegir(p)}
            className="flex items-center justify-between rounded-2xl border border-[#E7E8EC] bg-white px-4 py-3 text-left no-select active:scale-[0.99]"
          >
            <div className="min-w-0">
              <div className="truncate font-bold text-[color:var(--color-graphite)]">{p.nombre}</div>
              <div className="text-sm text-[color:var(--color-graphite-60)]">
                {p.nrArticulo ? `Nr. ${p.nrArticulo}` : 'Sin código'}
              </div>
            </div>
            <Chip variant="unit">{unidadLabel(p.unidad)}</Chip>
          </button>
        ))}
        {query.trim().length >= 2 && resultados.length === 0 && (
          <p className="px-2 py-3 text-[color:var(--color-graphite-60)]">
            No encontrado — intenta con otra palabra.
          </p>
        )}
      </div>
    </div>
  )
}
