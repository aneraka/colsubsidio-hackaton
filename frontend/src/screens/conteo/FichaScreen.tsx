import { useNavigate } from 'react-router-dom'
import { Mic } from 'lucide-react'
import { useCountingStore } from '../../store/useCountingStore'
import { getBodegaById } from '../../data/mock/bodegas'
import { unidadLabel } from '../../lib/unidad'
import { AppCard, BigButton, TopBar } from '../../components/ui'

export function FichaScreen() {
  const navigate = useNavigate()
  const producto = useCountingStore((s) => s.productoEnCurso)
  const bodega = useCountingStore((s) => s.bodegaActiva)
  const metodo = useCountingStore((s) => s.metodoEnCurso)
  const siguienteEnRuta = useCountingStore((s) => s.siguienteEnRuta)

  if (!producto || !bodega) {
    navigate('/conteo/identificar')
    return null
  }

  const noEsEste = () => {
    if (metodo === 'ruta') {
      // vino por ruta: ofrece saltar al siguiente pendiente
      siguienteEnRuta()
    }
    navigate('/conteo/identificar')
  }

  return (
    <div className="screen-enter flex min-h-full flex-col">
      <TopBar title="Ficha del producto" onBack={() => navigate('/conteo/identificar')} />

      <div className="flex flex-1 items-center justify-center p-6">
        <AppCard radius={24} padding="p-10" className="w-[720px] max-w-full">
          <span className="text-sm font-extrabold tracking-widest text-[color:var(--color-brand-blue)] uppercase">
            {getBodegaById(bodega.id)?.nombre}
          </span>
          <p className="mt-2 text-lg text-[color:var(--color-graphite-60)]">
            {producto.nrArticulo ? `Nr. ${producto.nrArticulo}` : 'Sin código'}
          </p>
          <h1 className="mt-1 text-4xl leading-tight font-extrabold text-[color:var(--color-graphite)]">
            {producto.nombre}
          </h1>

          {/* Héroe: la unidad impuesta */}
          <div
            className="mt-8 rounded-2xl border-2 px-8 py-7 text-center"
            style={{ background: 'var(--color-brand-blue-soft)', borderColor: 'var(--color-brand-blue)' }}
          >
            <div className="text-sm font-semibold tracking-wide text-[color:var(--color-brand-blue)] uppercase">
              Se cuenta por
            </div>
            <div className="mt-1 text-6xl font-extrabold text-[color:var(--color-brand-blue)]">
              {unidadLabel(producto.unidad)}
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <BigButton
              variant="primary"
              size="xl"
              className="flex-[7]"
              icon={<Mic size={26} />}
              onClick={() => navigate('/conteo/voz')}
            >
              Iniciar conteo
            </BigButton>
            <BigButton variant="secondary" size="xl" className="flex-[3]" onClick={noEsEste}>
              No es este
            </BigButton>
          </div>
        </AppCard>
      </div>
    </div>
  )
}
