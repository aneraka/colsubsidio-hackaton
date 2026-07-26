import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { puedeGestionarUsuarios, rolesGestionablesPor } from '../../lib/permisos'
import { normalizar } from '../../lib/texto'
import type { Usuario } from '../../types/domain'
import {
  listarUsuarios,
  listarBodegasReales,
  getAsignacionesDeUsuario,
  asignarBodegas,
  restablecerPin,
  crearUsuario,
  actualizarPerfil,
  type UsuarioAdmin,
  type BodegaReal,
  type AsignacionRol,
} from '../../services/usuarios'
import type { RolBackend } from '../../types/domain'
import { AppCard, BigButton, ListRow, TopBar } from '../../components/ui'

const ROL_LABEL: Record<RolBackend, string> = {
  operario: 'Operario',
  admin: 'Admin',
  super_admin: 'Super admin',
  lider: 'Líder',
}

export function UsuariosScreen() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)

  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null)
  const [seleccionado, setSeleccionado] = useState<UsuarioAdmin | null>(null)
  const [crearAbierto, setCrearAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const cargar = () => {
    listarUsuarios().then(setUsuarios)
  }

  useEffect(() => {
    cargar()
  }, [])

  const filtrados = useMemo(() => {
    if (!usuarios) return null
    const q = normalizar(busqueda)
    if (!q) return usuarios
    return usuarios.filter((u) => normalizar(u.nombre).includes(q) || normalizar(u.correo).includes(q))
  }, [usuarios, busqueda])

  if (!puedeGestionarUsuarios(usuario)) {
    navigate('/inicio')
    return null
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title="Gestión de usuarios"
        onBack={() => navigate('/inicio')}
        backLabel="Inicio"
        right={
          <BigButton variant="blue" size="md" icon={<UserPlus size={20} />} onClick={() => setCrearAbierto(true)}>
            Crear usuario
          </BigButton>
        }
      />

      <div className="mx-auto w-full max-w-[900px] flex-1 overflow-y-auto p-6">
        <div className="relative mb-4">
          <Search
            size={20}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-graphite-60)]"
          />
          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o correo…"
            className="h-14 w-full rounded-xl border border-[#D8D9DD] bg-white pl-12 pr-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
        </div>

        {usuarios === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white/60" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {(filtrados ?? []).map((u) => (
              <ListRow
                key={u.id}
                title={u.nombre}
                subtitle={u.correo}
                right={
                  <span className="text-sm font-bold text-[color:var(--color-brand-blue)]">
                    {ROL_LABEL[u.rolBackend]}
                  </span>
                }
                onClick={() => setSeleccionado(u)}
              />
            ))}
          </div>
        )}
      </div>

      {seleccionado && (
        <DetalleUsuarioDialog usuario={seleccionado} onClose={() => setSeleccionado(null)} onActualizado={cargar} />
      )}

      {crearAbierto && (
        <CrearUsuarioDialog
          usuarioActual={usuario}
          onClose={() => setCrearAbierto(false)}
          onCreado={() => {
            setCrearAbierto(false)
            cargar()
          }}
        />
      )}
    </div>
  )
}

