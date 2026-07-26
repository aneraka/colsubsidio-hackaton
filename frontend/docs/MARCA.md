# MARCA — Agente de Inventario (Colsubsidio)

Resumen de la inspección del manual de marca en `3. Marca/` y la inspiración visual en
`5. Visualizacion de la app/`. **El manual coincide con la paleta de `CLAUDE.md`**, así que no
hubo que sobrescribir ningún token.

## Fuentes revisadas

- `3. Marca/Colores Oficiales.png` — placa oficial de colores con Pantone/CMYK/RGB/HEX.
- `3. Marca/LogoV1.png` y `Logov2.png` — el isotipo "K" amarilla (chevron / flecha).
- `5. Visualizacion de la app/*.jpeg` — 12 mockups de referencia (login, ficha, conteo por voz,
  anomalía, offline, etc.). Calibran densidad, jerarquía y composición.

## Paleta oficial (del manual)

| Color | Pantone | HEX | Uso |
|---|---|---|---|
| Amarillo Colsubsidio | 109 C | `#FFD000` | Botón primario, acentos, mic, chip de fecha |
| Azul Colsubsidio | 2196 C | `#0067B1` | Títulos, botones azules, unidad-héroe, progreso |
| Grafito | Cool Gray 11 C | `#575756` | Texto principal, StatusBar, número de conteo |
| Fondo | — | `#F4F5F7` | Fondo de app |
| Blanco | — | `#FFFFFF` | Tarjetas |
| Verde éxito | — | `#2E9E5B` | "Contado", diferencias positivas, red OK |
| Ámbar advertencia | — | `#F5A623` (fondo `#FFF6E5`) | Anomalías, novedades, offline (NUNCA rojo) |
| Rojo | — | `#E23B3B` | Solo diferencias negativas en el reporte |
| Viewport cámara | — | `#1E1E1E` | Fondo del escáner |

> El manual muestra el amarillo como `#ffd000`, el azul como `#0067b1` y el grafito como `#575756`
> — idénticos a `CLAUDE.md`. Ninguna corrección necesaria.

## Tipografía

- **Inter** (Google Fonts), pesos 400 / 600 / 700 / 800 / 900.
- Títulos bold/extrabold. El número de conteo va en **900 (ultra-bold)** con `tabular-nums`.
- Escala tablet definida en `src/styles/tokens.css`: `text-giant`, `text-display`, `text-title`,
  `text-body-lg` (mínimo 18–20px para legibilidad a 2 m).

## Logo

- Isotipo "K" amarilla sobre transparente (`public/brand/logo.png`, `logo-v2.png`).
- Íconos PWA generados en `public/brand/icon-192.png` y `icon-512.png`: la "K" amarilla centrada
  sobre fondo grafito `#575756` (alto contraste en la pantalla de inicio de la tablet).

## Decisiones de estilo (flat design)

- Sin gradientes, sin 3D, sin fotos. Tarjetas blancas, radio 20–24px, sombra suave
  `0 4px 16px rgba(0,0,0,0.06)`.
- Targets táctiles enormes (botones 64–80px) pensados para guantes.
- Alto contraste, solo landscape (overlay de rotación en portrait).
- Botón primario: amarillo `#FFD000` + texto grafito bold. Secundario: outline o azul sólido.
