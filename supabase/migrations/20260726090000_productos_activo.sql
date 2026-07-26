-- Módulo Gestión de productos: en vez de permitir borrar un producto (lo que en cascada
-- eliminaría sus vínculos en warehouse_products y su historial en inventory_logs), se agrega
-- un flag de inhabilitado. Un producto inhabilitado sigue siendo visible (historial, bodegas
-- que ya lo tenían) pero deja de poder vincularse a nuevas bodegas.
--
-- Aditivo: una sola columna nueva, con default para no romper filas existentes. Sin cambios
-- de RLS — "Admins gestionan productos"/"Todos pueden ver productos" ya cubren esta columna.
ALTER TABLE public.products ADD COLUMN active boolean NOT NULL DEFAULT true;
