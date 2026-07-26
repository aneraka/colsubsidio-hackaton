# CONEXIÓN DEL BACKEND — Agente de Inventario

> Reescrito para reflejar el esquema **real** que corre en el proyecto Supabase hosted
> (`inventario`, ref `hfxayiwctnphcvsgoqaf`). La versión anterior de este documento describía
> un esquema (`bodegas`, `zonas`, `catalogo_items`, `historico`, `barcodes`, `alias`,
> `sesiones_conteo`, `capturas`) que nunca se creó — quedó como diseño de referencia mientras el
> proyecto migraba a Supabase de verdad. Este documento ya no lo usa.

---

## 0. Estado actual (resumen)

El proyecto **ya apunta a producción** (`frontend/.env` → `VITE_SUPABASE_URL=https://hfxayiwctnphcvsgoqaf.supabase.co`).
Login, gestión de usuarios y asignación de bodegas están conectados de verdad. El flujo de
conteo (catálogo, capturas, código de barras, ciclos, alertas) todavía vive en mock/localStorage
porque el esquema real no tenía zonas, histórico, sesiones ni la trazabilidad de captura —
la migración `20260726060000_conteo_zonas_sesiones_alertas.sql` cierra ese hueco de forma
aditiva (no borra ni renombra nada existente).

| Servicio/store | Estado | Tablas reales que usa (hoy o tras la migración) |
|---|---|---|
| `services/auth.ts` | ✅ Conectado | `profiles` (vía Supabase Auth) |
| `services/usuarios.ts` | ✅ Conectado | `profiles`, `warehouse_operators`, `warehouses`, edge function `admin-auth` |
| `services/catalog.ts` | ❌ Mock | → `warehouses`, `zones`, `products`, `warehouse_products` |
| `services/captures.ts` | ❌ localStorage | → `inventory_logs` (+ `count_sessions`) |
| `services/barcode.ts` | ❌ Mock + localStorage | → `product_barcodes` |
| `store/useCyclesStore.ts` | ❌ localStorage | → `count_sessions` |
| `store/useAlertsStore.ts` | ❌ localStorage | → `alerts` |
| `store/useSyncStore.ts` | ❌ simulado (`setTimeout`) | → insert masivo en `inventory_logs`/`alerts` |
| `screens/conteo/DesambiguarScreen.tsx` | ❌ no aprende | → `product_aliases` |
| `services/exportExcel.ts` | ✅ real (función pura) | ninguna — arma el Excel desde lo que reciba |

---

## 1. Gemini (sin cambios, no depende de Supabase)

El agente ya tiene el `fetch` real escrito en `src/services/ai/gemini.ts`. Solo falta la key.

1. Entra a **Google AI Studio** → https://aistudio.google.com/app/apikey → "Create API key".
2. Pega la key en `.env` (en la raíz del proyecto):
   ```
   VITE_GEMINI_API_KEY=AIza...tu_key
   VITE_GEMINI_MODEL=gemini-2.0-flash
   ```
3. Reinicia el dev server (`Ctrl+C` y `npm run dev`). Vite solo lee `.env` al arrancar.
4. Verifica: abre la consola del navegador. Con key **desaparece** el mensaje
   `[gemini] sin API key — usando parser local`.

> Sin key la demo sigue funcionando con `localParser.ts` (regex).

---

## 2. Supabase — esquema real (producción)

### 2.1 Variables de entorno

Ya configuradas en `frontend/.env`:
```
VITE_SUPABASE_URL=https://hfxayiwctnphcvsgoqaf.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key del proyecto "inventario">
```

`src/services/supabase.ts` ya crea el cliente con estas variables — no requiere cambios.

### 2.2 Tablas ya existentes (`supabase/migrations/20260726031234_initial_schema.sql` y siguientes)

```
sites               -- sedes (Piscilago, etc.), cada una con un líder (profiles.role = 'lider')
warehouses          -- bodegas dentro de una sede (slug las mapea a los IDs mock: 'b-almacen-sumin', etc.)
warehouse_operators -- operarios asignados a bodegas (assignment_role: principal | revisor)
categories          -- categorías de producto
products            -- catálogo (name, unit, cost_per_unit, sku, codigo_barras, category_id)
warehouse_products  -- stock por bodega+producto (current_stock, min_stock, max_stock)
inventory_logs      -- movimientos (entrada | salida | conteo_manual), dispara update de stock
profiles            -- perfiles (role: super_admin | admin | operario | lider)
audit_logs          -- auditoría automática (trigger en cada tabla de negocio)
```

RLS activo en todas: `admin`/`super_admin` ven todo; `lider` ve su sede (`get_active_site_id()`);
`operario` ve solo sus bodegas asignadas (`is_operator_of_warehouse()`).

### 2.3 Tablas nuevas (`supabase/migrations/20260726060000_conteo_zonas_sesiones_alertas.sql`)

Migración **aditiva** — no toca ninguna tabla/columna existente, solo agrega:

```
zones                            -- zonas dentro de una bodega (name, order) — ruta guiada
warehouse_products.zone_id       -- + route_order (columnas nuevas en tabla existente)
warehouse_product_stock_history  -- existencia por mes (warehouse_id, product_id, period, stock)
product_barcodes                 -- EAN -> product_id (N:1; complementa products.codigo_barras)
count_sessions                   -- sesión/ciclo de conteo (operario, bodega, fecha_ciclo, estado, resumen jsonb)
inventory_logs.count_session_id  -- + zone_id, identification_method, capture_method,
                                  --   expression, original_phrase, confidence, is_novelty
product_aliases                  -- jerga -> producto (aprendizaje de desambiguación)
alerts                           -- atipico | decimal | sd_negativo, con reviewed/reviewed_by
```

