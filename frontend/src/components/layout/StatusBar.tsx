import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSessionStore } from '../../store/useSessionStore'
import { useSyncStore } from '../../store/useSyncStore'
import { RolPill } from '../ui/RolPill'

/**
 * Barra de estado inferior fija: pill de red (online/offline) + usuario + rol.
 * Tocar la pill abre la pantalla de sincronización.
 */
export function StatusBar() {
  const navigate = useNavigate()
  const usuario = useSessionStore((s) => s.usuario)
  const pendientes = useSyncStore((s) => s.pendientes)
  const [online, setOnline] = useState(navigator.onLine)

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  return (
    <footer className="flex h-12 shrink-0 items-center justify-between bg-[color:var(--color-graphite)] px-5 text-white no-select">
      <button
        onClick={() => navigate('/offline')}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold active:scale-95"
        style={{
          background: online ? 'rgba(46,158,91,0.2)' : 'rgba(245,166,35,0.2)',
          color: online ? '#7CE0A3' : '#FFD08A',
        }}
      >
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ background: online ? 'var(--color-success)' : 'var(--color-warning)' }}
        />
        {online ? 'Red corporativa' : 'Sin conexión — guardando local'}
        {pendientes > 0 && <span className="ml-1 opacity-80">· {pendientes} en cola</span>}
      </button>
      {usuario && (
        <span className="flex items-center gap-2 text-sm text-white/80">
          {usuario.nombre}
          <RolPill rol={usuario.rol} size="sm" />
        </span>
      )}
    </footer>
  )
}
