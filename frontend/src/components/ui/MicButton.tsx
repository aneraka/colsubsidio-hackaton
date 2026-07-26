import { Mic, Loader2 } from 'lucide-react'

type MicState = 'idle' | 'listening' | 'processing'

interface MicButtonProps {
  state: MicState
  onClick: () => void
  disabled?: boolean
}

const labels: Record<MicState, string> = {
  idle: 'Toca para hablar',
  listening: 'Escuchando…',
  processing: 'Procesando…',
}

/** Botón circular grande de micrófono con ondas concéntricas al escuchar. */
export function MicButton({ state, onClick, disabled = false }: MicButtonProps) {
  const listening = state === 'listening'
  return (
    <div className="flex flex-col items-center gap-3 no-select">
      <div className="relative flex items-center justify-center" style={{ width: 150, height: 150 }}>
        {listening && (
          <>
            <span
              className="absolute rounded-full"
              style={{ width: 110, height: 110, background: 'var(--color-brand-yellow)', animation: 'mic-wave 1.6s ease-out infinite' }}
            />
            <span
              className="absolute rounded-full"
              style={{ width: 110, height: 110, background: 'var(--color-brand-yellow)', animation: 'mic-wave 1.6s ease-out infinite', animationDelay: '0.8s' }}
            />
          </>
        )}
        <button
          onClick={onClick}
          disabled={disabled}
          aria-label={labels[state]}
          className="relative z-10 flex items-center justify-center rounded-full bg-[color:var(--color-brand-yellow)] text-[color:var(--color-graphite)] shadow-[var(--shadow-card)] no-select active:scale-95 disabled:opacity-40"
          style={{ width: 110, height: 110 }}
        >
          {state === 'processing' ? (
            <Loader2 size={48} className="animate-spin" />
          ) : (
            <Mic size={52} strokeWidth={2.4} />
          )}
        </button>
      </div>
      <span
        className="text-base font-semibold"
        style={{ color: listening ? 'var(--color-brand-blue)' : 'var(--color-graphite-60)' }}
      >
        {labels[state]}
      </span>
    </div>
  )
}
