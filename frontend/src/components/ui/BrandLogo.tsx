type Size = 'sm' | 'md' | 'lg'

// Alturas en px. lg es grande (login); sm/md para las TopBar.
const px: Record<Size, number> = { sm: 40, md: 52, lg: 120 }

/**
 * Logo de marca — la "K" amarilla oficial recortada a su zona amarilla
 * (public/brand/logo-k.png, fondo transparente). Escala por altura.
 */
export function BrandLogo({ size = 'md', className = '' }: { size?: Size; className?: string }) {
  return (
    <img
      src="/brand/logo-k.png"
      alt="Colsubsidio"
      height={px[size]}
      style={{ height: px[size], width: 'auto' }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  )
}
