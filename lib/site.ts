// Información oficial de Travel World Colombia.
// NAP idéntico en footer, contacto, Schema.org y Google Business Profile.

export const SITE = {
  nombre: 'Travel World Colombia',
  rnt: '27287',
  // Fuente única de la URL del sitio. En local/preview cae al dominio de
  // Vercel; al conectar el dominio propio basta con definir NEXT_PUBLIC_SITE_URL
  // en Vercel (Production) — no hay que tocar código.
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://travel-world-colombia.vercel.app',
  email: 'info@travelworldcolombia.com',

  // NAP — Name, Address, Phone (no modificar el formato sin actualizar GBP/Schema)
  direccion: 'C.C. Manila, Transversal 12 #22-42, Local 126',
  ciudad: 'Fusagasugá',
  region: 'Cundinamarca',
  pais: 'Colombia',

  horario: 'Lun–Vie 9am–6pm · Sáb 9am–1pm',

  reseñas: 126,
} as const

export const WHATSAPP = {
  principal: '573204891930',
  alterno: '573005693381',
  telefonoDisplay: '+57 320 489 1930',
  link: 'https://walink.co/e4211f',
} as const

/** URL de WhatsApp con mensaje pre-cargado por destino. */
export function whatsappUrl(destino?: string): string {
  const texto = destino
    ? `Hola! Me interesa información sobre viajes a ${destino} 🌎`
    : 'Hola! Me interesa información sobre sus planes de viaje 🌎'
  return `https://wa.me/${WHATSAPP.principal}?text=${encodeURIComponent(texto)}`
}

export const SOCIALS = {
  facebook: 'https://www.facebook.com/travelworldcolombia',
  instagram: 'https://www.instagram.com/travelworldcolombiaoficial',
  youtube: 'https://www.youtube.com/channel/UCKqasbJnPkIhquMuC3o4_ew',
  tiktok: 'https://www.tiktok.com/@travelworldcolombia',
  maps: 'https://maps.app.goo.gl/sSk1CrrgasCvVvEL8',
} as const

export const NAV_LINKS = [
  { href: '/', label: 'Inicio' },
  { href: '/destinos', label: 'Destinos' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/contacto', label: 'Contacto' },
] as const
