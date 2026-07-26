import type { Usuario } from '../types/domain'

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
