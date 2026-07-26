import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useSessionStore } from '../../store/useSessionStore'

/** Botón "Salir" con diálogo de confirmación. El progreso queda guardado en la tablet. */
export function SalirButton({ variant = 'outline' }: { variant?: 'outline' | 'ghost' }) {
  const navigate = useNavigate()
  const logout = useSessionStore((s) => s.logout)
  const [confirm, setConfirm] = useState(false)

  const salir = () => {
    logout() // el progreso NO se borra: persiste para retomarlo
    navigate('/login')
  }

  return (
    <>
      <button
        onClick={() => setConfirm(true)}
        className={[
          'flex h-12 items-center gap-2 rounded-full px-4 font-bold no-select active:scale-95',
          variant === 'outline'
            ? 'border border-[#E1E2E6] bg-white text-[color:var(--color-graphite)]'
            : 'text-[color:var(--color-graphite-60)]',
        ].join(' ')}
      >
        <LogOut size={20} /> Salir
      </button>

      {confirm && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/50 p-6" onClick={() => setConfirm(false)}>
          <div className="w-[440px] max-w-full rounded-3xl bg-white p-8 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-extrabold text-[color:var(--color-graphite)]">¿Cerrar sesión?</h2>
            <p className="mt-2 text-[color:var(--color-graphite-60)]">
              Tu progreso queda guardado en la tablet. Podrás retomarlo al volver a entrar con tu PIN.
            </p>
            <div className="mt-6 flex gap-4">
              <button onClick={salir} className="h-16 flex-1 rounded-2xl bg-[color:var(--color-danger)] text-lg font-bold text-white">
                Salir
              </button>
              <button onClick={() => setConfirm(false)} className="h-16 flex-1 rounded-2xl border-2 border-[color:var(--color-graphite)] text-lg font-bold text-[color:var(--color-graphite)]">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
