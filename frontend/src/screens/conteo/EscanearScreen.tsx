import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft, Check, Keyboard, Loader2 } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'
import type { Producto } from '../../types/domain'
import { resolverBarcode, enrolarBarcode } from '../../services/barcode'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useToast } from '../../store/useToast'
import { BuscadorNombre } from '../../components/conteo/BuscadorNombre'
import { BigButton, Chip } from '../../components/ui'
import { NavMenu } from '../../components/layout/NavMenu'

const READER_ID = 'qr-reader'

export function EscanearScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const modoCarne = (location.state as { modo?: string } | null)?.modo === 'carne'

  const identificar = useCountingStore((s) => s.identificarProducto)
  const loginCarne = useSessionStore((s) => s.loginCarne)
  const usuario = useSessionStore((s) => s.usuario)
  const mostrar = useToast((s) => s.mostrar)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const procesandoRef = useRef(false)
  const [detectado, setDetectado] = useState(false)
  const [sinCamara, setSinCamara] = useState(false)
  const [solicitando, setSolicitando] = useState(true)
  const [simular, setSimular] = useState('')
  const [enrolarEan, setEnrolarEan] = useState<string | null>(null)

  const detenerScanner = async () => {
    const s = scannerRef.current
    if (s) {
      try {
        await s.stop()
        await s.clear()
      } catch {
        /* noop */
      }
      scannerRef.current = null
    }
  }

  const procesar = async (ean: string) => {
    if (procesandoRef.current) return
    procesandoRef.current = true
    setDetectado(true)
    await detenerScanner()

    if (modoCarne) {
      // Login por carné: busca el código en usuarios.carne.
      if (loginCarne(ean)) {
        navigate('/inicio')
      } else {
        mostrar('Carné no reconocido', 'warning')
        procesandoRef.current = false
        setDetectado(false)
      }
      return
    }
    const p = await resolverBarcode(ean)
    if (p) {
      identificar(p, 'escaneo')
      navigate('/conteo/ficha')
    } else {
      setEnrolarEan(ean)
      procesandoRef.current = false
      setDetectado(false)
    }
  }

  useEffect(() => {
    let cancelado = false
    let resuelto = false
    // Abre la cámara real (trasera) al montar. Requiere localhost o HTTPS.
    const scanner = new Html5Qrcode(READER_ID, { verbose: false })
    scannerRef.current = scanner
    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 280, height: 180 } },
        (texto) => void procesar(texto),
        () => {},
      )
      .then(() => {
        resuelto = true
        if (!cancelado) setSolicitando(false) // stream activo, escaneando
      })
      .catch(() => {
        resuelto = true
        if (!cancelado) {
          setSolicitando(false)
          setSinCamara(true) // permiso denegado / sin cámara → fallback
        }
      })

    // Salvavidas: si la cámara no responde en 6s, cae al fallback (la demo no se cuelga).
    const timeout = setTimeout(() => {
      if (!cancelado && !resuelto) {
        setSolicitando(false)
        setSinCamara(true)
      }
    }, 6000)

    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's') {
        setSolicitando(false)
        setSinCamara(true)
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      cancelado = true
      clearTimeout(timeout)
      window.removeEventListener('keydown', onKey)
      void detenerScanner() // libera la cámara al salir (no queda el LED encendido)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Modo producto requiere sesión; el modo carné no (aún no hay usuario).
  if (!modoCarne && !usuario) {
    navigate('/login')
    return null
  }

  const elegirEnrolamiento = async (p: Producto) => {
    if (!enrolarEan) return
    await enrolarBarcode(enrolarEan, p.id)
    mostrar('Código aprendido ✓', 'success')
    identificar(p, 'escaneo')
    navigate('/conteo/ficha')
  }

  return (
    <div className="relative flex min-h-full flex-col" style={{ background: 'var(--color-camera)' }}>
      {!modoCarne && <NavMenu variant="floating" />}

      {/* Header */}
      <div className="absolute top-0 right-0 left-0 z-20 flex items-center justify-between p-4">
        <button
          onClick={() => navigate(modoCarne ? '/login' : '/conteo/identificar')}
          aria-label="Volver"
          className="flex h-14 items-center gap-1.5 rounded-full bg-white/15 px-4 font-semibold text-white backdrop-blur no-select active:scale-95"
        >
          <ChevronLeft size={26} /> Volver
        </button>
        <p className="text-lg font-semibold text-white">
          {modoCarne ? 'Escanea tu carné' : 'Acerca el código de barras'}
        </p>
        <div className="w-14" />
      </div>

      {/* Viewport de cámara */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <div id={READER_ID} className="h-full w-full [&_video]:h-full [&_video]:w-full [&_video]:object-cover" />

        {/* Estado: solicitando permiso de cámara */}
        {solicitando && !sinCamara && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
            <Loader2 size={52} className="animate-spin text-white/80" />
            <p className="text-lg text-white/80">Solicitando cámara…</p>
          </div>
        )}

        {/* Retícula amarilla (solo con stream activo) */}
        {!sinCamara && !solicitando && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div
              className="relative rounded-2xl"
              style={{ width: 300, height: 200, boxShadow: '0 0 0 4000px rgba(0,0,0,0.35)', border: '4px solid var(--color-brand-yellow)' }}
            >
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-[color:var(--color-brand-yellow)]" style={{ animation: 'mic-wave 0s' }} />
            </div>
          </div>
        )}

        {detectado && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2">
            <Chip variant="success">
              <Check size={16} /> Código detectado
            </Chip>
          </div>
        )}

        {/* Fallback sin cámara / simular EAN */}
        {sinCamara && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-8 text-center">
            <Keyboard size={56} className="text-white/70" />
            <p className="max-w-md text-lg font-semibold text-white">No hay acceso a la cámara</p>
            <p className="max-w-md text-white/70">
              Revisa el permiso de cámara (o usa localhost/HTTPS). Mientras tanto, simula un código para probar el flujo.
            </p>
            <div className="flex w-full max-w-md gap-3">
              <input
                value={simular}
                onChange={(e) => setSimular(e.target.value)}
                placeholder="EAN (ej. 7702011012345)"
                className="h-14 flex-1 rounded-2xl border border-white/30 bg-white px-4 text-lg text-[color:var(--color-graphite)]"
              />
              <BigButton variant="primary" size="md" disabled={!simular} onClick={() => procesar(simular.trim())}>
                Simular
              </BigButton>
            </div>
            <div className="flex flex-wrap justify-center gap-2 text-sm text-white/60">
              <button className="underline" onClick={() => procesar('7702011012345')}>EAN mapeado (ARAGÁN)</button>
              <button className="underline" onClick={() => procesar('0000000000000')}>EAN nuevo (enrolar)</button>
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <button
        onClick={() => navigate('/conteo/identificar')}
        className="z-20 bg-white py-4 text-center text-lg font-semibold text-[color:var(--color-brand-blue)] no-select"
      >
        ¿No lo encuentra? Usar Código o Nombre
      </button>

      {/* Enrolamiento de código nuevo */}
      {enrolarEan && (
        <div className="fixed inset-0 z-[600] flex items-end justify-center bg-black/50" onClick={() => setEnrolarEan(null)}>
          <div
            className="screen-enter w-full max-w-2xl rounded-t-3xl bg-white p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">
              Código nuevo — ¿a qué artículo pertenece?
            </h2>
            <p className="mt-1 mb-4 text-[color:var(--color-graphite-60)]">EAN {enrolarEan}</p>
            <BuscadorNombre autoFocus onElegir={elegirEnrolamiento} onMultiples={(c) => c[0] && elegirEnrolamiento(c[0])} />
          </div>
        </div>
      )}
    </div>
  )
}
