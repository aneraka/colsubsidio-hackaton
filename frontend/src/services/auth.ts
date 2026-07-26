import type { Rol, RolBackend, Usuario } from '../types/domain'
import { supabase } from './supabase'

/**
 * Login por PIN — real contra Supabase Auth (el PIN de 6 dígitos es el password).
 * // TODO(backend): ya está conectado; nada pendiente salvo mover el proyecto a hosted.
 */

const rolBackendAFrontend = (rol: RolBackend): Rol => (rol === 'operario' ? 'contador' : 'auditor')

export async function loginConPin(correo: string, pin: string): Promise<Usuario | null> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: correo.trim().toLowerCase(),
    password: pin,
  })
  if (authError || !authData.user) return null

  const { data: perfil, error: perfilError } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('id', authData.user.id)
    .maybeSingle()
  if (perfilError || !perfil) return null

  return {
    id: perfil.id,
    nombre: perfil.full_name ?? perfil.email,
    correo: perfil.email,
    pin,
    carne: '',
    rol: rolBackendAFrontend(perfil.role as RolBackend),
    rolBackend: perfil.role as RolBackend,
  }
}
