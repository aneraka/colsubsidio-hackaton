-- Extiende el esquema real (sites/warehouses/products/inventory_logs) para cubrir el flujo de
-- conteo que hoy vive en mock/localStorage: zonas, ruta, histórico mensual, códigos de barras
-- N:1, sesiones de conteo (ciclos), trazabilidad de captura, alias de jerga y alertas persistidas.
--
-- Todo es ADITIVO: no se elimina ni renombra ninguna columna/tabla existente. `products.codigo_barras`
-- se conserva para compatibilidad; `product_barcodes` lo complementa permitiendo N códigos por artículo.

-- ============================================================================
-- 1. Zonas (ruta guiada de conteo dentro de una bodega)
-- ============================================================================
CREATE TABLE public.zones (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  warehouse_id uuid NOT NULL,
  name text NOT NULL,
  "order" int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zones ADD CONSTRAINT zones_pkey PRIMARY KEY (id);
ALTER TABLE public.zones ADD CONSTRAINT zones_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;
ALTER TABLE public.zones ADD CONSTRAINT zones_warehouse_id_name_key UNIQUE (warehouse_id, name);
GRANT ALL ON public.zones TO anon;
GRANT ALL ON public.zones TO authenticated;
GRANT ALL ON public.zones TO service_role;
CREATE TRIGGER trg_audit_zones AFTER INSERT OR DELETE OR UPDATE ON public.zones FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Admins gestionan zonas" ON public.zones USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve zonas de su sede" ON public.zones FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id FROM public.warehouses WHERE (warehouses.site_id = public.get_active_site_id())))));
CREATE POLICY "Operario ve zonas de sus bodegas asignadas" ON public.zones FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id)));

-- ============================================================================
-- 2. warehouse_products: ubicación en la ruta (zona + orden)
-- ============================================================================
ALTER TABLE public.warehouse_products
  ADD COLUMN zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  ADD COLUMN route_order int NOT NULL DEFAULT 0;

-- ============================================================================
-- 3. Histórico mensual de existencias (bandas de anomalía: [hist×0.5, hist×1.5])
-- ============================================================================
CREATE TABLE public.warehouse_product_stock_history (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  warehouse_id uuid NOT NULL,
  product_id uuid NOT NULL,
  period date NOT NULL, -- primer día del mes que representa (ej. 2026-06-01)
  stock numeric NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.warehouse_product_stock_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_product_stock_history ADD CONSTRAINT warehouse_product_stock_history_pkey PRIMARY KEY (id);
ALTER TABLE public.warehouse_product_stock_history ADD CONSTRAINT warehouse_product_stock_history_wh_product_fkey FOREIGN KEY (warehouse_id, product_id) REFERENCES public.warehouse_products(warehouse_id, product_id) ON DELETE CASCADE;
ALTER TABLE public.warehouse_product_stock_history ADD CONSTRAINT warehouse_product_stock_history_unique UNIQUE (warehouse_id, product_id, period);
GRANT ALL ON public.warehouse_product_stock_history TO anon;
GRANT ALL ON public.warehouse_product_stock_history TO authenticated;
GRANT ALL ON public.warehouse_product_stock_history TO service_role;
CREATE TRIGGER trg_audit_warehouse_product_stock_history AFTER INSERT OR DELETE OR UPDATE ON public.warehouse_product_stock_history FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Admins gestionan historico de stock" ON public.warehouse_product_stock_history USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve historico de su sede" ON public.warehouse_product_stock_history FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id FROM public.warehouses WHERE (warehouses.site_id = public.get_active_site_id())))));
CREATE POLICY "Operario ve historico de sus bodegas asignadas" ON public.warehouse_product_stock_history FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id)));

-- ============================================================================
-- 4. Códigos de barras N:1 (un producto puede tener varios EAN; enrolamiento en campo)
-- ============================================================================
CREATE TABLE public.product_barcodes (
  ean text NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.product_barcodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_barcodes ADD CONSTRAINT product_barcodes_pkey PRIMARY KEY (ean);
ALTER TABLE public.product_barcodes ADD CONSTRAINT product_barcodes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
GRANT ALL ON public.product_barcodes TO anon;
GRANT ALL ON public.product_barcodes TO authenticated;
GRANT ALL ON public.product_barcodes TO service_role;
CREATE TRIGGER trg_audit_product_barcodes AFTER INSERT OR DELETE OR UPDATE ON public.product_barcodes FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Todos pueden ver codigos de barras" ON public.product_barcodes FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Autenticados enrolan codigos de barras" ON public.product_barcodes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins eliminan codigos de barras" ON public.product_barcodes FOR DELETE USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));

-- Backfill: todo codigo_barras existente en products pasa también a product_barcodes,
-- sin tocar la columna original (queda como código "principal" heredado).
INSERT INTO public.product_barcodes (ean, product_id)
SELECT codigo_barras, id FROM public.products WHERE codigo_barras IS NOT NULL
ON CONFLICT (ean) DO NOTHING;

-- ============================================================================
-- 5. Sesiones de conteo (ciclos): agrupan capturas por operario+bodega+fecha de ciclo
-- ============================================================================
CREATE TYPE public.count_session_status AS ENUM ('activo', 'cerrado');

CREATE TABLE public.count_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  warehouse_id uuid NOT NULL,
  operario_id uuid NOT NULL,
  cycle_date date NOT NULL, -- fecha_ciclo (ej. último día del mes)
  status public.count_session_status DEFAULT 'activo'::public.count_session_status NOT NULL,
  summary jsonb, -- resumen congelado al cerrar (articulosContados, novedades, bodegasCompletas, operarios, duracionMin)
  started_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz,
  closed_by uuid
);
ALTER TABLE public.count_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.count_sessions ADD CONSTRAINT count_sessions_pkey PRIMARY KEY (id);
ALTER TABLE public.count_sessions ADD CONSTRAINT count_sessions_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE RESTRICT;
ALTER TABLE public.count_sessions ADD CONSTRAINT count_sessions_operario_id_fkey FOREIGN KEY (operario_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.count_sessions ADD CONSTRAINT count_sessions_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.profiles(id);
GRANT ALL ON public.count_sessions TO anon;
GRANT ALL ON public.count_sessions TO authenticated;
GRANT ALL ON public.count_sessions TO service_role;
CREATE TRIGGER trg_audit_count_sessions AFTER INSERT OR DELETE OR UPDATE ON public.count_sessions FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Admins gestionan sesiones de conteo" ON public.count_sessions USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve sesiones de su sede" ON public.count_sessions FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id FROM public.warehouses WHERE (warehouses.site_id = public.get_active_site_id())))));
CREATE POLICY "Operario gestiona sus propias sesiones" ON public.count_sessions USING (((public.get_user_role() = 'operario'::public.user_role) AND (operario_id = auth.uid()) AND public.is_operator_of_warehouse(warehouse_id)));

