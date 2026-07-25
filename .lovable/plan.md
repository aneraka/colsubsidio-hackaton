## Plan: Agregar Stock Máximo al catálogo de productos

### 1. Base de datos (migración)
- Agregar columna `max_stock numeric NULL` a `public.products` (nullable para no romper productos existentes; sin valor por defecto — opcional).
- Sin cambios en RLS ni grants (la tabla ya los tiene).

### 2. UI — `src/routes/_app.productos.tsx`
- **Tipo `ProductRow`**: agregar `max_stock: number | null`.
- **Query de productos**: incluir `max_stock` en el `select`.
- **Tabla**: nueva columna **"Stock Máximo"** a la derecha de "Stock Mínimo" (muestra el valor o "—" si es null). Ajustar `colSpan` de los estados loading/empty de 7 → 8.
- **Indicador de stock alto**: si `current_stock >= max_stock` (y `max_stock` no es null), mostrar badge **"Stock Alto"** junto al stock actual (color ámbar/warning), análogo al actual "Stock Bajo".
- **`ProductDialog`** (crear/editar):
  - Nuevo estado `maxStock` (string, vacío = sin límite).
  - Input numérico **"Stock Máximo"** junto a "Stock Mínimo" (opcional, placeholder "Sin límite").
  - Validación: si se llena, debe ser ≥ `min_stock`.
  - Incluir `max_stock: maxStock.trim() === "" ? null : Number(maxStock)` en el payload de insert/update.
  - Reset del campo al abrir/cambiar `state`.

### 3. Importación Excel (`ImportProductsDialog`)
- **Plantilla**: agregar columna **`Stock_Maximo`** (opcional) después de `Stock_Minimo`, actualizar filas de ejemplo y la hoja "Instrucciones".
- **Parser `ParsedRow`**: agregar `max_stock: number | null`, validar numérico si viene, error si `max_stock < min_stock`.
- **Insert**: incluir `max_stock` en el payload.

### 4. Sin cambios
- `_app.inventario.tsx`, `_app.index.tsx`, `services/adminAuth.ts`, edge functions, roles/RLS — intactos. Este cambio es solo informativo/de catálogo; no afecta lógica de movimientos.

### Archivos modificados
- Nueva migración SQL (agrega `max_stock`).
- `src/routes/_app.productos.tsx`.
