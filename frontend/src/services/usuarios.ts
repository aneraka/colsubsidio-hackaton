import type { RolBackend } from '../types/domain'
import { supabase } from './supabase'

/**
 * Gestión de usuarios (admin/super_admin) — real contra Supabase (profiles, warehouse_operators,
 * warehouses, y la edge function admin-auth para lo que requiere el service role).
 */

export interface UsuarioAdmin {
  id: string
  correo: string
  nombre: string
  rolBackend: RolBackend
}

export interface BodegaReal {
  id: string // uuid de warehouses
  slug: string // ID mock equivalente (data/mock/bodegas.ts)
  nombre: string
}

export type AsignacionRol = 'principal' | 'revisor'

export interface AsignacionBodega {
  warehouseId: string
  slug: string
  rol: AsignacionRol
}

export async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role')
    .order('email')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.id,
    correo: p.email,
    nombre: p.full_name ?? p.email,
    rolBackend: p.role as RolBackend,
  }))
}

export async function listarBodegasReales(): Promise<BodegaReal[]> {
  const { data, error } = await supabase.from('warehouses').select('id, slug, name').order('name')
  if (error) throw new Error(error.message)
  return (data ?? []).map((w) => ({ id: w.id, slug: w.slug ?? '', nombre: w.name }))
}

export async function getAsignacionesDeUsuario(operarioId: string): Promise<AsignacionBodega[]> {
  const { data, error } = await supabase
    .from('warehouse_operators')
    .select('warehouse_id, assignment_role, warehouses(slug)')
    .eq('operario_id', operarioId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const warehouse = Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses
    return {
      warehouseId: row.warehouse_id,
      slug: warehouse?.slug ?? '',
      rol: row.assignment_role as AsignacionRol,
    }
  })
}

export async function asignarBodegas(
  operarioId: string,
  asignaciones: { warehouseId: string; rol: AsignacionRol }[],
): Promise<void> {
  const { error: delError } = await supabase.from('warehouse_operators').delete().eq('operario_id', operarioId)
  if (delError) throw new Error(delError.message)

  if (asignaciones.length === 0) return

  const { error: insError } = await supabase.from('warehouse_operators').insert(
    asignaciones.map((a) => ({
      operario_id: operarioId,
      warehouse_id: a.warehouseId,
      assignment_role: a.rol,
    })),
  )
  if (insError) throw new Error(insError.message)
}

export async function getMisBodegasAsignadas(operarioId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('warehouse_operators')
    .select('warehouses(slug)')
    .eq('operario_id', operarioId)
  if (error) throw new Error(error.message)
  return (data ?? [])
    .map((row) => (Array.isArray(row.warehouses) ? row.warehouses[0] : row.warehouses)?.slug as string | undefined)
    .filter((slug): slug is string => !!slug)
}

export async function restablecerPin(userId: string, nuevoPin: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { action: 'updateUserPassword', payload: { userId, password: nuevoPin } },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
}

export async function crearUsuario(
  correo: string,
  pin: string,
  rol: 'operario' | 'admin' | 'super_admin',
  nombre: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: { action: 'createUser', payload: { email: correo, password: pin, role: rol, fullName: nombre } },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
}
