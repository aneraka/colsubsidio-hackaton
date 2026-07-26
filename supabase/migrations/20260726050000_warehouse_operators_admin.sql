-- Módulo de gestión de usuarios: rol por asignación (Principal/Revisor) para permitir que dos
-- operarios cuenten la(s) misma(s) bodega(s) de forma cruzada (auditoría del conteo).
create type public.warehouse_assignment_role as enum ('principal', 'revisor');

alter table public.warehouse_operators
  add column assignment_role public.warehouse_assignment_role not null default 'principal';

-- El catálogo de bodegas que usa el flujo de conteo sigue siendo mock (data/mock/bodegas.ts, IDs tipo
-- 'b-almacen-sumin'). slug permite mapear cada fila real de warehouses a su ID mock sin tocar
-- zonas/productos/capturas todavía.
alter table public.warehouses add column slug text unique;
