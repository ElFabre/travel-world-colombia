import Link from 'next/link'
import type { ComponentProps, CSSProperties, ReactNode } from 'react'

type Variant = 'primary' | 'outline' | 'whatsapp'
type Size = 'sm' | 'md'

const base =
  'inline-flex items-center justify-center gap-2 font-plus-jakarta font-bold uppercase rounded-sm transition-all duration-300 cursor-pointer'

const variants: Record<Variant, string> = {
  primary:
    'u-shine bg-gradient-orange text-white shadow-orange hover:shadow-orange-lg hover:-translate-y-0.5',
  outline:
    'border border-orange/50 hover:border-orange hover:bg-orange/10',
  whatsapp:
    'bg-[#25D366] text-white shadow-lg hover:bg-[#20BA5A] hover:-translate-y-0.5',
}

const sizes: Record<Size, string> = {
  sm: 'text-[10px] tracking-[0.2em] px-5 py-3',
  md: 'text-[11px] tracking-[0.25em] px-6 py-3',
}

interface CommonProps {
  variant?: Variant
  size?: Size
  children: ReactNode
  className?: string
}

type ButtonAsButton = CommonProps &
  Omit<ComponentProps<'button'>, keyof CommonProps> & { href?: undefined }

type ButtonAsLink = CommonProps &
  Omit<ComponentProps<typeof Link>, keyof CommonProps> & { href: string }

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { variant = 'primary', size = 'md', className = '', children, ...rest } = props
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`
  // El outline toma el color de texto adaptativo del tema, para mantener
  // contraste tanto en secciones claras como oscuras.
  const outlineStyle: CSSProperties | undefined =
    variant === 'outline' ? { color: 'var(--text-primary)' } : undefined

  if ('href' in props && props.href !== undefined) {
    const { href, style, ...linkRest } = rest as ButtonAsLink & { style?: CSSProperties }
    return (
      <Link href={href} className={classes} style={{ ...outlineStyle, ...style }} {...linkRest}>
        {children}
      </Link>
    )
  }

  const { style, ...btnRest } = rest as ButtonAsButton & { style?: CSSProperties }
  return (
    <button className={classes} style={{ ...outlineStyle, ...style }} {...btnRest}>
      {children}
    </button>
  )
}
