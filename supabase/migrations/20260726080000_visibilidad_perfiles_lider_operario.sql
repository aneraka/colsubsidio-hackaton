-- Bug encontrado en pruebas manuales del módulo Gestión de Bodegas: líder y operario no
-- tenían NINGUNA política SELECT sobre profiles de otras personas (solo admin/super_admin/
-- self), así que el join a profiles(full_name) en warehouse_operators devolvía null y la UI
-- mostraba "Desconocido" en vez del nombre del Principal/Secundario/Líder.
--
-- Aditivo: solo agrega 2 políticas SELECT nuevas, acotadas, sin tocar nada existente.

-- Líder ve los perfiles de los operarios asignados a bodegas de SU sede (para mostrar
-- nombres de Principal/Secundario en Gestión de Bodegas).
CREATE POLICY "Lider ve operarios de su sede" ON public.profiles
  FOR SELECT USING (
    (public.get_user_role() = 'lider'::public.user_role)
    AND (id IN (
      SELECT operario_id FROM public.warehouse_operators WHERE site_id = public.get_active_site_id()
    ))
  );

-- Operario ve el perfil del líder de su sede y de otros operarios con quienes comparte
-- alguna bodega (para mostrar esos mismos nombres desde su propia vista de bodega).
CREATE POLICY "Operario ve perfiles relacionados a sus bodegas" ON public.profiles
  FOR SELECT USING (
    (public.get_user_role() = 'operario'::public.user_role)
    AND (
      id IN (
        SELECT wo2.operario_id
        FROM public.warehouse_operators wo1
        JOIN public.warehouse_operators wo2 ON wo2.warehouse_id = wo1.warehouse_id
        WHERE wo1.operario_id = auth.uid()
      )
      OR id IN (
        SELECT s.leader_id
        FROM public.warehouse_operators wo
        JOIN public.warehouses w ON w.id = wo.warehouse_id
        JOIN public.sites s ON s.id = w.site_id
        WHERE wo.operario_id = auth.uid()
      )
    )
  );
