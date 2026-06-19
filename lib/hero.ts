import type { Destino } from '@/types/destino'

/**
 * Imagen de fondo del hero.
 * Prioridad: imagen_hero de Supabase → /img/{slug}/hero.webp → Picsum placeholder
 */
export function heroBg(destino: Pick<Destino, 'slug' | 'imagen_hero'>): string {
  // LOCAL PREVIEW — usa siempre la imagen local optimizada
  // Cuando apruebes las fotos: subir a Supabase y cambiar a destino.imagen_hero
  return `/img/${destino.slug}/hero.webp`
}

/**
 * Thumbnail circular del coverflow.
 * LOCAL PREVIEW — usa siempre la imagen local optimizada
 */
export function heroThumb(destino: Pick<Destino, 'slug' | 'imagen_thumb'>): string {
  return `/img/${destino.slug}/thumb.webp`
}

/**
 * Imagen de la tarjeta de destino (grid del home y /destinos).
 * LOCAL PREVIEW — usa la MISMA imagen del hero para que tarjeta y hero
 * queden sincronizados (ej. República Dominicana → la playa).
 * Cuando subas las fotos a Supabase: cambiar a destino.imagen_thumb.
 */
export function destinoCardImg(destino: Pick<Destino, 'slug' | 'imagen_thumb'>): string {
  return `/img/${destino.slug}/hero.webp`
}

/** Color RGB del glow del hero según la región del destino. */
export function glowColor(region?: string): string {
  switch (region) {
    case 'Caribe':        return '244, 130, 31'   // naranja
    case 'Europa':        return '70, 130, 220'   // azul
    case 'Asia':          return '230, 168, 23'   // dorado
    case 'Norteamérica':  return '90, 150, 235'   // azul claro
    case 'Centroamérica': return '32, 200, 180'   // turquesa
    case 'Suramérica':    return '60, 200, 120'   // verde
    default:              return '244, 130, 31'   // naranja (marca)
  }
}

/** Iniciales para el avatar del autor de la frase. */
export function initials(nombre?: string): string {
  if (!nombre) return 'TW'
  return nombre
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('')
}
