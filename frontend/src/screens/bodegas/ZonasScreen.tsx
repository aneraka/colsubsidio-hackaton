import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import type { Zona } from '../../types/domain'
import { getZonas } from '../../services/catalog'
import { getBodegaById } from '../../data/mock/bodegas'
import { getProductosDeZona } from '../../data/mock/productos'
import { useCountingStore } from '../../store/useCountingStore'
import { useSessionStore } from '../../store/useSessionStore'
import { useToast } from '../../store/useToast'
import { BigButton, Chip, ListRow, ProgressRing, TopBar } from '../../components/ui'
import { fechaCicloTexto } from '../../lib/fecha'

export function ZonasScreen() {
  const navigate = useNavigate()
  const { bodegaId = '' } = useParams()
  const bodega = getBodegaById(bodegaId)
  const usuario = useSessionStore((s) => s.usuario)
  const iniciarSesion = useCountingStore((s) => s.iniciarSesion)
  const contadosEnZona = useCountingStore((s) => s.contadosEnZona)
  const zonasCerradas = useCountingStore((s) => s.zonasCerradas)
  const capturas = useCountingStore((s) => s.capturas) // fuerza re-render de los anillos
  const mostrar = useToast((s) => s.mostrar)

  const [zonas, setZonas] = useState<Zona[] | null>(null)
  const [seleccion, setSeleccion] = useState<string | null>(null)

  useEffect(() => {
    getZonas(bodegaId).then(setZonas)
  }, [bodegaId])

  const comenzar = () => {
    if (!bodega || !usuario) return
    const zona = zonas?.find((z) => z.id === seleccion)
    if (!zona) return
    const retomando = iniciarSesion(bodega, zona, usuario.id, usuario.nombre)
    if (retomando) mostrar('Retomando tu conteo', 'info')
    navigate('/conteo/identificar')
  }

  void capturas // dependencia de re-render de los contadores por zona

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar
        title="Elige tu zona"
        breadcrumb={bodega?.nombre}
        onBack={() => navigate('/bodegas')}
        backLabel="Bodegas"
        right={<Chip variant="date">📅 {fechaCicloTexto()}</Chip>}
      />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
        {zonas === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[88px] animate-pulse rounded-2xl bg-white/60" />
            ))
          : zonas.map((z) => {
              const total = getProductosDeZona(z.id).length
              const contados = contadosEnZona(z.id)
              const cerrada = zonasCerradas.includes(z.id)
              return (
                <ListRow
                  key={z.id}
                  title={z.nombre}
                  subtitle={`Zona ${z.orden} de la ruta`}
                  selected={seleccion === z.id}
                  onClick={() => setSeleccion(z.id)}
                  right={
                    cerrada ? (
                      <Chip variant="success">✓ Cerrada</Chip>
                    ) : (
                      <ProgressRing value={contados} total={total} size="sm" />
                    )
                  }
                />
              )
            })}
      </div>

      <div className="flex gap-4 border-t border-[#E7E8EC] bg-white p-5">
        <BigButton
          variant="primary"
          size="xl"
          className="flex-[7]"
          icon={<Play size={26} fill="currentColor" />}
          disabled={!seleccion}
          onClick={comenzar}
        >
          {seleccion && contadosEnZona(seleccion) > 0 ? 'Continuar ruta' : 'Comenzar ruta'}
        </BigButton>
        <BigButton variant="secondary" size="xl" className="flex-[3]" onClick={() => navigate('/reporte')}>
          Continuar a reporte ›
        </BigButton>
      </div>
    </div>
  )
}
