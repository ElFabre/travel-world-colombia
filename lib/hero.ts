import type { Destino } from '@/types/destino'

/**
 * ¿La URL es una imagen subida a Supabase Storage (vs. placeholder externo
 * como Unsplash)? Permite migración gradual: si el viaje ya tiene su foto
 * propia en Storage (subida desde el panel) se usa; si no, fallback local.
 */
function esStorage(url?: string): boolean {
  return !!url && url.includes('/storage/v1/object/public/')
}

/**
 * Imagen de fondo del hero. Storage-first → fallback local (/img/{slug}/hero.webp).
 */
export function heroBg(destino: Pick<Destino, 'slug' | 'imagen_hero'>): string {
  return esStorage(destino.imagen_hero) ? destino.imagen_hero! : `/img/${destino.slug}/hero.webp`
}

/**
 * Thumbnail circular del coverflow. Storage-first → fallback local.
 */
export function heroThumb(destino: Pick<Destino, 'slug' | 'imagen_thumb'>): string {
  return esStorage(destino.imagen_thumb) ? destino.imagen_thumb! : `/img/${destino.slug}/thumb.webp`
}

/**
 * Imagen de la tarjeta de destino (grid del home y /destinos), sincronizada
 * con el hero. Storage-first → fallback local.
 */
export function destinoCardImg(destino: Pick<Destino, 'slug' | 'imagen_hero'>): string {
  return esStorage(destino.imagen_hero) ? destino.imagen_hero! : `/img/${destino.slug}/hero.webp`
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
