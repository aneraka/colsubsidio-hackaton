import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CloudOff, CloudCheck, RefreshCw } from 'lucide-react'
import { useSyncStore } from '../../store/useSyncStore'
import { AppCard, BigButton, TopBar } from '../../components/ui'

export function OfflineScreen() {
  const navigate = useNavigate()
  const pendientes = useSyncStore((s) => s.pendientes)
  const sincronizando = useSyncStore((s) => s.sincronizando)
  const sincronizar = useSyncStore((s) => s.sincronizar)
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

  const enCola = pendientes > 0
  const amber = !online || enCola

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Sincronización" onBack={() => navigate(-1)} />

      <div className="flex flex-1 items-center justify-center p-6">
        <AppCard radius={24} padding="p-10" className="w-[560px] max-w-full text-center">
          <div className="flex justify-center">
            <div
              className="flex h-24 w-24 items-center justify-center rounded-full"
              style={{ background: amber ? 'var(--color-warning-bg)' : '#E4F5EC' }}
            >
              {amber ? (
                <CloudOff size={52} style={{ color: 'var(--color-warning)' }} />
              ) : (
                <CloudCheck size={52} style={{ color: 'var(--color-success)' }} />
              )}
            </div>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-[color:var(--color-graphite)]">
            {online ? (enCola ? 'Guardando local' : 'Todo sincronizado') : 'Sin conexión — guardando local'}
          </h1>
          <p className="mt-2 text-[color:var(--color-graphite-60)]">
            Tus conteos se guardan en la tablet y se subirán solos cuando vuelva la red.
          </p>

          <div className="mt-7 rounded-2xl bg-[color:var(--color-bg)] p-5">
            <div className="text-5xl font-extrabold tabular text-[color:var(--color-graphite)]">{pendientes}</div>
            <div className="text-sm text-[color:var(--color-graphite-60)]">capturas en cola</div>
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-[#E7E8EC]">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: sincronizando ? '100%' : enCola ? '35%' : '0%',
                  background: sincronizando ? 'var(--color-brand-blue)' : 'var(--color-warning)',
                }}
              />
            </div>
          </div>

          <div className="mt-6">
            <BigButton
              variant="blue"
              size="lg"
              fullWidth
              icon={<RefreshCw size={22} className={sincronizando ? 'animate-spin' : ''} />}
              disabled={!enCola || sincronizando}
              onClick={() => void sincronizar()}
            >
              {sincronizando ? 'Sincronizando…' : 'Sincronizar ahora'}
            </BigButton>
          </div>
        </AppCard>
      </div>
    </div>
  )
}
