# CLAUDE.md — Agente de Inventario Colsubsidio (PWA Tablet)

> Este archivo es el contexto permanente del proyecto. Léelo completo antes de ejecutar cualquier prompt.

## Qué estamos construyendo

**"Agente de Inventario"** — PWA para tablet (landscape 16:10) para la toma física de inventarios de Colsubsidio (Piscilago). Reemplaza el papel y la digitación: el operario identifica el producto (ruta guiada / escaneo / código / nombre), cuenta por voz, la app valida anomalías antes de guardar y genera un Excel limpio con las columnas exactas del ERP.

**Alcance de ESTA fase: SOLO la UI completa + capa de servicios lista para conectar.** El backend (Supabase) y la API de Gemini se conectan después con solo poner las API keys en `.env`. Todo debe funcionar HOY con datos mock y servicios stub.

## Stack (no negociable)

- **React 18 + Vite + TypeScript** (SPA, NO SSR)
- **Tailwind CSS** + componentes propios estilo shadcn (sin dependencia de shadcn CLI si complica; lo importante es el resultado visual)
- **react-router-dom** para navegación
- **Zustand** para estado global (sesión, ruta de conteo, capturas)
- **vite-plugin-pwa** (manifest + service worker, `orientation: landscape`)
- **html5-qrcode** para escaneo de código de barras
- **Web Speech API** (`SpeechRecognition`, lang `es-CO`) para voz — nativa, sin backend
- **xlsx (SheetJS)** para exportar el archivo final
- **Gemini API** (Google) como cerebro del agente — vía capa de servicio con fallback local
- **lucide-react** para íconos

## Arquitectura de capas (regla de oro)

Las pantallas NUNCA llaman APIs directamente. Todo pasa por `src/services/`:

```
src/
├── screens/          # 12 pantallas (una carpeta por módulo)
├── components/       # componentes compartidos del design system
├── services/
│   ├── ai/gemini.ts        # interpretCount() — Gemini con fallback local
│   ├── ai/localParser.ts   # parser regex sin IA (números, "X cajas de Y", fracciones)
│   ├── stt.ts              # Web Speech API wrapper
│   ├── catalog.ts          # interfaz de catálogo — hoy mock, mañana Supabase
│   ├── captures.ts         # guardar capturas — hoy localStorage/mock, mañana Supabase
│   ├── barcode.ts          # mapeo barcode↔artículo (mock + enrolamiento en memoria)
│   └── exportExcel.ts      # generación del .xlsx final (REAL desde ya)
├── data/mock/        # catálogo mock, bodegas, zonas, histórico simulado
├── store/            # Zustand stores
├── lib/              # utils, validaciones locales (anomalías)
└── styles/           # tokens
```

Cada servicio expone una interfaz TypeScript clara. Los stubs simulan latencia con `setTimeout` corto. Comentario `// TODO(backend):` en cada punto de conexión real.

## Conexión futura (dejar TODO listo)

`.env.example` en la raíz con:
```
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-2.0-flash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

`services/ai/gemini.ts` debe tener el `fetch` REAL a `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent` ya escrito; si `VITE_GEMINI_API_KEY` está vacía → usa `localParser.ts` automáticamente y muestra en consola `"[gemini] sin API key — usando parser local"`. Así la demo funciona sin key y al poner la key funciona con IA sin tocar código.

## Design system — marca Colsubsidio (obligatorio)

Antes de escribir CSS, revisa el manual de marca en `C:\Documentos Santiago Olivar\Hackaton 30 X\3. Marca` y la inspiración visual en `C:\Documentos Santiago Olivar\Hackaton 30 X\5. Visualizacion de la app`. Si algo del manual contradice esta tabla, gana el manual; si no, usa esto:

| Token | Valor |
|---|---|
| Amarillo primario | `#FFD000` |
| Azul profundo | `#0067B1` |
| Grafito (texto) | `#575756` |
| Fondo | `#F4F5F7` |
| Blanco | `#FFFFFF` |
| Verde éxito | `#2E9E5B` |
| Ámbar advertencia | `#F5A623` (fondo claro `#FFF6E5`) |
| Rojo | `#E23B3B` |
| Viewport cámara | `#1E1E1E` |

