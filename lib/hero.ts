import type { Destino } from '@/types/destino'

/** Imagen de fondo del hero — Picsum con seed fijo por slug (placeholder temporal). */
export function heroBg(destino: Pick<Destino, 'slug'>): string {
  return `https://picsum.photos/seed/${destino.slug}-hero/1600/900`
}

/** Thumbnail circular — Picsum con seed fijo por slug. */
export function heroThumb(destino: Pick<Destino, 'slug'>): string {
  return `https://picsum.photos/seed/${destino.slug}-hero/120/120`
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
