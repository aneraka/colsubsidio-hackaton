import type { RolBackend, Usuario } from '../types/domain'

/**
 * Permisos por rol. Las pantallas consultan SIEMPRE estos helpers (nunca comparan el rol directo).
 * Solo el auditor ve teóricos/diferencias, exporta, cierra ciclos y recibe alertas.
 * Esto blinda el conteo ciego del contador.
 */
const esAuditor = (u: Usuario | null): boolean => u?.rol === 'auditor'

export const puedeExportar = (u: Usuario | null): boolean => esAuditor(u)
export const puedeVerTeorico = (u: Usuario | null): boolean => esAuditor(u)
export const recibeAlertas = (u: Usuario | null): boolean => esAuditor(u)
export const puedeCerrarCiclo = (u: Usuario | null): boolean => esAuditor(u)

/** Gestión de usuarios (PIN, bodegas a cargo, alta): solo admin/super_admin del backend real. */
export const puedeGestionarUsuarios = (u: Usuario | null): boolean =>
  u?.rolBackend === 'admin' || u?.rolBackend === 'super_admin'

/**
 * Roles que este usuario puede crear/gestionar en Gestión de usuarios.
 * super_admin: los 4 roles. admin: solo lider y operario (nunca admin ni super_admin,
 * ni siquiera para sí mismo/otros admins). lider/operario: ninguno.
 */
export const rolesGestionablesPor = (u: Usuario | null): RolBackend[] => {
  if (u?.rolBackend === 'super_admin') return ['operario', 'lider', 'admin', 'super_admin']
  if (u?.rolBackend === 'admin') return ['lider', 'operario']
  return []
}

/** Gestión de bodegas (renombrar, asignar líder/operarios, catálogo): solo admin/super_admin. */
export const puedeEditarBodegas = (u: Usuario | null): boolean =>
  u?.rolBackend === 'admin' || u?.rolBackend === 'super_admin'

/** Gestión de productos (crear/editar/inhabilitar catálogo global): solo admin/super_admin. */
export const puedeEditarProductos = (u: Usuario | null): boolean =>
  u?.rolBackend === 'admin' || u?.rolBackend === 'super_admin'
