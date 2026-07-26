# CONEXIÓN DEL BACKEND — Agente de Inventario

La UI ya funciona 100% con datos mock y el parser local. Este documento explica cómo
enchufar **Gemini** (IA) y **Supabase** (backend) sin tocar las pantallas: solo se editan
servicios cuya interfaz TypeScript NO cambia.

---

## 1. Gemini (2 minutos, sin tocar código)

El agente ya tiene el `fetch` real escrito en `src/services/ai/gemini.ts`. Solo falta la key.

1. Entra a **Google AI Studio** → https://aistudio.google.com/app/apikey → "Create API key".
2. Pega la key en `.env` (en la raíz del proyecto):
   ```
   VITE_GEMINI_API_KEY=AIza...tu_key
   VITE_GEMINI_MODEL=gemini-2.0-flash
   ```
3. Reinicia el dev server (`Ctrl+C` y `npm run dev`). Vite solo lee `.env` al arrancar.
4. Verifica: abre la consola del navegador. Con key **desaparece** el mensaje
   `[gemini] sin API key — usando parser local`. En `/dev/ui`, la sección "Servicios"
   muestra el badge **"Gemini activo"**.

> Sin key la demo sigue funcionando con `localParser.ts` (regex). Con key, Gemini interpreta
> frases más complejas y el parser local queda como fallback silencioso ante timeouts (4 s).

---

## 2. Supabase (backend real)

### 2.1 Variables de entorno

En `.env`:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...anon_key
```

Instala el cliente:
```
npm install @supabase/supabase-js
```
Crea `src/services/supabase.ts`:
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!,
)
```

### 2.2 Esquema SQL (deriva de `src/types/domain.ts`)

Ejecuta en el SQL Editor de Supabase:

```sql
create table bodegas (
  id text primary key,
  nombre text not null,
  nombre_corto text not null,
  total_articulos int not null default 0
);

create table zonas (
  id text primary key,
  bodega_id text not null references bodegas(id),
  nombre text not null,
  orden int not null default 0
);

create table catalogo_items (
  id text primary key,
  nr_articulo text,                 -- nullable: 260 artículos reales sin código
  nombre text not null,
  unidad text not null check (unidad in ('Unidad','Kilogram','Liter')),
  bodega_id text not null references bodegas(id),
  zona_id text not null references zonas(id),
  orden_ruta int not null default 0,
  sd numeric not null default 0     -- teórico del sistema (NUNCA se muestra al operario)
);

create table historico (
  producto_id text not null references catalogo_items(id),
  periodo date not null,
  existencia numeric not null,
  primary key (producto_id, periodo)
);

create table barcodes (
  ean text primary key,
  producto_id text not null references catalogo_items(id)
);

create table alias (                -- jerga → producto (aprendizaje de desambiguación)
  termino text not null,
  producto_id text not null references catalogo_items(id),
  primary key (termino, producto_id)
);

create table sesiones_conteo (
  id text primary key,
  bodega_id text not null references bodegas(id),
  operario_id text not null,
  operario_nombre text not null,
  fecha_ciclo text not null,
  iniciada_en timestamptz not null default now()
);

create table capturas (
  id text primary key,
  producto_id text not null references catalogo_items(id),
  bodega_id text not null references bodegas(id),
  zona_id text not null references zonas(id),
  sesion_id text not null references sesiones_conteo(id),
  operario_id text not null,
  cantidad numeric not null check (cantidad >= 0),   -- nunca negativos
  unidad text not null,
  metodo_identificacion text not null,
  metodo_captura text not null,
  expresion text,
  frase_original text,
  confianza numeric,
  es_novedad boolean not null default false,
  timestamp timestamptz not null default now()
);

-- RLS: cada operario solo ve/inserta sus propias capturas
alter table capturas enable row level security;
create policy capturas_por_operario on capturas
  for all using (operario_id = auth.uid()::text)
  with check (operario_id = auth.uid()::text);
```

### 2.3 Puntos de conexión — `// TODO(backend):` archivo por archivo

Cada servicio ya tiene la interfaz final; solo se reemplaza el cuerpo mock por la query.
**Las pantallas no se tocan.**

