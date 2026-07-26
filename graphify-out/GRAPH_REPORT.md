# Graph Report - .  (2026-07-26)

## Corpus Check
- 177 files · ~57,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1106 nodes · 2279 edges · 116 communities (53 shown, 63 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 24 edges (avg confidence: 0.67)
- Token cost: 333,639 input · 0 output

## Community Hubs (Navigation)
- Legacy UI Primitives (dialogs/forms)
- Legacy App Routing & Auth Provider
- Legacy App Sidebar & Navigation
- Legacy Package Config (backoffice-lovable)
- Legacy shadcn UI Components (extended)
- Project Docs & Business Rules
- Ciclos, Captura & Export Excel
- Catalogo, Bodegas & Zonas (mock)
- Design System UI Components
- Legacy shadcn UI (tabs/popover/command)
- Legacy UI Primitives & Utils
- Legacy TypeScript Config
- Sesion, Login & Permisos
- Auth, Usuarios & Supabase Client (frontend)
- Frontend TS App Config
- Layout Shell & Barcode Service
- Busqueda de Productos & Voz (STT)
- Frontend Node TS Config
- Legacy Supabase Auth Integration
- Conteo, Unidad & Validacion
- Gemini AI & Parser Local (Dev)
- Legacy shadcn Components Config
- Legacy Auth Routes & UI
- Historico, Registros & Reporte
- Legacy Menubar Component
- Alertas & Notificaciones
- Legacy Supabase Server Client & Types
- Legacy Package Config (variant)
- Frontend Package Config (variant A)
- Frontend Package Config (variant B)
- Legacy Carousel Component
- TopBar, Ficha & Registros UI
- Identificacion & Desambiguacion de Producto
- Legacy Form Component
- App Shell, Sync & Offline
- Legacy Chart Component
- Legacy Context Menu Component
- Legacy Dropdown Menu Component
- Root Package Config
- Frontend Lint Config
- Legacy Navigation Menu Component
- Frontend Package Config (variant C)
- BigButton Component
- Frontend Package Config (variant D)
- Supabase admin-auth Edge Function
- MicButton Component
- ProgressRing Component
- Placeholder Component
- Vite Env Types
- Frontend TS Root Config
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- Package Dependency Pair
- App Icon 192 (brand)
- App Icon 512 (brand)
- Logo K Mark (brand)
- Logo Mark (brand)
- Logo V2 Mark (brand)

## God Nodes (most connected - your core abstractions)
1. `react` - 87 edges
2. `cn()` - 71 edges
3. `useCountingStore` - 33 edges
4. `useSessionStore` - 33 edges
5. `BigButton()` - 19 edges
6. `compilerOptions` - 18 edges
7. `getProductosDeZona()` - 17 edges
8. `ReporteScreen()` - 17 edges
9. `Producto` - 17 edges
10. `compilerOptions` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Configuración de Supabase local (Docker + supabase CLI)` --semantically_similar_to--> `Esquema SQL Supabase (bodegas, zonas, catalogo_items, historico, barcodes, alias, sesiones_conteo, capturas)`  [INFERRED] [semantically similar]
  legacy/backoffice-lovable/README.md → frontend/docs/CONEXION-BACKEND.md
- `Stack tecnológico (no negociable)` --semantically_similar_to--> `MVP Inventario - Colsubsidio (legacy README)`  [INFERRED] [semantically similar]
  frontend/CLAUDE.md → legacy/backoffice-lovable/README.md
- `legacy/backoffice-lovable (app administrativa archivada)` --references--> `MVP Inventario - Colsubsidio (legacy README)`  [INFERRED]
  README.md → legacy/backoffice-lovable/README.md
- `RequireAuth()` --calls--> `useSessionStore`  [EXTRACTED]
  frontend/src/App.tsx → frontend/src/store/useSessionStore.ts
- `BuscadorNombreProps` --references--> `Producto`  [EXTRACTED]
  frontend/src/components/conteo/BuscadorNombre.tsx → frontend/src/types/domain.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Reglas de negocio críticas (Agente de Inventario)** — frontend_claude_conteo_ciego, frontend_claude_unidad_impuesta, frontend_claude_negativos_imposibles, frontend_claude_anomalia_historico, frontend_claude_trazabilidad, frontend_claude_export_exacto [EXTRACTED 1.00]
- **Flujo de conexión de backend (Gemini + Supabase)** — frontend_docs_conexion_backend_gemini_setup, frontend_docs_conexion_backend_supabase_schema, frontend_docs_conexion_backend_puntos_conexion, frontend_docs_conexion_backend_carga_insumo, frontend_docs_conexion_backend_deploy_https [EXTRACTED 1.00]
- **Design system / marca Colsubsidio** — frontend_claude_design_system_marca, frontend_docs_marca_paleta_oficial, frontend_docs_marca_tipografia, frontend_docs_marca_logo, frontend_docs_marca_flat_design [INFERRED 0.85]

## Communities (116 total, 63 thin omitted)

### Community 0 - "Legacy UI Primitives (dialogs/forms)"
Cohesion: 0.08
Nodes (44): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+36 more)

### Community 1 - "Legacy App Routing & Auth Provider"
Cohesion: 0.05
Nodes (40): AuthProvider(), Props, InventoryContext, InventoryContextValue, InventoryProvider(), Toaster(), ToasterProps, Articulo (+32 more)

### Community 2 - "Legacy App Sidebar & Navigation"
Cohesion: 0.06
Nodes (44): useAuth(), AppSidebar(), items, NavItem, Separator, SheetContent, SheetContentProps, SheetDescription (+36 more)

### Community 3 - "Legacy Package Config (backoffice-lovable)"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, devDependencies (+38 more)

### Community 4 - "Legacy shadcn UI Components (extended)"
Cohesion: 0.06
Nodes (29): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Avatar (+21 more)

### Community 5 - "Project Docs & Business Rules"
Cohesion: 0.07
Nodes (40): Agente de Inventario — spec (CLAUDE.md), Anomalía vs histórico (banda 0.5x–1.5x), Arquitectura de capas (services layer, regla de oro), Conteo ciego (el operario nunca ve el SD teórico), Datos mock (bodegas/zonas/productos reales), Design system — marca Colsubsidio, Export exacto (columnas ERP), services/ai/gemini.ts — interpretCount() (+32 more)

### Community 6 - "Ciclos, Captura & Export Excel"
Cohesion: 0.10
Nodes (28): CICLOS_CERRADOS, CicloSpec, generarCapturas(), OPERARIOS_MOCK, seeded(), SPECS, getProductoById(), cicloIdDeFecha() (+20 more)

### Community 7 - "Catalogo, Bodegas & Zonas (mock)"
Cohesion: 0.14
Nodes (26): ALL_SPECS, generarRelleno(), ordenPorZona, POOLS, PRODUCTOS, seeded(), Spec, SPECS (+18 more)

### Community 8 - "Design System UI Components"
Cohesion: 0.10
Nodes (21): AmberAlertCard(), AmberAlertCardProps, AppCard(), AppCardProps, BrandLogo(), px, Size, GiantNumber() (+13 more)

### Community 9 - "Legacy shadcn UI (tabs/popover/command)"
Cohesion: 0.09
Nodes (23): Badge(), BadgeProps, badgeVariants, Command, CommandEmpty, CommandGroup, CommandInput, CommandItem (+15 more)

### Community 10 - "Legacy UI Primitives & Utils"
Cohesion: 0.09
Nodes (26): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator(), ButtonProps (+18 more)

### Community 11 - "Legacy TypeScript Config"
Cohesion: 0.07
Nodes (26): compilerOptions, allowImportingTsExtensions, jsx, lib, module, moduleResolution, noEmit, noFallthroughCasesInSwitch (+18 more)

### Community 12 - "Sesion, Login & Permisos"
Cohesion: 0.18
Nodes (16): NavMenu(), SalirButton(), getUsuarioById(), getUsuarioNombre(), USUARIOS, validarCarne(), validarCorreo(), esAuditor() (+8 more)

### Community 13 - "Auth, Usuarios & Supabase Client (frontend)"
Cohesion: 0.16
Nodes (20): puedeGestionarUsuarios(), CrearUsuarioDialog(), DetalleUsuarioDialog(), ROL_LABEL, UsuariosScreen(), loginConPin(), rolBackendAFrontend(), supabase (+12 more)

### Community 14 - "Frontend TS App Config"
Cohesion: 0.08
Nodes (23): compilerOptions, allowArbitraryExtensions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection (+15 more)

### Community 15 - "Layout Shell & Barcode Service"
Cohesion: 0.13
Nodes (16): html5-qrcode, RotateOverlay(), StatusBar(), TabletShell(), ToastHost(), tonos, BARCODES_MOCK, EscanearScreen() (+8 more)

### Community 16 - "Busqueda de Productos & Voz (STT)"
Cohesion: 0.16
Nodes (17): BuscadorNombre(), BuscadorNombreProps, ChipProps, ChipVariant, styles, buscarPorNombre(), normalizar(), score() (+9 more)

### Community 17 - "Frontend Node TS Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, noEmit, noFallthroughCasesInSwitch (+11 more)

### Community 18 - "Legacy Supabase Auth Integration"
Cohesion: 0.15
Nodes (13): AppRole, AuthContext, AuthContextValue, attachSupabaseAuth, supabase, ChangePasswordDialog(), CreateUserDialog(), ProfileRow (+5 more)

### Community 19 - "Conteo, Unidad & Validacion"
Cohesion: 0.20
Nodes (13): TecladoNumerico(), TecladoNumericoProps, getProductosDeZona(), unidadLabel(), unidadPlural(), validarCaptura(), AnomaliaScreen(), AnomaliaState (+5 more)

### Community 20 - "Gemini AI & Parser Local (Dev)"
Cohesion: 0.18
Nodes (16): DevUIScreen(), fallback(), geminiActivo(), interpretarConteo(), RESPONSE_SCHEMA, UNIDAD_ES, CONTAINERS, detectarFraccion() (+8 more)

### Community 21 - "Legacy shadcn Components Config"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 22 - "Legacy Auth Routes & UI"
Cohesion: 0.22
Nodes (14): Button, buttonVariants, Calendar(), CalendarDayButton(), Card, CardContent, CardDescription, CardFooter (+6 more)

### Community 23 - "Historico, Registros & Reporte"
Cohesion: 0.25
Nodes (13): resumen(), getProductosDeBodega(), formatFechaLarga(), MESES, minutosDesde(), HistoricoScreen(), InicioScreen(), RegistrosScreen() (+5 more)

### Community 24 - "Legacy Menubar Component"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 25 - "Alertas & Notificaciones"
Cohesion: 0.26
Nodes (10): AlertBell(), getAlertas(), textoAlerta(), recibeAlertas(), referenciaHistorica(), Validacion, AlertasScreen(), AlertsState (+2 more)

### Community 26 - "Legacy Supabase Server Client & Types"
Cohesion: 0.14
Nodes (12): requireSupabaseAuth, supabaseAdmin, CompositeTypes, Constants, Database, DatabaseWithoutInternals, DefaultSchema, Enums (+4 more)

### Community 27 - "Legacy Package Config (variant)"
Cohesion: 0.13
Nodes (15): clsx, embla-carousel-react, dependencies, clsx, embla-carousel-react, @radix-ui/react-collapsible, @radix-ui/react-radio-group, @radix-ui/react-scroll-area (+7 more)

### Community 28 - "Frontend Package Config (variant A)"
Cohesion: 0.13
Nodes (15): dependencies, lucide-react, react, react-dom, react-router-dom, @supabase/supabase-js, xlsx, zustand (+7 more)

### Community 29 - "Frontend Package Config (variant B)"
Cohesion: 0.13
Nodes (15): devDependencies, oxlint, tailwindcss, @tailwindcss/vite, @types/node, vite, vite-plugin-pwa, @vitejs/plugin-react (+7 more)

### Community 30 - "Legacy Carousel Component"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 31 - "TopBar, Ficha & Registros UI"
Cohesion: 0.28
Nodes (8): TopBar(), BODEGAS, getBodegaById(), getZonaById(), ZONAS, ZONAS_POR_BODEGA, AlertaRow(), FichaScreen()

### Community 32 - "Identificacion & Desambiguacion de Producto"
Cohesion: 0.27
Nodes (8): CodigoDialog(), CodigoDialogProps, BigButton(), Chip(), DesambiguarScreen(), DesambiguarState, IdentificarScreen(), Producto

### Community 33 - "Legacy Form Component"
Cohesion: 0.17
Nodes (9): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+1 more)

### Community 34 - "App Shell, Sync & Offline"
Cohesion: 0.31
Nodes (5): RequireAuth(), RolPill(), OfflineScreen(), SyncState, useSyncStore

### Community 35 - "Legacy Chart Component"
Cohesion: 0.18
Nodes (7): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, THEMES

### Community 36 - "Legacy Context Menu Component"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 37 - "Legacy Dropdown Menu Component"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 38 - "Root Package Config"
Cohesion: 0.20
Nodes (9): description, name, private, scripts, build, dev, lint, preview (+1 more)

### Community 39 - "Frontend Lint Config"
Cohesion: 0.22
Nodes (8): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, typescript, warn

### Community 40 - "Legacy Navigation Menu Component"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 41 - "Frontend Package Config (variant C)"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 42 - "BigButton Component"
Cohesion: 0.33
Nodes (5): BigButtonProps, Size, sizeStyles, Variant, variantStyles

### Community 43 - "Frontend Package Config (variant D)"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 44 - "Supabase admin-auth Edge Function"
Cohesion: 0.40
Nodes (3): corsHeaders, RequestBody, Role

### Community 45 - "MicButton Component"
Cohesion: 0.50
Nodes (3): labels, MicButtonProps, MicState

### Community 46 - "ProgressRing Component"
Cohesion: 0.50
Nodes (3): dims, ProgressRingProps, Size

## Knowledge Gaps
- **448 isolated node(s):** `$schema`, `typescript`, `oxc`, `react/rules-of-hooks`, `warn` (+443 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **63 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `Legacy shadcn UI Components (extended)` to `Legacy UI Primitives (dialogs/forms)`, `Legacy App Routing & Auth Provider`, `Legacy App Sidebar & Navigation`, `Catalogo, Bodegas & Zonas (mock)`, `Design System UI Components`, `Legacy shadcn UI (tabs/popover/command)`, `Legacy UI Primitives & Utils`, `Sesion, Login & Permisos`, `Auth, Usuarios & Supabase Client (frontend)`, `Layout Shell & Barcode Service`, `Busqueda de Productos & Voz (STT)`, `Legacy Supabase Auth Integration`, `Conteo, Unidad & Validacion`, `Legacy Auth Routes & UI`, `Historico, Registros & Reporte`, `Legacy Menubar Component`, `Alertas & Notificaciones`, `Legacy Carousel Component`, `TopBar, Ficha & Registros UI`, `Identificacion & Desambiguacion de Producto`, `Legacy Form Component`, `App Shell, Sync & Offline`, `Legacy Chart Component`, `Legacy Context Menu Component`, `Legacy Dropdown Menu Component`, `Frontend Lint Config`, `Legacy Navigation Menu Component`, `BigButton Component`?**
  _High betweenness centrality (0.282) - this node is a cross-community bridge._
- **Why does `EscanearScreen()` connect `Layout Shell & Barcode Service` to `App Shell, Sync & Offline`, `Sesion, Login & Permisos`, `Historico, Registros & Reporte`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **Why does `html5-qrcode` connect `Layout Shell & Barcode Service` to `Frontend Package Config (variant A)`?**
  _High betweenness centrality (0.062) - this node is a cross-community bridge._
- **What connects `$schema`, `typescript`, `oxc` to the rest of the system?**
  _448 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Legacy UI Primitives (dialogs/forms)` be split into smaller, more focused modules?**
  _Cohesion score 0.07832080200501253 - nodes in this community are weakly interconnected._
- **Should `Legacy App Routing & Auth Provider` be split into smaller, more focused modules?**
  _Cohesion score 0.054693877551020405 - nodes in this community are weakly interconnected._
- **Should `Legacy App Sidebar & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.05795918367346939 - nodes in this community are weakly interconnected._