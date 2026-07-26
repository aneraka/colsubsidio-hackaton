import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'blue' | 'ghost'
type Size = 'md' | 'lg' | 'xl'

const sizeStyles: Record<Size, string> = {
  md: 'h-16 px-6 text-lg', // 64px
  lg: 'h-[72px] px-7 text-xl',
  xl: 'h-20 px-9 text-2xl', // 80px
}

const variantStyles: Record<Variant, string> = {
  primary:
    'bg-[color:var(--color-brand-yellow)] text-[color:var(--color-graphite)] shadow-[var(--shadow-card)]',
  secondary:
    'bg-white text-[color:var(--color-graphite)] border-2 border-[color:var(--color-graphite)]',
  blue: 'bg-[color:var(--color-brand-blue)] text-white shadow-[var(--shadow-card)]',
  ghost: 'bg-transparent text-[color:var(--color-brand-blue)]',
}

interface BigButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  children: ReactNode
}

export function BigButton({
  variant = 'primary',
  size = 'lg',
  fullWidth = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...rest
}: BigButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-3 rounded-2xl font-bold no-select',
        'transition-transform duration-100 active:scale-[0.98]',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        sizeStyles[size],
        variantStyles[variant],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {iconRight}
    </button>
  )
}
