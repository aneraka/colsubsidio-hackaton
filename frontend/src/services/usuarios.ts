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
  carne: string | null
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
    .select('id, email, full_name, role, carne')
    .order('email')
  if (error) throw new Error(error.message)
  return (data ?? []).map((p) => ({
    id: p.id,
    correo: p.email,
    nombre: p.full_name ?? p.email,
    rolBackend: p.role as RolBackend,
    carne: p.carne ?? null,
  }))
}

/** Edita nombre y/o carné de un usuario ya existente (admin: solo lider/operario; super_admin: cualquiera). */
export async function actualizarPerfil(
  userId: string,
  cambios: { nombre?: string; carne?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = {}
  if (cambios.nombre !== undefined) payload.full_name = cambios.nombre
  if (cambios.carne !== undefined) payload.carne = cambios.carne || null

  const { data, error } = await supabase.from('profiles').update(payload).eq('id', userId).select('id')
  if (error) {
    if (error.code === '23505') throw new Error('Ese carné ya está asignado a otro usuario')
    throw new Error(error.message)
  }
  if (!data || data.length === 0) {
    throw new Error('No tienes permiso para editar este usuario')
  }
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
  if (asignaciones.length > 0) {
    const { data: existentes, error: checkError } = await supabase
      .from('warehouse_operators')
      .select('warehouse_id, assignment_role, operario_id, profiles(full_name, email), warehouses(name)')
      .in(
        'warehouse_id',
        asignaciones.map((a) => a.warehouseId),
      )
      .neq('operario_id', operarioId)
    if (checkError) throw new Error(checkError.message)

    for (const a of asignaciones) {
      const conflicto = (existentes ?? []).find(
        (e) => e.warehouse_id === a.warehouseId && e.assignment_role === a.rol,
      )
      if (conflicto) {
        const perfil = Array.isArray(conflicto.profiles) ? conflicto.profiles[0] : conflicto.profiles
        const bodega = Array.isArray(conflicto.warehouses) ? conflicto.warehouses[0] : conflicto.warehouses
        const rolLabel = a.rol === 'principal' ? 'Principal' : 'Secundario'
        throw new Error(
          `${bodega?.name ?? 'Esta bodega'} ya tiene a ${perfil?.full_name ?? perfil?.email ?? 'otro usuario'} como ${rolLabel}. Quítalo primero.`,
        )
      }
    }
  }

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
  if (insError) {
    if (insError.code === '23505') {
      throw new Error('Alguien más tomó ese rol mientras guardabas. Vuelve a intentarlo.')
    }
    throw new Error(insError.message)
  }
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
  rol: RolBackend,
  nombre: string,
  carne?: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('admin-auth', {
    body: {
      action: 'createUser',
      payload: { email: correo, password: pin, role: rol, fullName: nombre, carne: carne || undefined },
    },
  })
  if (error) throw new Error(error.message)
  if (data?.error) throw new Error(data.error)
}

export interface Titular {
  id: string
  nombre: string
}

/** Trae, por bodega, quién es el operario principal y quién el secundario (revisor) en TODA la base. */
export async function getTitularesDeBodegas(): Promise<
  Record<string, { principal?: Titular; revisor?: Titular }>
> {
  const { data, error } = await supabase
    .from('warehouse_operators')
    .select('warehouse_id, assignment_role, operario_id, profiles(full_name, email)')
  if (error) throw new Error(error.message)
  const mapa: Record<string, { principal?: Titular; revisor?: Titular }> = {}
  for (const row of data ?? []) {
    const perfil = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    const titular: Titular = { id: row.operario_id, nombre: perfil?.full_name ?? perfil?.email ?? 'Desconocido' }
    mapa[row.warehouse_id] ??= {}
    if (row.assignment_role === 'principal') mapa[row.warehouse_id].principal = titular
    else mapa[row.warehouse_id].revisor = titular
  }
  return mapa
}
