-- Migración inicial: reconstruye la estructura que ya corría en la base de datos local
-- (capturada vía `supabase db diff --schema public` antes de un `db reset` accidental).
--
-- NOTA IMPORTANTE sobre `audit.log_change()`: el diff original solo cubrió el schema
-- `public`, así que el cuerpo real de esta función (usada por los triggers trg_audit_*)
-- no se capturó y aquí se RECONSTRUYE de forma razonable a partir de cómo se usa (siempre
-- AFTER INSERT/UPDATE/DELETE, escribiendo en `public.audit_logs`, cuyas columnas sí están
-- confirmadas: table_name, record_id, action, changed_by, old_data, new_data, created_at).
-- Revisar si el comportamiento real difería (ej. qué columnas dispara, filtros por tabla).

SET check_function_bodies = false;

CREATE SCHEMA IF NOT EXISTS audit;

CREATE FUNCTION audit.log_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.audit_logs (table_name, record_id, action, changed_by, old_data, new_data)
  values (
    TG_TABLE_NAME,
    coalesce((to_jsonb(NEW)->>'id')::uuid, (to_jsonb(OLD)->>'id')::uuid),
    TG_OP,
    auth.uid(),
    case when TG_OP in ('UPDATE','DELETE') then to_jsonb(OLD) else null end,
    case when TG_OP in ('INSERT','UPDATE') then to_jsonb(NEW) else null end
  );
  return coalesce(NEW, OLD);
end;
$function$;

CREATE TYPE public.transaction_type AS ENUM ('entrada', 'salida', 'conteo_manual');
CREATE TYPE public.user_role AS ENUM ('super_admin', 'admin', 'operario', 'lider');
CREATE FUNCTION public.enforce_single_site_operario()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  wh_site_id uuid;
  conflicting_site uuid;
begin
  select site_id into wh_site_id from public.warehouses where id = NEW.warehouse_id;
  if wh_site_id is null then
    raise exception 'Bodega % no existe', NEW.warehouse_id;
  end if;
  NEW.site_id := wh_site_id;

  select site_id into conflicting_site
    from public.warehouse_operators
    where operario_id = NEW.operario_id and id <> NEW.id and site_id <> wh_site_id
    limit 1;

  if conflicting_site is not null then
    raise exception 'El operario % ya está asignado a bodegas de otra sede (%). Debe desasignarlo primero.',
      NEW.operario_id, conflicting_site;
  end if;

  return NEW;
end;
$function$;
CREATE FUNCTION public.get_active_site_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select id from public.sites where leader_id = auth.uid();
$function$;
CREATE FUNCTION public.get_user_role()
 RETURNS public.user_role
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;
GRANT ALL ON FUNCTION public.get_user_role() TO authenticated;
GRANT ALL ON FUNCTION public.get_user_role() TO service_role;
CREATE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'operario')
  on conflict (id) do nothing;
  return new;
end;
$function$;
CREATE FUNCTION public.is_operator_of_warehouse(wid uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1 from public.warehouse_operators
    where warehouse_id = wid and operario_id = auth.uid()
  );
$function$;
CREATE FUNCTION public.operario_site_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select site_id from public.warehouse_operators where operario_id = auth.uid() limit 1;
$function$;
CREATE FUNCTION public.sync_lider_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if TG_OP = 'UPDATE' and OLD.leader_id is distinct from NEW.leader_id and OLD.leader_id is not null then
    update public.profiles set role = 'operario' where id = OLD.leader_id and role = 'lider';
  end if;
  update public.profiles set role = 'lider' where id = NEW.leader_id;
  return NEW;
end;
$function$;
CREATE FUNCTION public.update_product_stock()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'entrada' then
      update public.warehouse_products set current_stock = current_stock + NEW.quantity, updated_at = now()
        where warehouse_id = NEW.warehouse_id and product_id = NEW.product_id;
    elsif NEW.type = 'salida' then
      update public.warehouse_products set current_stock = current_stock - NEW.quantity, updated_at = now()
        where warehouse_id = NEW.warehouse_id and product_id = NEW.product_id;
    elsif NEW.type = 'conteo_manual' then
      update public.warehouse_products set current_stock = NEW.quantity, updated_at = now()
        where warehouse_id = NEW.warehouse_id and product_id = NEW.product_id;
    end if;
  end if;
  return NEW;
