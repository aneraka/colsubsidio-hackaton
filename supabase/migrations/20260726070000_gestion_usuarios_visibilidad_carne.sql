-- Módulo de gestión de usuarios: acota la visibilidad de perfiles (admin ya no debe ver
-- super_admin ni otros admin, solo lider/operario), agrega permiso de EDICIÓN para admin
-- sobre esas mismas filas (hoy no tenía ninguno vía RLS), añade profiles.carne (mismo
-- concepto que Usuario.carne del frontend: código de barras del carné físico) y cierra el
-- hueco de "dos operarios principal/revisor de la misma bodega" con índices únicos
-- parciales (esta misma regla también es la que necesita el nuevo módulo de Gestión de
-- Bodegas: "solo dos operarios, uno principal y uno secundario").
--
-- Todo ADITIVO salvo una política que se reemplaza por ser demasiado permisiva (ver abajo).
-- No se elimina ninguna tabla/columna existente.

-- ============================================================================
-- 1. profiles: admin deja de ver TODOS los perfiles; solo lider/operario
-- ============================================================================
-- "Admins consultan perfiles" (20260726031234) dejaba a un admin ver TODAS las filas,
-- incluidas super_admin. Se reemplaza por una versión acotada por rol objetivo.
DROP POLICY "Admins consultan perfiles" ON public.profiles;

CREATE POLICY "Admins consultan lideres y operarios" ON public.profiles
  FOR SELECT USING (
    (public.get_user_role() = 'admin'::public.user_role)
    AND (role = ANY (ARRAY['lider'::public.user_role, 'operario'::public.user_role]))
  );

-- Nueva capacidad: hoy admin no tenía NINGÚN permiso de escritura sobre profiles vía RLS
-- (solo "Super admins gestionan perfiles" FOR ALL, restringida a super_admin). Se necesita
-- para que un admin pueda editar nombre/carné de líderes y operarios directamente desde el
-- cliente, sin pasar por la edge function (que solo cubre password/creación/borrado).
CREATE POLICY "Admins actualizan lideres y operarios" ON public.profiles
  FOR UPDATE USING (
    (public.get_user_role() = 'admin'::public.user_role)
    AND (role = ANY (ARRAY['lider'::public.user_role, 'operario'::public.user_role]))
  ) WITH CHECK (
    (public.get_user_role() = 'admin'::public.user_role)
    AND (role = ANY (ARRAY['lider'::public.user_role, 'operario'::public.user_role]))
  );

-- Nota: "Usuarios pueden ver su propio perfil" (sin cambios) sigue dejando a un admin ver
-- SU PROPIA fila (rol admin) al hacer listarUsuarios(). Es la fila de su propia cuenta, no
-- la de "otro admin" — decisión explícita, no un descuido.

-- ============================================================================
-- 2. profiles.carne — mismo concepto que Usuario.carne (código de barras del carné físico,
-- usado hoy solo contra el mock en LoginScreen/EscanearScreen). Nullable (usuarios ya
-- sembrados no tienen), único cuando existe — mismo patrón que products_codigo_barras_unique.
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN carne text;
CREATE UNIQUE INDEX profiles_carne_unique ON public.profiles (lower(carne)) WHERE carne IS NOT NULL;

-- ============================================================================
-- 3. warehouse_operators: a lo sumo 1 "principal" y 1 "revisor" por bodega, GLOBALMENTE.
-- Hoy el único unique era (operario_id, warehouse_id): no impedía que dos operarios
-- distintos fueran ambos "principal" de la misma bodega al mismo tiempo.
-- ============================================================================
CREATE UNIQUE INDEX warehouse_operators_bodega_principal_unique
  ON public.warehouse_operators (warehouse_id)
  WHERE assignment_role = 'principal';

CREATE UNIQUE INDEX warehouse_operators_bodega_revisor_unique
  ON public.warehouse_operators (warehouse_id)
  WHERE assignment_role = 'revisor';
