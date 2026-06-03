// Aliados comerciales de Travel World Colombia.
// Logos optimizados con: node scripts/optimize-logos.mjs
// Origen: raw-images/alianzas/{hoteles-cruceros,aerolineas}/*.png (transparentes)
// Salida pública: /img/alianzas/<slug>.webp

export interface Alianza {
  nombre: string
  /** Ruta pública del logo optimizado, o undefined para fallback de texto. */
  logo?: string
  /** Texto alternativo para SEO/accesibilidad. */
  alt: string
}

/** Fila 1 — Hoteles y cruceros (se desplaza hacia la izquierda). */
export const HOTELES_CRUCEROS: Alianza[] = [
  { nombre: 'Princess Hotels & Resorts', logo: '/img/alianzas/princess-hotels-resorts.webp',    alt: 'Princess Hotels & Resorts' },
  { nombre: 'RIU Hotels & Resorts',      logo: '/img/alianzas/riu-hotels-resorts.webp',         alt: 'RIU Hotels & Resorts' },
  { nombre: 'Decameron',                 logo: '/img/alianzas/decameron-hoteles-resorts.webp',  alt: 'Decameron All Inclusive Hotels & Resorts' },
  { nombre: 'Xcaret México',             logo: '/img/alianzas/xcaret-mexico.webp',              alt: 'Xcaret México — parques y experiencias' },
  { nombre: 'Hotel Xcaret México',       logo: '/img/alianzas/hotel-xcaret-mexico.webp',        alt: 'Hotel Xcaret México' },
  { nombre: 'Nickelodeon Hotels',        logo: '/img/alianzas/nickelodeon-hotels-resorts.webp', alt: 'Nickelodeon Hotels & Resorts Riviera Maya' },
  { nombre: 'Walt Disney World',         logo: '/img/alianzas/walt-disney-world.webp',          alt: 'Walt Disney World Resort' },
  { nombre: 'Moon Palace',               logo: '/img/alianzas/moon-palace.webp',                alt: 'Moon Palace Resorts' },
  { nombre: 'Royal Caribbean',           logo: '/img/alianzas/royal-caribbean.webp',            alt: 'Royal Caribbean International' },
  { nombre: 'Celebrity Cruises',         logo: '/img/alianzas/celebrity-cruises.webp',          alt: 'Celebrity Cruises' },
  { nombre: 'MSC Cruises',               logo: '/img/alianzas/msc-cruises.webp',                alt: 'MSC Cruises' },
  { nombre: 'Disney Cruise Line',        logo: '/img/alianzas/disney-cruise-line.webp',         alt: 'Disney Cruise Line' },
  { nombre: 'Carnival',                  logo: '/img/alianzas/carnival-cruise-line.webp',       alt: 'Carnival Cruise Line' },
]

/** Fila 2 — Aerolíneas (se desplaza hacia la derecha). */
export const AEROLINEAS: Alianza[] = [
  { nombre: 'Avianca',           logo: '/img/alianzas/avianca.webp',           alt: 'Avianca — aerolínea de Colombia' },
  { nombre: 'Copa Airlines',     logo: '/img/alianzas/copa-airlines.webp',     alt: 'Copa Airlines — Panamá' },
  { nombre: 'LATAM Airlines',    logo: '/img/alianzas/latam-airlines.webp',    alt: 'LATAM Airlines' },
  { nombre: 'American Airlines', logo: '/img/alianzas/american-airlines.webp', alt: 'American Airlines' },
  { nombre: 'Delta Air Lines',   logo: '/img/alianzas/delta-air-lines.webp',   alt: 'Delta Air Lines' },
  { nombre: 'Emirates',          logo: '/img/alianzas/emirates.webp',          alt: 'Emirates Airlines' },
  { nombre: 'Japan Airlines',    logo: '/img/alianzas/japan-airlines.webp',    alt: 'Japan Airlines (JAL)' },
  { nombre: 'Wingo',             logo: '/img/alianzas/wingo.webp',             alt: 'Wingo — aerolínea de bajo costo' },
]