| Archivo | Línea | Función | Reemplazo |
|---|---|---|---|
| `src/services/catalog.ts` | 15 | `getBodegas()` | `supabase.from('bodegas').select()` |
| `src/services/catalog.ts` | 20 | `getZonas(bodegaId)` | `.from('zonas').select().eq('bodega_id', bodegaId).order('orden')` |
| `src/services/catalog.ts` | 25 | `getProductosDeZona(zonaId)` | `.from('catalogo_items').select().eq('zona_id', zonaId).order('orden_ruta')` |
| `src/services/catalog.ts` | 30 | `getPorCodigo(nr)` | `.from('catalogo_items').select().eq('nr_articulo', nr).maybeSingle()` |
| `src/services/catalog.ts` | 69 | `buscarPorNombre(q)` | full-text: `.textSearch('nombre', q, { type: 'websearch' })` o RPC con `websearch_to_tsquery` |
| `src/services/captures.ts` | 25 | `guardarCaptura(c)` | `.from('capturas').insert(mapCaptura(c))` (RLS aplica por operario) |
| `src/services/captures.ts` | 36 | `getCapturasSesion(id)` | `.from('capturas').select().eq('sesion_id', id)` |
| `src/services/barcode.ts` | 26 | `resolverBarcode(ean)` | `.from('barcodes').select('producto_id').eq('ean', ean).maybeSingle()` |
| `src/services/barcode.ts` | 33 | `enrolarBarcode(ean, id)` | `.from('barcodes').upsert({ ean, producto_id: id })` |
| `src/store/useSyncStore.ts` | 27 | `sincronizar()` | `flush`: `insert` masivo de las capturas encoladas y vaciar la cola |
| `src/store/useCountingStore.ts` | 71 | `registrarCaptura` | mantener `guardarCaptura` (ya llama al servicio) + encolar para sync |
| `src/screens/conteo/DesambiguarScreen.tsx` | 24 | `elegir(p)` | `TODO(alias)`: `insert` en `alias` (termino→producto) para aprender jerga |
| `src/screens/conteo/EscanearScreen.tsx` | 51 | modo carné | mapear el código del carné → `operario_id` real |

> **`getReporteSesion` no requiere query nueva**: es una función pura (`construirReporte`) que
> une capturas con el catálogo. Con capturas reales, funciona igual.

---

## 3. Carga del insumo real (`BODEGAS Y STOCK.xlsx` → Supabase)

SheetJS (`xlsx`) ya está instalado. Script de importación sugerido (`scripts/importar.ts`,
ejecutable con `tsx`):

1. `XLSX.readFile('BODEGAS Y STOCK.xlsx')`.
2. **Una hoja por bodega** → fila en `bodegas` (nombre de hoja = `nombre`).
3. Por cada fila de cada hoja, mapea columnas → `catalogo_items`:
   - `Nr.Artículo` → `nr_articulo` (vacío → `null`)
   - `Artículo` → `nombre`
   - `Unidad` → `unidad` (`Unidad` / `Kilogram` / `Liter`)
   - `SD` → `sd` (el teórico; puede ser negativo → va al reporte de reconciliación)
   - Deriva `zona_id` y `orden_ruta` del orden físico de la hoja.
4. `supabase.from('bodegas').upsert(...)` y luego `catalogo_items` en lotes de ~500.
5. Histórico de meses previos → tabla `historico` (para las bandas de anomalía).

---

## 4. Deploy con HTTPS (micrófono y cámara lo exigen en la tablet)

El micrófono (Web Speech API) y la cámara (html5-qrcode) **requieren HTTPS** (o `localhost`).
Para la demo en tablet por Wi-Fi, despliega a un host con HTTPS:

### Opción A — Vercel
```
npm i -g vercel
npm run build
vercel --prod        # sirve dist/ con HTTPS automático
```
Configura las variables `VITE_*` en el panel de Vercel (Project → Settings → Environment Variables).

### Opción B — Cloudflare Pages
```
npm run build
npx wrangler pages deploy dist --project-name agente-inventario
```
Variables de entorno en el dashboard de Cloudflare Pages.

### Alternativa sin deploy (red local)
En la tablet, habilita el origen inseguro para el micrófono:
`chrome://flags/#unsafely-treat-insecure-origin-as-secure` → agrega `http://IP-DE-TU-PC:5121`.
Menos recomendado que HTTPS, pero sirve para probar rápido.
