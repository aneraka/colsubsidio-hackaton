-- Fix audit trail forgery: enforce user_id = auth.uid() on inventory_logs INSERT
DROP POLICY IF EXISTS "Todos pueden insertar registros" ON public.inventory_logs;
CREATE POLICY "Usuarios autenticados insertan sus propios registros"
ON public.inventory_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Harden SECURITY DEFINER functions: set search_path
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF (NEW.type = 'entrada') THEN
            UPDATE products SET current_stock = current_stock + NEW.quantity WHERE id = NEW.product_id;
        ELSIF (NEW.type = 'salida') THEN
            UPDATE products SET current_stock = current_stock - NEW.quantity WHERE id = NEW.product_id;
        ELSIF (NEW.type = 'conteo_manual') THEN
            UPDATE products SET current_stock = NEW.quantity WHERE id = NEW.product_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- Restrict EXECUTE on SECURITY DEFINER / trigger functions exposed via API
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_product_stock() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_product_stock() TO service_role;