end;
$function$;
GRANT ALL ON FUNCTION public.update_product_stock() TO service_role;
CREATE TABLE public.audit_logs (id uuid DEFAULT gen_random_uuid() NOT NULL, table_name text NOT NULL, record_id uuid, action text NOT NULL, changed_by uuid, old_data jsonb, new_data jsonb, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);
GRANT ALL ON public.audit_logs TO anon;
GRANT ALL ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
CREATE POLICY "Solo admins ven auditoria" ON public.audit_logs FOR SELECT USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE TABLE public.categories (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, created_at timestamp with time zone DEFAULT now());
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ADD CONSTRAINT categories_name_key UNIQUE (name);
ALTER TABLE public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
GRANT ALL ON public.categories TO anon;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
CREATE TRIGGER trg_audit_categories AFTER INSERT OR DELETE OR UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Admins gestionan categorias" ON public.categories USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Todos pueden ver categorias" ON public.categories FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.inventory_logs (id uuid DEFAULT gen_random_uuid() NOT NULL, product_id uuid, user_id uuid, type public.transaction_type NOT NULL, quantity numeric NOT NULL, theoretical_stock numeric, discrepancy numeric DEFAULT 0, notes text, created_at timestamp with time zone DEFAULT now(), warehouse_id uuid NOT NULL);
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_pkey PRIMARY KEY (id);
GRANT ALL ON public.inventory_logs TO anon;
GRANT ALL ON public.inventory_logs TO authenticated;
GRANT ALL ON public.inventory_logs TO service_role;
CREATE TRIGGER tr_update_stock AFTER INSERT ON public.inventory_logs FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();
CREATE TRIGGER trg_audit_inventory_logs AFTER INSERT OR DELETE OR UPDATE ON public.inventory_logs FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Solo super admin puede eliminar registros" ON public.inventory_logs FOR DELETE USING ((public.get_user_role() = 'super_admin'::public.user_role));
CREATE POLICY "Solo super admin puede modificar registros" ON public.inventory_logs FOR UPDATE USING ((public.get_user_role() = 'super_admin'::public.user_role));
CREATE TABLE public.products (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, category_id uuid, unit text NOT NULL, cost_per_unit numeric DEFAULT 0, updated_at timestamp with time zone DEFAULT now(), sku text, codigo_barras text);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD CONSTRAINT products_pkey PRIMARY KEY (id);
GRANT ALL ON public.products TO anon;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
CREATE UNIQUE INDEX products_codigo_barras_unique ON public.products (lower(codigo_barras)) WHERE codigo_barras IS NOT NULL;
CREATE UNIQUE INDEX products_sku_unique ON public.products (lower(sku)) WHERE sku IS NOT NULL;
CREATE TRIGGER trg_audit_products AFTER INSERT OR DELETE OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Admins gestionan productos" ON public.products USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Todos pueden ver productos" ON public.products FOR SELECT USING ((auth.role() = 'authenticated'::text));
CREATE TABLE public.profiles (id uuid NOT NULL, email text NOT NULL, role public.user_role DEFAULT 'operario'::public.user_role NOT NULL, created_at timestamp with time zone DEFAULT now());
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_key UNIQUE (email);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.profiles(id);
ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE TRIGGER trg_audit_profiles AFTER INSERT OR DELETE OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Admins consultan perfiles" ON public.profiles FOR SELECT USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Super admins gestionan perfiles" ON public.profiles USING ((public.get_user_role() = 'super_admin'::public.user_role));
CREATE POLICY "Super admins pueden ver todos los perfiles" ON public.profiles FOR SELECT USING ((public.get_user_role() = 'super_admin'::public.user_role));
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.profiles FOR SELECT USING ((auth.uid() = id));
CREATE TABLE public.sites (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, address text, leader_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ADD CONSTRAINT sites_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
ALTER TABLE public.sites ADD CONSTRAINT sites_leader_id_key UNIQUE (leader_id);
ALTER TABLE public.sites ADD CONSTRAINT sites_name_key UNIQUE (name);
ALTER TABLE public.sites ADD CONSTRAINT sites_pkey PRIMARY KEY (id);
GRANT ALL ON public.sites TO anon;
GRANT ALL ON public.sites TO authenticated;
GRANT ALL ON public.sites TO service_role;
CREATE TRIGGER trg_audit_sites AFTER INSERT OR DELETE OR UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE TRIGGER trg_sync_lider_role AFTER INSERT OR UPDATE OF leader_id ON public.sites FOR EACH ROW EXECUTE FUNCTION public.sync_lider_role();
CREATE POLICY "Admins gestionan sedes" ON public.sites USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve su propia sede" ON public.sites FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (leader_id = auth.uid())));
CREATE POLICY "Operario ve su sede activa" ON public.sites FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND (id = public.operario_site_id())));
CREATE TABLE public.warehouse_operators (id uuid DEFAULT gen_random_uuid() NOT NULL, operario_id uuid NOT NULL, warehouse_id uuid NOT NULL, site_id uuid NOT NULL, assigned_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.warehouse_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_operators ADD CONSTRAINT warehouse_operators_operario_id_fkey FOREIGN KEY (operario_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.warehouse_operators ADD CONSTRAINT warehouse_operators_operario_id_warehouse_id_key UNIQUE (operario_id, warehouse_id);
ALTER TABLE public.warehouse_operators ADD CONSTRAINT warehouse_operators_pkey PRIMARY KEY (id);
ALTER TABLE public.warehouse_operators ADD CONSTRAINT warehouse_operators_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE RESTRICT;
GRANT ALL ON public.warehouse_operators TO anon;
GRANT ALL ON public.warehouse_operators TO authenticated;
GRANT ALL ON public.warehouse_operators TO service_role;
CREATE TRIGGER trg_audit_warehouse_operators AFTER INSERT OR DELETE OR UPDATE ON public.warehouse_operators FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE TRIGGER trg_enforce_single_site_operario BEFORE INSERT OR UPDATE ON public.warehouse_operators FOR EACH ROW EXECUTE FUNCTION public.enforce_single_site_operario();
CREATE POLICY "Admins gestionan operarios de bodega" ON public.warehouse_operators USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Operario ve sus propias asignaciones" ON public.warehouse_operators FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND (operario_id = auth.uid())));
CREATE TABLE public.warehouse_products (id uuid DEFAULT gen_random_uuid() NOT NULL, warehouse_id uuid NOT NULL, product_id uuid NOT NULL, current_stock numeric DEFAULT 0 NOT NULL, min_stock numeric DEFAULT 5 NOT NULL, max_stock numeric, updated_at timestamp with time zone DEFAULT now() NOT NULL);
ALTER TABLE public.warehouse_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_products ADD CONSTRAINT warehouse_products_pkey PRIMARY KEY (id);
ALTER TABLE public.warehouse_products ADD CONSTRAINT warehouse_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE public.warehouse_products ADD CONSTRAINT warehouse_products_warehouse_id_product_id_key UNIQUE (warehouse_id, product_id);
ALTER TABLE public.inventory_logs ADD CONSTRAINT inventory_logs_warehouse_product_fkey FOREIGN KEY (warehouse_id, product_id) REFERENCES public.warehouse_products(warehouse_id, product_id) ON DELETE CASCADE;
GRANT ALL ON public.warehouse_products TO anon;
GRANT ALL ON public.warehouse_products TO authenticated;
GRANT ALL ON public.warehouse_products TO service_role;
CREATE TRIGGER trg_audit_warehouse_products AFTER INSERT OR DELETE OR UPDATE ON public.warehouse_products FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Admins gestionan productos de bodega" ON public.warehouse_products USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Operario consulta productos de sus bodegas" ON public.warehouse_products FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id)));
CREATE TABLE public.warehouses (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, site_id uuid NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE POLICY "Lectura de movimientos segun alcance" ON public.inventory_logs FOR SELECT USING (((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])) OR ((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id
   FROM public.warehouses
  WHERE (warehouses.site_id = public.get_active_site_id())))) OR ((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id))));