-- ============================================================================
-- 6. inventory_logs: trazabilidad completa de la captura (regla de negocio #6 de CLAUDE.md)
-- ============================================================================
CREATE TYPE public.identification_method AS ENUM ('ruta', 'escaneo', 'codigo', 'nombre');
CREATE TYPE public.input_method AS ENUM ('voz', 'teclado');

ALTER TABLE public.inventory_logs
  ADD COLUMN count_session_id uuid REFERENCES public.count_sessions(id) ON DELETE SET NULL,
  ADD COLUMN zone_id uuid REFERENCES public.zones(id) ON DELETE SET NULL,
  ADD COLUMN identification_method public.identification_method,
  ADD COLUMN capture_method public.input_method,
  ADD COLUMN expression text,       -- "2 × 12 + 5 = 29"
  ADD COLUMN original_phrase text,  -- "dos cajas de doce y cinco sueltas"
  ADD COLUMN confidence numeric,    -- 0-1 del STT/intérprete
  ADD COLUMN is_novelty boolean NOT NULL DEFAULT false; -- atípico confirmado por hold-to-confirm

-- ============================================================================
-- 7. Alias (jerga -> producto): aprendizaje de desambiguación por voz/nombre
-- ============================================================================
CREATE TABLE public.product_aliases (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  term text NOT NULL,
  product_id uuid NOT NULL,
  created_by uuid,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_aliases ADD CONSTRAINT product_aliases_pkey PRIMARY KEY (id);
ALTER TABLE public.product_aliases ADD CONSTRAINT product_aliases_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.product_aliases ADD CONSTRAINT product_aliases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id);
ALTER TABLE public.product_aliases ADD CONSTRAINT product_aliases_term_product_key UNIQUE (term, product_id);
GRANT ALL ON public.product_aliases TO anon;
GRANT ALL ON public.product_aliases TO authenticated;
GRANT ALL ON public.product_aliases TO service_role;
CREATE TRIGGER trg_audit_product_aliases AFTER INSERT OR DELETE OR UPDATE ON public.product_aliases FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Todos pueden ver alias" ON public.product_aliases FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Autenticados aprenden alias" ON public.product_aliases FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Admins eliminan alias" ON public.product_aliases FOR DELETE USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));

-- ============================================================================
-- 8. Alertas persistidas (atipico / decimal / sd_negativo) con estado "revisada"
-- ============================================================================
CREATE TYPE public.alert_type AS ENUM ('atipico', 'decimal', 'sd_negativo');

CREATE TABLE public.alerts (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  type public.alert_type NOT NULL,
  product_id uuid NOT NULL,
  warehouse_id uuid NOT NULL,
  zone_id uuid,
  quantity numeric NOT NULL,
  reference numeric, -- referencia historica (solo aplica a 'atipico')
  operario_id uuid NOT NULL,
  count_session_id uuid,
  reviewed boolean DEFAULT false NOT NULL,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_pkey PRIMARY KEY (id);
ALTER TABLE public.alerts ADD CONSTRAINT alerts_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.zones(id) ON DELETE SET NULL;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_operario_id_fkey FOREIGN KEY (operario_id) REFERENCES public.profiles(id);
ALTER TABLE public.alerts ADD CONSTRAINT alerts_count_session_id_fkey FOREIGN KEY (count_session_id) REFERENCES public.count_sessions(id) ON DELETE SET NULL;
ALTER TABLE public.alerts ADD CONSTRAINT alerts_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id);
GRANT ALL ON public.alerts TO anon;
GRANT ALL ON public.alerts TO authenticated;
GRANT ALL ON public.alerts TO service_role;
CREATE TRIGGER trg_audit_alerts AFTER INSERT OR DELETE OR UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION audit.log_change();

CREATE POLICY "Admins gestionan alertas" ON public.alerts USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve y revisa alertas de su sede" ON public.alerts USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id FROM public.warehouses WHERE (warehouses.site_id = public.get_active_site_id())))));
CREATE POLICY "Operario ve alertas de sus bodegas asignadas" ON public.alerts FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id)));
CREATE POLICY "Autenticados insertan alertas de sus propias capturas" ON public.alerts FOR INSERT TO authenticated WITH CHECK ((operario_id = auth.uid()));
