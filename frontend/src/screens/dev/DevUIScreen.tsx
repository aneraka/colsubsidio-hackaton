import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Barcode, Camera } from 'lucide-react'
import {
  BigButton,
  AppCard,
  GiantNumber,
  ProgressRing,
  Chip,
  HoldToConfirm,
  PinKeypad,
  PinDots,
  TopBar,
  MicButton,
  AmberAlertCard,
  ListRow,
} from '../../components/ui'
import { interpretarConteo, geminiActivo } from '../../services/ai/gemini'
import type { ResultadoInterprete } from '../../types/domain'
import { getProductoById } from '../../data/mock/productos'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-extrabold uppercase tracking-wider text-[color:var(--color-brand-blue)]">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </section>
  )
}

/** Galería del design system — herramienta de QA visual (solo dev). */
export function DevUIScreen() {
  const [num, setNum] = useState<number | null>(29)
  const [pin, setPin] = useState('')
  const [mic, setMic] = useState<'idle' | 'listening' | 'processing'>('idle')
  const [confirmed, setConfirmed] = useState(0)
  const [selectedRow, setSelectedRow] = useState('a')
  const [frase, setFrase] = useState('dos cajas de doce y cinco sueltas')
  const [resultado, setResultado] = useState<ResultadoInterprete | null>(null)

  const probarInterprete = async () => {
    const producto = getProductoById('p-001')! // ARAGAN MEDIANO (Unidad)
    setResultado(await interpretarConteo(frase, producto))
  }

  return (
    <div className="screen-enter mx-auto flex max-w-6xl flex-col gap-10 px-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-[color:var(--color-graphite)]">
            Galería del design system
          </h1>
          <p className="text-[color:var(--color-graphite-60)]">Todos los componentes con sus variantes y estados.</p>
        </div>
        <Link to="/login" className="text-[color:var(--color-brand-blue)] underline">
          Ir al login →
        </Link>
      </div>

      <Section title="BigButton — variantes y tamaños">
        <BigButton variant="primary">Primary</BigButton>
        <BigButton variant="secondary">Secondary</BigButton>
        <BigButton variant="blue">Blue</BigButton>
        <BigButton variant="ghost">Ghost</BigButton>
        <BigButton variant="primary" disabled>
          Disabled
        </BigButton>
        <BigButton variant="blue" size="md" icon={<Camera size={22} />}>
          md 64px
        </BigButton>
        <BigButton variant="primary" size="lg">
          lg 72px
        </BigButton>
        <BigButton variant="primary" size="xl">
          xl 80px
        </BigButton>
      </Section>

      <Section title="AppCard">
        <AppCard className="w-72">
          <h3 className="text-xl font-bold text-[color:var(--color-graphite)]">Tarjeta blanca</h3>
          <p className="mt-2 text-[color:var(--color-graphite-60)]">Radio 22px, sombra suave, padding generoso.</p>
        </AppCard>
        <AppCard radius={16} className="w-56">
          <p className="font-bold">Radio 16px</p>
        </AppCard>
      </Section>

      <Section title="GiantNumber">
        <div className="flex flex-col items-center gap-3">
          <GiantNumber value={num} />
          <div className="flex gap-2">
            <BigButton size="md" variant="secondary" onClick={() => setNum((n) => (n ?? 0) + 1)}>
              +1
            </BigButton>
            <BigButton size="md" variant="secondary" onClick={() => setNum(109.0065)}>
              109,0065
            </BigButton>
            <BigButton size="md" variant="ghost" onClick={() => setNum(null)}>
              vaciar
            </BigButton>
          </div>
        </div>
      </Section>

      <Section title="ProgressRing">
        <ProgressRing value={3} total={8} size="sm" />
        <ProgressRing value={12} total={46} size="md" />
        <ProgressRing value={46} total={46} size="lg" />
        <ProgressRing value={70} total={100} size="md" label="percent" />
      </Section>

      <Section title="Chip">
        <Chip variant="date">📅 31 de julio</Chip>
        <Chip variant="unit">UNIDAD</Chip>
        <Chip variant="unit">KILOGRAMO</Chip>
        <Chip variant="unit">LITRO</Chip>
        <Chip variant="success">✓ Contado</Chip>
        <Chip variant="warning">Novedad</Chip>
        <Chip variant="neutral">Pendiente</Chip>
        <Chip variant="info">12/46</Chip>
      </Section>

      <Section title="HoldToConfirm">
        <div className="w-96">
          <HoldToConfirm onConfirm={() => setConfirmed((c) => c + 1)} />
          <p className="mt-2 text-[color:var(--color-graphite-60)]">Confirmado {confirmed} vez(ces).</p>
        </div>
      </Section>

      <Section title="PinKeypad + PinDots">
        <div className="flex flex-col items-center gap-5">
          <PinDots length={4} filled={pin.length} />
          <PinKeypad
            onDigit={(d) => setPin((p) => (p.length < 4 ? p + d : p))}
            onBackspace={() => setPin((p) => p.slice(0, -1))}
          />
        </div>
      </Section>

      <Section title="TopBar">
        <div className="w-full overflow-hidden rounded-2xl border border-[#E7E8EC]">
          <TopBar
            title="Elige tu zona"
            breadcrumb="STOCK ALMACÉN SUMINISTROS"
            onBack={() => {}}
            right={<Chip variant="date">📅 31 de julio</Chip>}
          />
        </div>
      </Section>

      <Section title="MicButton">
        <MicButton state={mic} onClick={() => setMic((s) => (s === 'idle' ? 'listening' : s === 'listening' ? 'processing' : 'idle'))} />
      </Section>

      <Section title="AmberAlertCard">
        <div className="w-[560px] max-w-full">
          <AmberAlertCard
            headline="Confirma con calma"
            actions={
              <div className="flex gap-4">
                <BigButton variant="blue" fullWidth>
                  Recontar
                </BigButton>
                <HoldToConfirm onConfirm={() => {}} />
              </div>
            }
          >
            Dijiste <b>900</b> — el mes pasado hubo ≈ 90.
          </AmberAlertCard>
        </div>
      </Section>

      <Section title="ListRow">
        <div className="flex w-[560px] max-w-full flex-col gap-3">
          <ListRow
            title="Aseo"
            subtitle="Zona 1 de la ruta"
            selected={selectedRow === 'a'}
            onClick={() => setSelectedRow('a')}
            right={<Chip variant="info">3/8</Chip>}
          />
          <ListRow
            title="ARAGÁN MEDIANO 51 CMS C/PALO"
            subtitle="Nr. 95006025"
            selected={selectedRow === 'b'}
            onClick={() => setSelectedRow('b')}
            right={<Chip variant="success">✓ Contado</Chip>}
          />
          <ListRow
            title="ALCOHOL GLICERINADO 500ML"
            selected={selectedRow === 'c'}
            onClick={() => setSelectedRow('c')}
            right={<Chip variant="neutral">Pendiente</Chip>}
          />
        </div>
      </Section>

      <Section title={`Servicios — interpretarConteo (${geminiActivo() ? 'Gemini activo' : 'parser local'})`}>
        <div className="flex w-full max-w-2xl flex-col gap-3">
          <div className="flex gap-3">
            <input
              value={frase}
              onChange={(e) => setFrase(e.target.value)}
              className="h-14 flex-1 rounded-2xl border border-[#D8D9DD] bg-white px-4 text-lg"
              placeholder='Ej: "tres litros y medio"'
            />
            <BigButton variant="blue" size="md" onClick={probarInterprete}>
              Interpretar
            </BigButton>
          </div>
          {resultado && (
            <pre className="overflow-x-auto rounded-2xl bg-[#1E1E1E] p-4 text-sm text-[#7CE0A3]">
              {JSON.stringify(resultado, null, 2)}
            </pre>
          )}
        </div>
      </Section>

      <Section title="Íconos de filtro (lucide)">
        <BigButton variant="blue" icon={<Camera size={24} />}>
          Escanear
        </BigButton>
        <BigButton variant="secondary" icon={<Barcode size={24} />}>
          Código
        </BigButton>
      </Section>
    </div>
  )
}