function DetalleUsuarioDialog({
  usuario,
  onClose,
  onActualizado,
}: {
  usuario: UsuarioAdmin
  onClose: () => void
  onActualizado: () => void
}) {
  const [nombre, setNombre] = useState(usuario.nombre)
  const [carneInput, setCarneInput] = useState(usuario.carne ?? '')
  const [datosMsg, setDatosMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [guardandoDatos, setGuardandoDatos] = useState(false)

  const [pin, setPin] = useState('')
  const [pinMsg, setPinMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [guardandoPin, setGuardandoPin] = useState(false)

  const [bodegas, setBodegas] = useState<BodegaReal[] | null>(null)
  const [asignaciones, setAsignaciones] = useState<Record<string, AsignacionRol | null>>({})
  const [bodegasMsg, setBodegasMsg] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null)
  const [guardandoBodegas, setGuardandoBodegas] = useState(false)

  const esOperario = usuario.rolBackend === 'operario'

  useEffect(() => {
    if (!esOperario) return
    let cancelado = false
    Promise.all([listarBodegasReales(), getAsignacionesDeUsuario(usuario.id)]).then(([todas, actuales]) => {
      if (cancelado) return
      setBodegas(todas)
      const mapa: Record<string, AsignacionRol | null> = {}
      for (const b of todas) mapa[b.id] = null
      for (const a of actuales) mapa[a.warehouseId] = a.rol
      setAsignaciones(mapa)
    })
    return () => {
      cancelado = true
    }
  }, [usuario.id, esOperario])

  const guardarDatos = async () => {
    if (!nombre.trim()) {
      setDatosMsg({ tipo: 'error', texto: 'El nombre no puede estar vacío' })
      return
    }
    setGuardandoDatos(true)
    try {
      await actualizarPerfil(usuario.id, { nombre: nombre.trim(), carne: carneInput.trim() || null })
      setDatosMsg({ tipo: 'ok', texto: 'Datos actualizados' })
      onActualizado()
    } catch (e) {
      setDatosMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setGuardandoDatos(false)
    }
  }

  const guardarPin = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setPinMsg({ tipo: 'error', texto: 'El PIN debe tener 6 dígitos' })
      return
    }
    setGuardandoPin(true)
    try {
      await restablecerPin(usuario.id, pin)
      setPinMsg({ tipo: 'ok', texto: 'PIN actualizado' })
      setPin('')
    } catch (e) {
      setPinMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo actualizar' })
    } finally {
      setGuardandoPin(false)
    }
  }

  const guardarBodegas = async () => {
    setGuardandoBodegas(true)
    try {
      const lista = Object.entries(asignaciones)
        .filter((entry): entry is [string, AsignacionRol] => entry[1] !== null)
        .map(([warehouseId, rol]) => ({ warehouseId, rol }))
      await asignarBodegas(usuario.id, lista)
      setBodegasMsg({ tipo: 'ok', texto: 'Bodegas guardadas' })
    } catch (e) {
      setBodegasMsg({ tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo guardar' })
    } finally {
      setGuardandoBodegas(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <AppCard
        radius={24}
        padding="p-8"
        className="max-h-[85vh] w-[560px] max-w-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">{usuario.nombre}</h2>
        <p className="text-[color:var(--color-graphite-60)]">
          {usuario.correo} · {ROL_LABEL[usuario.rolBackend]}
        </p>

        <div className="mt-6">
          <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">Datos del usuario</h3>
          <div className="flex flex-col gap-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre"
              className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
            />
            <input
              value={carneInput}
              onChange={(e) => setCarneInput(e.target.value)}
              placeholder="Carné (código de barras, opcional)"
              className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
            />
            <BigButton variant="blue" size="md" disabled={guardandoDatos} onClick={guardarDatos}>
              Guardar
            </BigButton>
          </div>
          {datosMsg && (
            <p
              className={`mt-2 text-sm font-semibold ${datosMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}
            >
              {datosMsg.texto}
            </p>
          )}
        </div>

        <div className="mt-6">
          <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">Restablecer PIN</h3>
          <div className="flex gap-3">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Nuevo PIN (6 dígitos)"
              className="h-14 flex-1 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
            />
            <BigButton variant="blue" size="md" disabled={guardandoPin} onClick={guardarPin}>
              Guardar
            </BigButton>
          </div>
          {pinMsg && (
            <p
              className={`mt-2 text-sm font-semibold ${pinMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}
            >
              {pinMsg.texto}
            </p>
          )}
        </div>

        {esOperario && (
          <div className="mt-7">
            <h3 className="mb-2 font-bold text-[color:var(--color-graphite)]">Bodegas a cargo</h3>
            {bodegas === null ? (
              <p className="text-[color:var(--color-graphite-60)]">Cargando…</p>
            ) : (
              <div className="flex flex-col gap-2">
                {bodegas.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-xl border border-[#E7E8EC] px-4 py-3"
                  >
                    <span className="font-semibold text-[color:var(--color-graphite)]">{b.nombre}</span>
                    <div className="flex gap-2">
                      {(['principal', 'revisor'] as const).map((rol) => (
                        <button
                          key={rol}
                          onClick={() =>
                            setAsignaciones((prev) => ({ ...prev, [b.id]: prev[b.id] === rol ? null : rol }))
                          }
                          className="rounded-full px-3 py-1.5 text-sm font-bold no-select"
                          style={
                            asignaciones[b.id] === rol
                              ? { background: 'var(--color-brand-blue)', color: '#fff' }
                              : { background: '#ECEDF0', color: 'var(--color-graphite-60)' }
                          }
                        >
                          {rol === 'principal' ? 'Principal' : 'Secundario'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <BigButton
              variant="blue"
              size="md"
              className="mt-4"
              disabled={guardandoBodegas || bodegas === null}
              onClick={guardarBodegas}
            >
              Guardar bodegas
            </BigButton>
            {bodegasMsg && (
              <p
                className={`mt-2 text-sm font-semibold ${bodegasMsg.tipo === 'ok' ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}
              >
                {bodegasMsg.texto}
              </p>
            )}
          </div>
        )}

        <BigButton variant="secondary" size="md" fullWidth className="mt-7" onClick={onClose}>
          Cerrar
        </BigButton>
      </AppCard>
    </div>
  )
}

function CrearUsuarioDialog({
  usuarioActual,
  onClose,
  onCreado,
}: {
  usuarioActual: Usuario | null
  onClose: () => void
  onCreado: () => void
}) {
  const opcionesRol = rolesGestionablesPor(usuarioActual)
  const [correo, setCorreo] = useState('')
  const [nombre, setNombre] = useState('')
  const [pin, setPin] = useState('')
  const [carne, setCarne] = useState('')
  const [rol, setRol] = useState<RolBackend>(opcionesRol[0] ?? 'operario')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const crear = async () => {
    if (!correo.trim() || !nombre.trim() || !/^\d{6}$/.test(pin)) {
      setError('Completa correo, nombre y un PIN de 6 dígitos')
      return
    }
    setGuardando(true)
    setError('')
    try {
      await crearUsuario(correo.trim().toLowerCase(), pin, rol, nombre.trim(), carne.trim() || undefined)
      onCreado()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el usuario')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={onClose}>
      <AppCard radius={24} padding="p-8" className="w-[480px] max-w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Crear usuario</h2>
        <div className="mt-5 flex flex-col gap-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre"
            className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
          <input
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="nombre.apellido@colsubsidio.com"
            className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="PIN inicial (6 dígitos)"
            className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
          <input
            value={carne}
            onChange={(e) => setCarne(e.target.value)}
            placeholder="Carné (código de barras, opcional)"
            className="h-14 rounded-xl border border-[#D8D9DD] bg-white px-4 text-lg outline-none focus:border-[color:var(--color-brand-blue)]"
          />
          <div className="flex gap-2">
            {opcionesRol.map((r) => (
              <button
                key={r}
                onClick={() => setRol(r)}
                className="flex-1 rounded-xl px-3 py-3 text-sm font-bold no-select"
                style={
                  rol === r
                    ? { background: 'var(--color-brand-blue)', color: '#fff' }
                    : { background: '#ECEDF0', color: 'var(--color-graphite-60)' }
                }
              >
                {ROL_LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="mt-3 text-sm font-semibold text-[color:var(--color-danger)]">{error}</p>}
        <div className="mt-6 flex gap-4">
          <BigButton variant="blue" size="md" fullWidth disabled={guardando} onClick={crear}>
            Crear
          </BigButton>
          <BigButton variant="secondary" size="md" fullWidth onClick={onClose}>
            Cancelar
          </BigButton>
        </div>
      </AppCard>
    </div>
  )
}