- **Tipografía:** Inter (Google Fonts). Títulos bold. Números de conteo ULTRA-bold.
- **Flat design:** sin gradientes, sin 3D, sin fotos. Tarjetas blancas, radio 20–24px, sombra suave.
- **Táctil para guantes:** botones mínimo 64px de alto (primarios 72–80px), targets enormes.
- **Alto contraste:** legible a 2 metros en bodega con poca luz.
- **Botón primario:** amarillo `#FFD000` con texto grafito bold. Secundario: outline grafito o azul sólido según pantalla.
- Todo el texto de UI en **español**.

## Reglas de negocio críticas (NO romper)

1. **Conteo ciego:** el operario JAMÁS ve la cantidad teórica del sistema (`SD`). El teórico solo aparece en el reporte final (Módulo 8) y en la tarjeta de anomalía como referencia ("el mes pasado hubo ~90").
2. **La unidad se impone:** cada producto tiene su unidad del catálogo (`Unidad` / `Kilogram` / `Liter`) y se muestra ANTES de contar. El operario no la elige.
3. **Negativos imposibles:** no existe forma de capturar una cantidad negativa.
4. **Decimales en "Unidad":** permitidos pero SIEMPRE disparan confirmación (caso real: AGUA BOTELLON = 109.0065).
5. **Anomalía vs histórico:** si la cantidad sale de la banda `[histórico × 0.5, histórico × 1.5]` → tarjeta ámbar no punitiva ("Confirma con calma") con confirmación por mantener presionado.
6. **Trazabilidad:** cada captura guarda `{operarioId, productoId, bodegaId, zonaId, cantidad, unidad, metodo (ruta|escaneo|codigo|nombre|voz), expresion, confianza, timestamp}`.
7. **Export exacto:** columnas `CANTIDAD, Nr.Artículo, Artículo, Unidad, SD` — una hoja por bodega, nombre de hoja = nombre de bodega, con la fecha del ciclo.

## Datos mock (usar nombres REALES del insumo)

Bodegas: `STOCK ALMACEN SUMINISTROS` (298), `STOCK ALMACEN AYB` (272), `STOCK RESTAURANTE FUENTES AYB` (346), `STOCK RESTAURANTE FUENTES SUMIN` (135), `STOCK KIOSCO TAQUILLA AYB` (60), `STOCK KIOSCO PISCIGIROS AYB` (58), `ZOOLOGICO` (57), `ZOOLOGICO SUMINISTROS` (195).

Zonas por bodega (ejemplo Suministros): Aseo, Cocina, Bebidas, Abarrotes, Congelados — con campo `orden` para la ruta guiada.

Productos ejemplo reales: `ARAGAN MEDIANO 51 CMS C/PALO` (Nr. 95006025, Unidad), `ALCOHOL GLICERINADO 500ML CON VALVULA`, `AGUA BOTELLON` (SD 109.0065 — el caso del decimal), arroz con homónimos (`ARROZ BLANCO x 500G` / `ARROZ DOÑA PEPA x 1KG` / `ARROZ INTEGRAL x 500G`) para desambiguación. Genera ~40–60 productos mock distribuidos por bodega/zona con `sd` (teórico) e `historico` simulado (sd ± 20%). Incluye 2–3 con SD negativo (para el reporte de novedades) y varios sin `Nr.Artículo` (caso real: 260 artículos sin código).

## Convenciones de trabajo

- Después de cada prompt/fase: `npm run dev` debe compilar sin errores y la funcionalidad de la fase debe ser navegable.
- Commits por fase: `feat(fase-N): descripción`.
- Nada de `any` en TypeScript salvo excusa comentada.
- No instalar librerías fuera de las listadas sin justificación en un comentario.
- Diseño SOLO landscape: si el viewport está en portrait, mostrar overlay "Gira la tablet 🔄".
