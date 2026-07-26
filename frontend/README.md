# Agente de Inventario — Colsubsidio (Piscilago)

PWA para tablet (landscape) para la **toma física de inventarios**. Reemplaza el papel y la
digitación: el operario identifica el producto (ruta guiada / escaneo / código / nombre),
**cuenta por voz**, la app valida anomalías antes de guardar y genera un **Excel limpio** con
las columnas exactas del ERP.

> Estado: **UI completa + login y gestión de usuarios ya conectados a Supabase (hosted).** El resto
> del catálogo (bodegas/zonas/productos/capturas) sigue con datos mock. Gemini se enchufa poniendo
> la key en `.env` (ver `docs/CONEXION-BACKEND.md`).

## Stack

React 18 + Vite + TypeScript · Tailwind CSS v4 · react-router-dom · Zustand · vite-plugin-pwa ·
html5-qrcode · Web Speech API (`es-CO`) · SheetJS (xlsx) · Gemini (con fallback local) · lucide-react.

## Cómo correr

```bash
npm install
npm run dev        # http://localhost:5121
```

Otros scripts:
```bash
npm run build      # tsc + build de producción (genera PWA: manifest + service worker)
npm run preview    # sirve el build (para probar la PWA/offline)
npm run test       # tests del parser de voz, validación, reporte y export Excel (Vitest)
npm run lint       # oxlint
```

La app abre en `/login`. Usuarios de prueba (reales, contra Supabase — pestaña **PIN**, correo + PIN de
6 dígitos):

| Usuario | Correo | PIN | Rol |
|---|---|---|---|
| Juan P. | juan.perez@colsubsidio.com | `123456` | Operario |
| Sandra M. | sandra.martinez@colsubsidio.com | `234567` | Operario |
| Viviana R. | viviana.rojas@colsubsidio.com | `345678` | Admin |
| Admin | admin@colsubsidio.com | `456789` | Super admin |
| Roberto Díaz | lider.piscilago@colsubsidio.com | `567890` | Líder |

Solo Admin y Viviana ven **Gestión de usuarios** (menú). Ahí se puede restablecer el PIN de cualquier
usuario y asignar bodegas a cargo de un operario (Principal/Revisor) — un operario sin bodegas asignadas
no ve ninguna en `/bodegas`.

## Probar en la tablet

1. En la PC: `npm run dev` (ya escucha en `0.0.0.0:5121` con `host: true`).
2. En la tablet (misma Wi-Fi): abre `http://IP-DE-TU-PC:5121`.
3. Chrome → menú → "Agregar a pantalla de inicio" → instala la PWA (pantalla completa, landscape).
4. **Voz y cámara requieren HTTPS o localhost.** Para la demo en red local, o bien habilitas
   `chrome://flags/#unsafely-treat-insecure-origin-as-secure` con tu IP, o despliegas a
   Vercel/Cloudflare Pages (HTTPS). Ver `docs/CONEXION-BACKEND.md` §4.

## Las 12 pantallas

| # | Ruta | Módulo |
|---|---|---|
| 1 | `/login` | Login por PIN / carné |
| 2 | `/bodegas` | Selección de bodega (anillos de progreso) |
| 3 | `/bodegas/:id/zonas` | Selección de zona + "Comenzar ruta" |
| 4 | `/conteo/identificar` | Identificación: ruta guiada + 3 filtros |
| 5 | `/conteo/escanear` | Escáner de código de barras (+ enrolamiento) |
| 6 | `/conteo/desambiguar` | Desambiguación (homónimos, ej. arroz) |
| 7 | `/conteo/ficha` | Ficha del producto — la unidad impuesta |
| 8 | `/conteo/voz` | ★ Conteo por voz (pantalla estrella) |
| 9 | `/conteo/anomalia` | Validación de anomalía (tarjeta ámbar) |
| 10 | `/zona/progreso` | Progreso y cierre de zona |
| 11 | `/reporte` | Reporte contado vs sistema + export Excel |
| 12 | `/offline` | Estado de sincronización offline |

Extra: `/dev/ui` — galería del design system (QA visual).

## Estructura

```
src/
├── screens/        # las 12 pantallas (una carpeta por módulo)
├── components/
│   ├── ui/         # design system (BigButton, GiantNumber, ProgressRing, ...)
│   ├── conteo/     # BuscadorNombre, CodigoDialog, TecladoNumerico
│   └── layout/     # TabletShell, StatusBar, RotateOverlay, ToastHost
├── services/       # catalog, captures, barcode, stt, exportExcel, ai/{gemini,localParser}
├── store/          # Zustand: sesión, conteo, sync, toast
├── data/mock/      # bodegas, zonas, productos, operarios, barcodes (nombres reales)
├── lib/            # validación de anomalías, fecha del ciclo, unidad
├── types/          # domain.ts (fuente de verdad)
└── styles/         # tokens de marca Colsubsidio
```

## Reglas de negocio (inviolables)

- **Conteo ciego:** el operario nunca ve el teórico (`SD`); solo aparece en el reporte final.
- **La unidad se impone** desde el catálogo (Unidad/Kilogram/Liter), antes de contar.
- **Sin negativos** por ningún camino (voz o teclado).
- **Decimal en "Unidad"** → siempre pide confirmación (caso AGUA BOTELLON = 109,0065).
- **Anomalía** fuera de `[histórico×0.5, histórico×1.5]` → tarjeta ámbar no punitiva.
- **Trazabilidad** completa por captura (operario, método, expresión, confianza, timestamp).
- **Export exacto:** columnas `CANTIDAD, Nr.Artículo, Artículo, Unidad, SD`, una hoja por bodega.

## Conectar el backend

Todo está preparado. Ver **[`docs/CONEXION-BACKEND.md`](docs/CONEXION-BACKEND.md)**: Gemini en 2
minutos, Supabase archivo por archivo (con SQL), carga del insumo real y deploy con HTTPS.
Marca y decisiones de diseño en [`docs/MARCA.md`](docs/MARCA.md).
