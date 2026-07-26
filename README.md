# Colsubsidio — Inventario

Este repo aloja el sistema de inventario de Colsubsidio (Piscilago). Layout actual:

```
.
├── frontend/    # LA APP: "Agente de Inventario" — PWA para tablet (conteo físico por voz/escaneo)
├── supabase/    # Backend compartido (Supabase): config, edge functions, migraciones
└── legacy/
    └── backoffice-lovable/   # App administrativa archivada (ver más abajo)
```

## Cómo correr

Desde la raíz del repo:
```bash
npm install --prefix frontend   # solo la primera vez
npm run dev                     # delega a frontend/, sirve en http://localhost:5121
```

`npm run dev` en la raíz **siempre** levanta `frontend/` — es el único frontend activo del proyecto.
Ver [`frontend/README.md`](frontend/README.md) para el detalle completo (pantallas, stack, PIN de demo, etc.)
y [`frontend/docs/CONEXION-BACKEND.md`](frontend/docs/CONEXION-BACKEND.md) para la conexión a Supabase/Gemini.

## Backend (`supabase/`)

El backend vive en `supabase/` (Supabase CLI: `npx supabase start`, requiere Docker Desktop corriendo).
El esquema está versionado en `supabase/migrations/` — `npx supabase db reset` lo reconstruye desde cero.

## `legacy/backoffice-lovable/`

App administrativa (gestión de productos/categorías/usuarios y roles) generada originalmente con Lovable,
contra el mismo proyecto Supabase. Se retiró como frontend activo del proyecto: el entregable actual es
`frontend/`. Se conserva por si hace falta consultar su código o reflotarla más adelante:

```bash
cd legacy/backoffice-lovable
npm install   # o bun install — ver bun.lock/bun.lockb
npm run dev
```
