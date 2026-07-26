import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Mail, Barcode, ScanLine } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { validarCorreo } from '../../data/mock/usuarios'
import { AppCard, BigButton, BrandLogo, PinDots, PinKeypad, RolPill } from '../../components/ui'

type Tab = 'pin' | 'correo' | 'carne'

export function LoginScreen() {
  const navigate = useNavigate()
  const loginPin = useSessionStore((s) => s.loginPin)
  const loginCorreo = useSessionStore((s) => s.loginCorreo)
  const loginCarne = useSessionStore((s) => s.loginCarne)

  const [tab, setTab] = useState<Tab>('pin')
  const [pin, setPin] = useState('')
  const [correoPin, setCorreoPin] = useState('')
  const [correo, setCorreo] = useState('')
  const [carne, setCarne] = useState('')
  const [error, setError] = useState('')
  const [okUsuario, setOkUsuario] = useState<{ nombre: string; rol: 'contador' | 'auditor' } | null>(null)

  // ---- Correo con código (OTP simulado) ----
  const [otpPaso, setOtpPaso] = useState<'email' | 'codigo'>('email')
  const [otpCodigo, setOtpCodigo] = useState('')
  const [otpCodigoGenerado, setOtpCodigoGenerado] = useState<string | null>(null)

  const entrar = () => {
    const u = useSessionStore.getState().usuario!
    setOkUsuario({ nombre: u.nombre, rol: u.rol })
    setTimeout(() => navigate('/inicio'), 850)
  }

  // ---- PIN (real, contra Supabase Auth — ver services/auth.ts) ----
  useEffect(() => {
    if (tab !== 'pin' || pin.length !== 6) return
    if (!correoPin.trim()) {
      setError('Ingresa tu correo')
      setTimeout(() => {
        setPin('')
        setError('')
      }, 900)
      return
    }
    let cancelado = false
    void (async () => {
      const ok = await loginPin(correoPin, pin)
      if (cancelado) return
      if (ok) {
        entrar()
      } else {
        setError('Correo o PIN incorrecto')
        setTimeout(() => {
          setPin('')
          setError('')
        }, 700)
      }
    })()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])

  // ---- Correo con código (simulado, sin backend todavía) ----
  const generarCodigo = () => String(Math.floor(100000 + Math.random() * 900000))

  const enviarCodigo = () => {
    if (!validarCorreo(correo)) {
      setError('No encontramos ese correo. Usa tu correo @colsubsidio.com.')
      return
    }
    // TODO(backend): reemplazar por supabase.auth.signInWithOtp({ email: correo })
    const codigo = generarCodigo()
    setOtpCodigoGenerado(codigo)
    setOtpCodigo('')
    setError('')
    setOtpPaso('codigo')
    console.info('[login-otp] sin backend — código de prueba: ' + codigo)
  }

  useEffect(() => {
    if (tab !== 'correo' || otpPaso !== 'codigo' || otpCodigo.length !== 6) return
    // TODO(backend): reemplazar por supabase.auth.verifyOtp({ email: correo, token: otpCodigo, type: 'email' })
    if (otpCodigo === otpCodigoGenerado && loginCorreo(correo)) {
      entrar()
    } else {
      setError('Código incorrecto')
      setTimeout(() => {
        setOtpCodigo('')
        setError('')
      }, 700)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpCodigo])

  const cambiarCorreoOtp = () => {
    setOtpPaso('email')
    setOtpCodigo('')
    setOtpCodigoGenerado(null)
    setError('')
  }

  const entrarCarneManual = () => {
    if (loginCarne(carne)) entrar()
    else setError('Carné no reconocido.')
  }

  const cambiarTab = (t: Tab) => {
    setTab(t)
    setError('')
    setPin('')
    setOtpPaso('email')
    setOtpCodigo('')
    setOtpCodigoGenerado(null)
  }

  if (okUsuario) {
    return (
      <div className="screen-enter flex min-h-full items-center justify-center px-10">
        <AppCard radius={24} padding="p-10" className="flex w-[420px] max-w-full flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full text-white number-pop" style={{ background: 'var(--color-success)' }}>
            <Check size={44} strokeWidth={3} />
          </div>
          <div className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Hola, {okUsuario.nombre} 👋</div>
          <RolPill rol={okUsuario.rol} />
        </AppCard>
      </div>
    )
  }

  return (
    <div className="screen-enter flex min-h-full items-center justify-center px-10 py-8">
      <AppCard radius={24} padding="p-9" className="w-[460px] max-w-full">
        <div className="flex flex-col items-center gap-5">
          <BrandLogo size="lg" />
          <div className="text-center">
            <h1 className="text-3xl font-extrabold text-[color:var(--color-brand-blue)]">Agente de Inventario</h1>
            <p className="mt-1 text-[color:var(--color-graphite-60)]">Ingresa con tu método preferido</p>
          </div>

          {/* Segmented control */}
          <div className="flex w-full gap-2 rounded-2xl bg-[#ECEDF0] p-1.5">
            {([['pin', 'PIN'], ['correo', 'Correo'], ['carne', 'Carné']] as [Tab, string][]).map(([t, label]) => (
              <button
                key={t}
                onClick={() => cambiarTab(t)}
                className="h-16 flex-1 rounded-xl text-lg font-bold no-select transition-colors"
                style={
                  tab === t
                    ? { background: '#fff', color: 'var(--color-graphite)', boxShadow: 'var(--shadow-card)' }
                    : { background: 'transparent', color: 'var(--color-graphite-60)' }
                }
              >
                {label}
              </button>
            ))}
          </div>

          {error && <p className="text-center font-semibold text-[color:var(--color-danger)]">{error}</p>}

          {tab === 'pin' && (
            <div className="flex w-full flex-col items-center gap-5">
              <div className="relative w-full">
                <Mail size={22} className="absolute top-1/2 left-4 -translate-y-1/2 text-[color:var(--color-graphite-60)]" />
                <input
                  value={correoPin}
                  onChange={(e) => setCorreoPin(e.target.value)}
                  placeholder="nombre.apellido@colsubsidio.com"
                  className="h-16 w-full rounded-2xl border border-[#D8D9DD] bg-white pr-4 pl-12 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
                />
              </div>
              <PinDots length={6} filled={pin.length} error={!!error} />
              <PinKeypad onDigit={(d) => setPin((p) => (p.length < 6 ? p + d : p))} onBackspace={() => setPin((p) => p.slice(0, -1))} />
            </div>
          )}

          {tab === 'correo' && otpPaso === 'email' && (
            <div className="flex w-full flex-col gap-3">
              <div className="relative">
                <Mail size={22} className="absolute top-1/2 left-4 -translate-y-1/2 text-[color:var(--color-graphite-60)]" />
                <input
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && enviarCodigo()}
                  placeholder="nombre.apellido@colsubsidio.com"
                  className="h-16 w-full rounded-2xl border border-[#D8D9DD] bg-white pr-4 pl-12 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
                />
              </div>
              <BigButton variant="primary" size="lg" fullWidth disabled={!correo} onClick={enviarCodigo}>
                Enviar código
              </BigButton>
            </div>
          )}

          {tab === 'correo' && otpPaso === 'codigo' && (
            <div className="flex w-full flex-col items-center gap-5">
              <p className="text-center text-[color:var(--color-graphite-60)]">
                Te enviamos un código a <strong className="text-[color:var(--color-graphite)]">{correo}</strong>
              </p>
              <PinDots length={6} filled={otpCodigo.length} error={!!error} />
              <PinKeypad
                onDigit={(d) => setOtpCodigo((c) => (c.length < 6 ? c + d : c))}
                onBackspace={() => setOtpCodigo((c) => c.slice(0, -1))}
              />
              <div className="flex gap-5 text-sm font-semibold">
                <button onClick={enviarCodigo} className="text-[color:var(--color-brand-blue)] underline">
                  Reenviar código
                </button>
                <button onClick={cambiarCorreoOtp} className="text-[color:var(--color-graphite-60)] underline">
                  Cambiar correo
                </button>
              </div>
            </div>
          )}

          {tab === 'carne' && (
            <div className="flex w-full flex-col gap-3">
              <BigButton
                variant="blue"
                size="lg"
                fullWidth
                icon={<ScanLine size={24} />}
                onClick={() => navigate('/conteo/escanear', { state: { modo: 'carne' } })}
              >
                Escanear carné (cámara)
              </BigButton>
              <div className="relative">
                <Barcode size={22} className="absolute top-1/2 left-4 -translate-y-1/2 text-[color:var(--color-graphite-60)]" />
                <input
                  value={carne}
                  onChange={(e) => setCarne(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && entrarCarneManual()}
                  placeholder="Digitar código del carné (ej. CARNE-1042)"
                  className="h-16 w-full rounded-2xl border border-[#D8D9DD] bg-white pr-4 pl-12 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
                />
              </div>
              <BigButton variant="secondary" size="md" fullWidth disabled={!carne} onClick={entrarCarneManual}>
                Entrar con código
              </BigButton>
              {import.meta.env.DEV && (
                <button
                  onClick={() => {
                    if (loginCarne('CARNE-3001')) entrar()
                  }}
                  className="text-sm text-[color:var(--color-brand-blue)] underline"
                >
                  Simular carné de Viviana (auditora)
                </button>
              )}
            </div>
          )}
        </div>
      </AppCard>
    </div>
  )
}