CREATE POLICY "Usuarios autenticados insertan sus propios registros" ON public.inventory_logs FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])) OR ((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id
   FROM public.warehouses
  WHERE (warehouses.site_id = public.get_active_site_id())))) OR ((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(warehouse_id)))));
CREATE POLICY "Lider gestiona operarios de su sede" ON public.warehouse_operators USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id
   FROM public.warehouses
  WHERE (warehouses.site_id = public.get_active_site_id())))));
CREATE POLICY "Lider consulta productos de su sede" ON public.warehouse_products FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (warehouse_id IN ( SELECT warehouses.id
   FROM public.warehouses
  WHERE (warehouses.site_id = public.get_active_site_id())))));
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);
ALTER TABLE public.warehouse_operators ADD CONSTRAINT warehouse_operators_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;
ALTER TABLE public.warehouse_products ADD CONSTRAINT warehouse_products_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id) ON DELETE CASCADE;
ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_site_id_fkey FOREIGN KEY (site_id) REFERENCES public.sites(id) ON DELETE RESTRICT;
ALTER TABLE public.warehouses ADD CONSTRAINT warehouses_site_id_name_key UNIQUE (site_id, name);
GRANT ALL ON public.warehouses TO anon;
GRANT ALL ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
CREATE TRIGGER trg_audit_warehouses AFTER INSERT OR DELETE OR UPDATE ON public.warehouses FOR EACH ROW EXECUTE FUNCTION audit.log_change();
CREATE POLICY "Admins gestionan bodegas" ON public.warehouses USING ((public.get_user_role() = ANY (ARRAY['admin'::public.user_role, 'super_admin'::public.user_role])));
CREATE POLICY "Lider ve bodegas de su sede" ON public.warehouses FOR SELECT USING (((public.get_user_role() = 'lider'::public.user_role) AND (site_id = public.get_active_site_id())));
CREATE POLICY "Operario ve sus bodegas asignadas" ON public.warehouses FOR SELECT USING (((public.get_user_role() = 'operario'::public.user_role) AND public.is_operator_of_warehouse(id)));