Mismos triggers de auditoría (`audit.log_change()`) y mismo patrón de RLS que las tablas existentes.

### 2.4 Aplicar la migración al proyecto hosted

El proyecto ya está enlazado (`supabase/.temp/linked-project.json` → ref `hfxayiwctnphcvsgoqaf`).
Desde la raíz del repo, con la contraseña de la base de datos del proyecto **inventario**:

```bash
supabase db push
```

Esto aplica únicamente las migraciones nuevas que el proyecto remoto no tiene todavía (las 3
migraciones existentes ya están aplicadas). Revisa el diff que muestra el CLI antes de confirmar.

> No se incluye ningún paso que ejecute esto automáticamente: aplicar cambios de esquema a la
> base de producción requiere confirmación explícita y la contraseña de la base de datos, que
> solo el dueño del proyecto debe introducir.

### 2.5 Puntos de conexión — `// TODO(backend):` archivo por archivo

Cada servicio ya tiene la interfaz final; solo se reemplaza el cuerpo mock por la query contra
las tablas reales. **Las pantallas no se tocan.**

| Archivo | Línea | Función | Reemplazo (esquema real) |
|---|---|---|---|
| `src/services/catalog.ts` | 15 | `getBodegas()` | `.from('warehouses').select()` |
| `src/services/catalog.ts` | 20 | `getZonas(bodegaId)` | `.from('zones').select().eq('warehouse_id', bodegaId).order('order')` |
| `src/services/catalog.ts` | 25 | `getProductosDeZona(zonaId)` | `.from('warehouse_products').select('*, products(*)').eq('zone_id', zonaId).order('route_order')` |
| `src/services/catalog.ts` | 30 | `getPorCodigo(nr)` | `.from('products').select().eq('sku', nr).maybeSingle()` |
| `src/services/catalog.ts` | 69 | `buscarPorNombre(q)` | full-text: `.textSearch('name', q, { type: 'websearch' })` sobre `products`, o RPC con `websearch_to_tsquery` |
| `src/services/captures.ts` | 25 | `guardarCaptura(c)` | `.from('inventory_logs').insert({ type: 'conteo_manual', ...mapCaptura(c) })` (RLS aplica por operario/bodega) |
| `src/services/captures.ts` | 36 | `getCapturasSesion(id)` | `.from('inventory_logs').select().eq('count_session_id', id)` |
| `src/services/barcode.ts` | 26 | `resolverBarcode(ean)` | `.from('product_barcodes').select('product_id').eq('ean', ean).maybeSingle()` |
| `src/services/barcode.ts` | 33 | `enrolarBarcode(ean, id)` | `.from('product_barcodes').upsert({ ean, product_id: id })` |
| `src/store/useCyclesStore.ts` | 41 | `cerrarCiclo()` | `.from('count_sessions').update({ status: 'cerrado', summary, closed_at, closed_by })` |
| `src/store/useAlertsStore.ts` | 4 | estado de revisión | `.from('alerts').update({ reviewed: true, reviewed_by, reviewed_at })` en vez de guardar solo el ID localmente |
| `src/store/useSyncStore.ts` | 27 | `sincronizar()` | `flush`: `insert` masivo de las capturas/alertas encoladas (`inventory_logs`, `alerts`) y vaciar la cola |
| `src/store/useCountingStore.ts` | 81 | `registrarCaptura` | mantener `guardarCaptura` (ya llama al servicio) + encolar para sync |
| `src/screens/conteo/DesambiguarScreen.tsx` | 24 | `elegir(p)` | `insert` en `product_aliases` (term→product_id) para aprender jerga |

> **`getReporteSesion` no requiere query nueva**: es una función pura (`construirReporte`) que
> une capturas con el catálogo. Con capturas reales desde `inventory_logs`, funciona igual.

> El histórico para la banda de anomalía (`referenciaHistorica` en `lib/validation.ts`) pasa de
> leer `producto.historico[]` en memoria a un `select` sobre `warehouse_product_stock_history`
> ordenado por `period desc limit N`.

---

## 3. Carga del insumo real (`BODEGAS Y STOCK.xlsx` → Supabase)

SheetJS (`xlsx`) ya está instalado. Script de importación sugerido (`scripts/importar.ts`,
ejecutable con `tsx`), contra el **esquema real**:

1. `XLSX.readFile('BODEGAS Y STOCK.xlsx')`.
2. **Una hoja por bodega** → fila en `warehouses` (si no existe ya vía `slug`).
3. Por cada fila de cada hoja, mapea columnas → `products` + `warehouse_products`:
   - `Nr.Artículo` → `products.sku` (vacío → `null`, hay ~260 artículos reales sin código)
   - `Artículo` → `products.name`
   - `Unidad` → `products.unit` (`Unidad` / `Kilogram` / `Liter`)
   - `SD` → `warehouse_products.current_stock` (el teórico; puede ser negativo → alimenta `alerts` tipo `sd_negativo`)
   - Deriva `zone_id` (crear/matchear en `zones`) y `route_order` del orden físico de la hoja.
4. `supabase.from('warehouses').upsert(...)`, luego `products`/`warehouse_products` en lotes de ~500.
5. Histórico de meses previos → `warehouse_product_stock_history` (una fila por mes/producto/bodega).

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
