import type { Rol } from '../../types/domain'

/** Pill del rol: azul "Contador" / dorado-ámbar "Auditor". */
export function RolPill({ rol, size = 'md' }: { rol: Rol; size?: 'sm' | 'md' }) {
  const auditor = rol === 'auditor'
  const pad = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span
      className={`inline-flex items-center rounded-full font-bold no-select ${pad}`}
      style={
        auditor
          ? { background: 'var(--color-brand-yellow)', color: 'var(--color-graphite)' }
          : { background: 'var(--color-brand-blue-soft)', color: 'var(--color-brand-blue)' }
      }
    >
      {auditor ? 'Auditor' : 'Contador'}
    </span>
  )
}
