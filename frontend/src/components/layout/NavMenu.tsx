import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, Home, Warehouse, ListChecks, FileSpreadsheet, History, LogOut } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'
import { useCountingStore } from '../../store/useCountingStore'
import { getProductosDeZona } from '../../data/mock/productos'
import { puedeExportar } from '../../lib/permisos'

/**
 * Menú de navegación libre, disponible en todas las pantallas post-login.
 * Permite saltar entre Bodegas, Progreso de zona y Reporte sin perder el conteo,
 * y salir de la sesión (el progreso queda persistido en la tablet).
 */
export function NavMenu({ variant = 'inline' }: { variant?: 'inline' | 'floating' }) {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const logout = useSessionStore((s) => s.logout)
  const zona = useCountingStore((s) => s.zonaActiva)
  const contadosEnZona = useCountingStore((s) => s.contadosEnZona)
  const [open, setOpen] = useState(false)
  const [confirmSalir, setConfirmSalir] = useState(false)

  if (!usuario) return null

  const total = zona ? getProductosDeZona(zona.id).length : 0
  const pct = zona && total > 0 ? Math.round((contadosEnZona(zona.id) / total) * 100) : 0

  const ir = (ruta: string) => {
    setOpen(false)
    navigate(ruta)
  }

  const salir = () => {
    logout() // el progreso NO se borra: persiste en el store para retomarlo
    navigate('/login')
  }

  const trigger =
    variant === 'floating' ? (
      <button
        onClick={() => setOpen(true)}
        aria-label="Menú"
        className="fixed top-4 right-4 z-[400] flex h-14 w-14 items-center justify-center rounded-full bg-white text-[color:var(--color-graphite)] shadow-[0_4px_16px_rgba(0,0,0,0.18)] no-select active:scale-95"
      >
        <Menu size={26} />
      </button>
    ) : (
      <button
        onClick={() => setOpen(true)}
        aria-label="Menú"
        className="flex h-14 items-center gap-2 rounded-full border border-[#E1E2E6] bg-white px-4 font-bold text-[color:var(--color-graphite)] no-select active:scale-95"
      >
        <Menu size={22} />
        <span className="hidden sm:inline">Menú</span>
      </button>
    )

  return (
    <>
      {trigger}

      {open && (
        <div className="fixed inset-0 z-[700] flex justify-end bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="screen-enter flex h-full w-[380px] max-w-full flex-col gap-3 bg-white p-6 shadow-[-8px_0_32px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">Navegación</h2>
              <button onClick={() => setOpen(false)} aria-label="Cerrar" className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ECEDF0]">
                <X size={22} />
              </button>
            </div>

            <NavItem icon={<Home size={24} />} label="Inicio" onClick={() => ir('/inicio')} />
            <NavItem icon={<Warehouse size={24} />} label="Contar bodega" onClick={() => ir('/bodegas')} />
            <NavItem icon={<ListChecks size={24} />} label="Registros cargados" onClick={() => ir('/registros')} />
            {zona && (
              <NavItem
                icon={<ListChecks size={24} />}
                label={`Progreso ${pct}%`}
                sub={`Zona ${zona.nombre} · ${contadosEnZona(zona.id)}/${total}`}
                onClick={() => ir('/zona/progreso')}
              />
            )}
            <NavItem icon={<History size={24} />} label="Histórico de conteos" onClick={() => ir('/historico')} />
            <NavItem
              icon={<FileSpreadsheet size={24} />}
              label={puedeExportar(usuario) ? 'Reporte / Exportar' : 'Reporte'}
              onClick={() => ir('/reporte')}
            />

            <div className="mt-auto">
              <button
                onClick={() => setConfirmSalir(true)}
                className="flex h-16 w-full items-center gap-3 rounded-2xl border-2 border-[color:var(--color-danger)] px-5 font-bold text-[color:var(--color-danger)] no-select active:scale-[0.99]"
              >
                <LogOut size={24} /> Salir
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmSalir && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={() => setConfirmSalir(false)}>
          <div className="w-[440px] max-w-full rounded-3xl bg-white p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">¿Cerrar sesión?</h2>
            <p className="mt-2 text-[color:var(--color-graphite-60)]">
              Tu progreso queda guardado en la tablet. Podrás retomarlo al volver a entrar con tu PIN.
            </p>
            <div className="mt-6 flex gap-4">
              <button onClick={salir} className="h-16 flex-1 rounded-2xl bg-[color:var(--color-danger)] text-lg font-bold text-white">
                Salir
              </button>
              <button onClick={() => setConfirmSalir(false)} className="h-16 flex-1 rounded-2xl border-2 border-[color:var(--color-graphite)] text-lg font-bold text-[color:var(--color-graphite)]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function NavItem({ icon, label, sub, onClick }: { icon: React.ReactNode; label: string; sub?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-2xl border border-[#E7E8EC] bg-white px-5 py-4 text-left no-select active:scale-[0.99]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: 'var(--color-brand-blue-soft)', color: 'var(--color-brand-blue)' }}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-lg font-bold text-[color:var(--color-graphite)]">{label}</div>
        {sub && <div className="truncate text-sm text-[color:var(--color-graphite-60)]">{sub}</div>}
      </div>
    </button>
  )
}
