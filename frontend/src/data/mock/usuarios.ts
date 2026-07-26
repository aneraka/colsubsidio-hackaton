import type { Usuario } from '../../types/domain'

// Usuarios del panel: contadores (cuentan) y auditores (ven reporte, exportan, reciben alertas).
export const USUARIOS: Usuario[] = [
  { id: 'OP-1042', nombre: 'Juan P.', correo: 'juan.perez@colsubsidio.com', pin: '1234', carne: 'CARNE-1042', rol: 'contador' },
  { id: 'OP-2088', nombre: 'Sandra M.', correo: 'sandra.martinez@colsubsidio.com', pin: '5678', carne: 'CARNE-2088', rol: 'contador' },
  { id: 'AU-3001', nombre: 'Viviana R.', correo: 'viviana.rojas@colsubsidio.com', pin: '9999', carne: 'CARNE-3001', rol: 'auditor' },
  { id: 'AU-0000', nombre: 'Admin', correo: 'admin@colsubsidio.com', pin: '0000', carne: 'CARNE-0000', rol: 'auditor' },
]

export const validarPin = (pin: string): Usuario | null => USUARIOS.find((u) => u.pin === pin) ?? null

export const validarCorreo = (correo: string): Usuario | null =>
  USUARIOS.find((u) => u.correo.toLowerCase() === correo.trim().toLowerCase()) ?? null

export const validarCarne = (carne: string): Usuario | null =>
  USUARIOS.find((u) => u.carne.trim().toLowerCase() === carne.trim().toLowerCase()) ?? null

export const getUsuarioById = (id: string): Usuario | undefined => USUARIOS.find((u) => u.id === id)
export const getUsuarioNombre = (id: string): string => getUsuarioById(id)?.nombre ?? id
