import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect, type ReactNode } from 'react'
import { TabletShell } from './components/layout/TabletShell'
import { useSessionStore } from './store/useSessionStore'
import { useSyncStore } from './store/useSyncStore'
import { LoginScreen } from './screens/login/LoginScreen'
import { InicioScreen } from './screens/inicio/InicioScreen'
import { RegistrosScreen } from './screens/registros/RegistrosScreen'
import { HistoricoScreen } from './screens/historico/HistoricoScreen'
import { AlertasScreen } from './screens/alertas/AlertasScreen'
import { BodegasScreen } from './screens/bodegas/BodegasScreen'
import { ZonasScreen } from './screens/bodegas/ZonasScreen'
import { IdentificarScreen } from './screens/conteo/IdentificarScreen'
import { EscanearScreen } from './screens/conteo/EscanearScreen'
import { DesambiguarScreen } from './screens/conteo/DesambiguarScreen'
import { FichaScreen } from './screens/conteo/FichaScreen'
import { VozScreen } from './screens/conteo/VozScreen'
import { AnomaliaScreen } from './screens/conteo/AnomaliaScreen'
import { ProgresoScreen } from './screens/zona/ProgresoScreen'
import { ReporteScreen } from './screens/reporte/ReporteScreen'
import { OfflineScreen } from './screens/offline/OfflineScreen'
import { DevUIScreen } from './screens/dev/DevUIScreen'

/** Ruta protegida: sin sesión → /login (excepto /dev/ui, que es herramienta de QA). */
function RequireAuth({ children }: { children: ReactNode }) {
  const usuario = useSessionStore((s) => s.usuario)
  const location = useLocation()
  if (!usuario) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}

function App() {
  // Al reconectar, sincroniza la cola de capturas (simulado en esta fase).
  useEffect(() => {
    const onOnline = () => void useSyncStore.getState().sincronizar()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [])

  return (
    <TabletShell>
      <Routes>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/login" element={<LoginScreen />} />

        <Route path="/inicio" element={<RequireAuth><InicioScreen /></RequireAuth>} />
        <Route path="/registros" element={<RequireAuth><RegistrosScreen /></RequireAuth>} />
        <Route path="/historico" element={<RequireAuth><HistoricoScreen /></RequireAuth>} />
        <Route path="/alertas" element={<RequireAuth><AlertasScreen /></RequireAuth>} />

        <Route path="/bodegas" element={<RequireAuth><BodegasScreen /></RequireAuth>} />
        <Route path="/bodegas/:bodegaId/zonas" element={<RequireAuth><ZonasScreen /></RequireAuth>} />

        <Route path="/conteo/identificar" element={<RequireAuth><IdentificarScreen /></RequireAuth>} />
        {/* Escáner: sin guardia porque el login por carné lo abre antes de haber sesión */}
        <Route path="/conteo/escanear" element={<EscanearScreen />} />
        <Route path="/conteo/desambiguar" element={<RequireAuth><DesambiguarScreen /></RequireAuth>} />
        <Route path="/conteo/ficha" element={<RequireAuth><FichaScreen /></RequireAuth>} />
        <Route path="/conteo/voz" element={<RequireAuth><VozScreen /></RequireAuth>} />
        <Route path="/conteo/anomalia" element={<RequireAuth><AnomaliaScreen /></RequireAuth>} />

        <Route path="/zona/progreso" element={<RequireAuth><ProgresoScreen /></RequireAuth>} />
        <Route path="/reporte" element={<RequireAuth><ReporteScreen /></RequireAuth>} />
        <Route path="/offline" element={<RequireAuth><OfflineScreen /></RequireAuth>} />

        {/* Galería del design system — accesible sin sesión para QA visual */}
        <Route path="/dev/ui" element={<DevUIScreen />} />

        <Route path="*" element={<Navigate to="/inicio" replace />} />
      </Routes>
    </TabletShell>
  )
}

export default App
