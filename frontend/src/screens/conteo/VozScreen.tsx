import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Keyboard } from 'lucide-react'
import type { Captura, MetodoCaptura, ResultadoInterprete } from '../../types/domain'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useToast } from '../../store/useToast'
import { interpretarConteo } from '../../services/ai/gemini'
import { sttDisponible, iniciar, detener } from '../../services/stt'
import { validarCaptura } from '../../lib/validation'
import { unidadLabel, unidadPlural } from '../../lib/unidad'
import { getProductosDeZona } from '../../data/mock/productos'
import { GiantNumber, MicButton } from '../../components/ui'
import { TecladoNumerico } from '../../components/conteo/TecladoNumerico'
import { NavMenu } from '../../components/layout/NavMenu'
import { ChevronRight } from 'lucide-react'

function hablar(texto: string) {
  try {
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(texto)
      u.lang = 'es-CO'
      u.volume = 0.6
      window.speechSynthesis.speak(u)
    }
  } catch {
    /* noop */
  }
}

export function VozScreen() {
  const navigate = useNavigate()
  const producto = useCountingStore((s) => s.productoEnCurso)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const zona = useCountingStore((s) => s.zonaActiva)
  const sesion = useCountingStore((s) => s.sesion)
  const metodoId = useCountingStore((s) => s.metodoEnCurso)
  const registrarCaptura = useCountingStore((s) => s.registrarCaptura)
  const saltarProducto = useCountingStore((s) => s.saltarProducto)
  const contadosEnZona = useCountingStore((s) => s.contadosEnZona)
  const usuario = useSessionStore((s) => s.usuario)
  const mostrar = useToast((s) => s.mostrar)

  const [valor, setValor] = useState<number | null>(null)
  const [expresion, setExpresion] = useState<string | null>(null)
  const [micState, setMicState] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [transcript, setTranscript] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [reconteo, setReconteo] = useState<{ activo: boolean; primero: number | null }>({ activo: false, primero: null })
  const [comparacion, setComparacion] = useState<{ primero: number; segundo: number } | null>(null)
  const [guardado, setGuardado] = useState<number | null>(null)
  const [decimalPend, setDecimalPend] = useState<number | null>(null)
  const [teclado, setTeclado] = useState(false)

  const escuchandoRef = useRef(false)
  const fraseRef = useRef<string | undefined>(undefined)
  const confRef = useRef<number>(0.9)
  const metodoCapturaRef = useRef<MetodoCaptura>('voz')
  const transcriptTimer = useRef<number | null>(null)
  const avanceTimer = useRef<number | null>(null)
  const disponible = sttDisponible()

  useEffect(() => {
    return () => {
      detener()
      if (transcriptTimer.current) clearTimeout(transcriptTimer.current)
      if (avanceTimer.current) clearTimeout(avanceTimer.current)
    }
  }, [])

  if (!producto || !bodega || !zona || !sesion || !usuario) {
    navigate('/conteo/identificar')
    return null
  }

  const total = getProductosDeZona(zona.id).length
  const progreso = Math.round((contadosEnZona(zona.id) / Math.max(1, total)) * 100)

  const limpiar = () => {
    setValor(null)
    setExpresion(null)
    setMensaje('')
  }

  const saltar = () => {
    detener()
    escuchandoRef.current = false
    saltarProducto(producto.id) // reaparece al final de la ruta
    navigate('/conteo/identificar')
  }

  const iniciarReconteo = () => {
    setReconteo({ activo: true, primero: valor })
    setValor(null)
    setExpresion(null)
    setMensaje('')
  }

  const mostrarTranscript = (texto: string) => {
    setTranscript(texto)
    if (transcriptTimer.current) clearTimeout(transcriptTimer.current)
    transcriptTimer.current = window.setTimeout(() => setTranscript(''), 2000)
  }

  const procesar = (r: ResultadoInterprete) => {
    setMensaje('')
    switch (r.tipo) {
      case 'cantidad':
        if (r.cantidad !== undefined && r.cantidad >= 0) {
          metodoCapturaRef.current = 'voz'
          setValor(r.cantidad)
          setExpresion(r.expresion ?? null)
        } else {
          setMensaje('No te escuché bien — repite la cantidad')
        }
        break
      case 'incremento':
        metodoCapturaRef.current = 'voz'
        setValor((v) => (v ?? 0) + 1)
        setExpresion(null)
        break
      case 'comando':
        if (r.comando === 'recontar') iniciarReconteo()
        else if (r.comando === 'corregir') limpiar()
        else if (r.comando === 'estado') {
          const v = valor ?? 0
          mostrar(`Vas en ${v}`, 'info')
          hablar(`Vas en ${v}`)
        } else if (r.comando === 'guardar') guardar()
        break
      default:
        setMensaje('No te escuché bien — repite la cantidad')
    }
  }

  const onFinal = async (frase: string, conf: number) => {
    mostrarTranscript(frase)
    fraseRef.current = frase
    confRef.current = conf
    setMicState('processing')
    const r = await interpretarConteo(frase, producto)
    procesar(r)
    setMicState(escuchandoRef.current ? 'listening' : 'idle')
  }

  const toggleMic = () => {
    if (!disponible) {
      setTeclado(true)
      return
    }
    if (escuchandoRef.current) {
      detener()
      escuchandoRef.current = false
      setMicState('idle')
      return
    }
    escuchandoRef.current = true
    setMicState('listening')
    iniciar({
      onPartial: (t) => mostrarTranscript(t),
      onFinal,
      onError: (m) => {
        setMensaje(m)
        escuchandoRef.current = false
        setMicState('idle')
      },
    })
  }

  const registrarYConfirmar = (cantidad: number, esNovedad: boolean) => {
    detener()
    escuchandoRef.current = false
    setMicState('idle')
    const captura: Omit<Captura, 'cicloId'> = {
      id: `cap-${producto.id}-${Date.now()}`,
      productoId: producto.id,
      bodegaId: bodega.id,
      zonaId: zona.id,
      sesionId: sesion.id,
      operarioId: usuario.id,
      cantidad,
      unidad: producto.unidad,
      metodoIdentificacion: metodoId ?? 'ruta',
      metodoCaptura: metodoCapturaRef.current,
      expresion: expresion ?? undefined,
      fraseOriginal: fraseRef.current,
      confianza: confRef.current,
      esNovedad,
      timestamp: new Date().toISOString(),
    }
    registrarCaptura(captura)
    setReconteo({ activo: false, primero: null })
    setComparacion(null)
    setGuardado(cantidad)
    avanceTimer.current = window.setTimeout(() => {
      setGuardado(null)
      navigate('/conteo/identificar')
    }, 2000)
  }

  const procederGuardar = (cantidad: number) => {
    const v = validarCaptura(cantidad, producto, confRef.current)
    switch (v.tipo) {
      case 'ok':
        registrarYConfirmar(cantidad, false)
        break
      case 'confirmar_decimal':
        setDecimalPend(cantidad)
        break
      case 'atipico':
        detener()
        escuchandoRef.current = false
        navigate('/conteo/anomalia', {
          state: {
            cantidad,
            referencia: v.referencia,
            expresion,
            fraseOriginal: fraseRef.current,
            confianza: confRef.current,
            metodoCaptura: metodoCapturaRef.current,
          },
        })
        break
      case 'repetir':
        setMensaje('No te escuché bien — repite la cantidad')
        break
      case 'bloqueada':
        setMensaje('No se pueden guardar cantidades negativas.')
        break
    }
  }

  const guardar = () => {
    if (valor === null) {
      setMensaje('Dicta o teclea una cantidad primero')
      return
    }
    if (reconteo.activo && reconteo.primero !== null) {
      if (reconteo.primero === valor) {
        setReconteo({ activo: false, primero: null })
        procederGuardar(valor)
      } else {
        setComparacion({ primero: reconteo.primero, segundo: valor })
      }
      return
    }
    procederGuardar(valor)
  }

  const corregirGuardado = () => {
    if (avanceTimer.current) clearTimeout(avanceTimer.current)
    setGuardado(null) // la captura queda; recontar y guardar la reemplaza
  }

  const contextoTxt = `${producto.nombre.split(' ').slice(0, 3).join(' ')} · ${unidadLabel(producto.unidad)}`

  return (
    <div className="relative flex min-h-full flex-col bg-white no-select">
      <NavMenu variant="floating" />

      {/* Barra de progreso de la zona */}
      <div className="h-1.5 w-full bg-[#E7E8EC]">
        <div className="h-full bg-[color:var(--color-brand-blue)] transition-all" style={{ width: `${progreso}%` }} />
      </div>

      {/* Saltar al siguiente producto sin guardar */}
      <button
        onClick={saltar}
        className="absolute top-4 left-4 z-[100] flex items-center gap-1 rounded-full border border-[#E1E2E6] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--color-graphite-60)] active:scale-95"
      >
        Saltar <ChevronRight size={16} />
      </button>

      {/* Contexto */}
      <div className="pt-6 text-center text-sm font-semibold tracking-widest text-[color:var(--color-graphite-60)] uppercase">
        {contextoTxt}
      </div>

      {reconteo.activo && (
        <div className="mx-auto mt-3 rounded-full bg-[color:var(--color-brand-blue-soft)] px-4 py-1.5 text-sm font-semibold text-[color:var(--color-brand-blue)]">
          Reconteo — el primer valor está guardado
        </div>
      )}

      {/* Número gigante */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <GiantNumber value={valor} />
        {expresion && (
          <div className="rounded-full bg-[color:var(--color-brand-blue)] px-6 py-2 text-xl font-bold text-white tabular">
            {expresion}
          </div>
        )}
        {mensaje && <p className="text-lg font-semibold text-[color:var(--color-warning)]">{mensaje}</p>}
      </div>

      {/* Transcript efímero */}
      <div className="h-6 text-center text-sm text-[color:var(--color-graphite-60)]">{transcript}</div>

      {/* Controles inferiores */}
      <div className="grid grid-cols-3 items-end px-8 pb-8">
        <div className="flex items-center">
          <button onClick={iniciarReconteo} className="text-lg font-semibold text-[color:var(--color-graphite-60)] active:scale-95">
            Recontar
          </button>
        </div>
        <div className="flex flex-col items-center gap-2">
          <MicButton state={micState} onClick={toggleMic} />
          <button onClick={() => setTeclado(true)} aria-label="Teclado" className="flex items-center gap-1 text-sm text-[color:var(--color-graphite-60)]">
            <Keyboard size={18} /> Teclear
          </button>
        </div>
        <div className="flex items-center justify-end">
          <button onClick={guardar} className="text-lg font-bold text-[color:var(--color-brand-blue)] active:scale-95">
            Guardar ✓
          </button>
        </div>
      </div>

      {!disponible && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-[color:var(--color-graphite-60)]">
          Voz no disponible en este navegador — usa el teclado.
        </div>
      )}

      {/* Overlay de confirmación implícita (2s) */}
      {guardado !== null && (
        <div className="fixed inset-0 z-[600] flex flex-col items-center justify-center gap-6 bg-white">
          <div className="flex items-center gap-5">
            <GiantNumber value={guardado} color="var(--color-success)" />
            <div className="flex h-24 w-24 items-center justify-center rounded-full text-white" style={{ background: 'var(--color-success)' }}>
              <Check size={64} strokeWidth={3} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[color:var(--color-success)]">Guardado</p>
          <button onClick={corregirGuardado} className="text-lg font-semibold text-[color:var(--color-graphite-60)] underline">
            Corregir
          </button>
        </div>
      )}

      {/* Diálogo de confirmación de decimal */}
      {decimalPend !== null && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-6">
          <div className="w-[440px] max-w-full rounded-3xl bg-white p-8 text-center">
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">
              ¿Confirmas {String(decimalPend).replace('.', ',')} {unidadPlural(producto.unidad)}?
            </h2>
            <p className="mt-2 text-[color:var(--color-graphite-60)]">Es un decimal poco común — confírmalo con calma.</p>
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  const c = decimalPend
                  setDecimalPend(null)
                  registrarYConfirmar(c, true)
                }}
                className="h-16 flex-1 rounded-2xl bg-[color:var(--color-brand-yellow)] text-lg font-bold text-[color:var(--color-graphite)]"
              >
                Confirmar
              </button>
              <button
                onClick={() => setDecimalPend(null)}
                className="h-16 flex-1 rounded-2xl border-2 border-[color:var(--color-graphite)] text-lg font-bold text-[color:var(--color-graphite)]"
              >
                Corregir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comparación de reconteo */}
      {comparacion && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-6">
          <div className="w-[500px] max-w-full rounded-3xl bg-white p-8 text-center">
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Los conteos difieren</h2>
            <div className="mt-5 flex items-center justify-center gap-8 text-[color:var(--color-graphite)]">
              <div>
                <div className="text-sm text-[color:var(--color-graphite-60)]">1º</div>
                <div className="text-5xl font-extrabold tabular">{comparacion.primero}</div>
              </div>
              <div className="text-3xl text-[color:var(--color-graphite-60)]">·</div>
              <div>
                <div className="text-sm text-[color:var(--color-graphite-60)]">2º</div>
                <div className="text-5xl font-extrabold tabular">{comparacion.segundo}</div>
              </div>
            </div>
            <div className="mt-7 flex flex-col gap-3">
              <div className="flex gap-3">
                <button onClick={() => procederGuardar(comparacion.primero)} className="h-14 flex-1 rounded-2xl bg-[color:var(--color-brand-blue)] font-bold text-white">
                  Guardar 1º ({comparacion.primero})
                </button>
                <button onClick={() => procederGuardar(comparacion.segundo)} className="h-14 flex-1 rounded-2xl bg-[color:var(--color-brand-blue)] font-bold text-white">
                  Guardar 2º ({comparacion.segundo})
                </button>
              </div>
              <button
                onClick={() => {
                  setComparacion(null)
                  setReconteo({ activo: true, primero: comparacion.primero })
                  setValor(null)
                }}
                className="h-14 rounded-2xl border-2 border-[color:var(--color-graphite)] font-bold text-[color:var(--color-graphite)]"
              >
                Contar de nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {teclado && (
        <TecladoNumerico
          onCerrar={() => setTeclado(false)}
          onConfirmar={(v) => {
            metodoCapturaRef.current = 'teclado'
            setValor(v)
            setExpresion(null)
            setMensaje('')
            setTeclado(false)
          }}
        />
      )}
    </div>
  )
}
