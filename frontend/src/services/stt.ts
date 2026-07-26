/**
 * Wrapper de la Web Speech API (reconocimiento de voz nativo del navegador).
 * lang es-CO, resultados intermedios, escucha continua (push-to-talk desde el MicButton).
 * Sin backend. Requiere HTTPS o localhost para el permiso de micrófono.
 */

// --- Tipos mínimos de la Web Speech API (no siempre están en lib.dom) ---
interface SpeechRecognitionResultLike {
  0: { transcript: string; confidence: number }
  isFinal: boolean
}
interface SpeechRecognitionEventLike {
  resultIndex: number
  results: { length: number; [i: number]: SpeechRecognitionResultLike }
}
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: SpeechRecognitionEventLike) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function sttDisponible(): boolean {
  return getCtor() !== null
}

export interface STTCallbacks {
  onPartial?: (texto: string) => void
  onFinal?: (texto: string, confianza: number) => void
  onError?: (mensaje: string) => void
}

let recognition: SpeechRecognitionLike | null = null

export function iniciar(cb: STTCallbacks): boolean {
  const Ctor = getCtor()
  if (!Ctor) {
    cb.onError?.('Este navegador no soporta reconocimiento de voz. Usa el teclado.')
    return false
  }
  detener()
  const rec = new Ctor()
  rec.lang = 'es-CO'
  rec.continuous = true
  rec.interimResults = true
  rec.maxAlternatives = 1

  rec.onresult = (e) => {
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i]
      const texto = r[0].transcript.trim()
      if (r.isFinal) cb.onFinal?.(texto, r[0].confidence ?? 0.9)
      else cb.onPartial?.(texto)
    }
  }
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
      cb.onError?.('Permiso de micrófono denegado. Actívalo para contar por voz.')
    } else if (e.error === 'no-speech') {
      cb.onError?.('No te escuché — intenta de nuevo.')
    } else {
      cb.onError?.('Error de reconocimiento de voz.')
    }
  }

  recognition = rec
  try {
    rec.start()
    return true
  } catch {
    cb.onError?.('No se pudo iniciar el micrófono.')
    return false
  }
}

export function detener(): void {
  if (recognition) {
    try {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.abort()
    } catch {
      /* noop */
    }
    recognition = null
  }
}
