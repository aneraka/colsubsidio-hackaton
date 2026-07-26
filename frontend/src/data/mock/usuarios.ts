import type { Usuario } from '../../types/domain'

// Usuarios del panel: contadores (cuentan) y auditores (ven reporte, exportan, reciben alertas).
// El PIN ya no se valida contra este mock (ver services/auth.ts, va contra Supabase Auth);
// se deja aquí como referencia de las credenciales de demo (ver supabase/seed.sql).
export const USUARIOS: Usuario[] = [
  { id: 'OP-1042', nombre: 'Juan P.', correo: 'juan.perez@colsubsidio.com', pin: '123456', carne: 'CARNE-1042', rol: 'contador', rolBackend: 'operario' },
  { id: 'OP-2088', nombre: 'Sandra M.', correo: 'sandra.martinez@colsubsidio.com', pin: '234567', carne: 'CARNE-2088', rol: 'contador', rolBackend: 'operario' },
  { id: 'AU-3001', nombre: 'Viviana R.', correo: 'viviana.rojas@colsubsidio.com', pin: '345678', carne: 'CARNE-3001', rol: 'auditor', rolBackend: 'admin' },
  { id: 'AU-0000', nombre: 'Admin', correo: 'admin@colsubsidio.com', pin: '456789', carne: 'CARNE-0000', rol: 'auditor', rolBackend: 'super_admin' },
]

export const validarCorreo = (correo: string): Usuario | null =>
  USUARIOS.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase()) ?? null

export const validarCarne = (carne: string): Usuario | null =>
  USUARIOS.find((u) => u.carne.trim().toLowerCase() === carne.trim().toLowerCase()) ?? null

export const getUsuarioById = (id: string): Usuario | undefined => USUARIOS.find((u) => u.id === id)
export const getUsuarioNombre = (id: string): string => getUsuarioById(id)?.nombre ?? id
