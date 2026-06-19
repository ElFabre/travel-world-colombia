// Equipo de Travel World Colombia.
// Nombres y roles: REALES (entregados por el cliente).
// ⚠️ Descripciones y tags: provisionales/genéricos basados en el rol — reemplazar con bios reales.
// Fotos: pendientes. Van en public/img/equipo/<slug>.webp (optimizar con scripts/optimize-equipo.mjs).
// Si `foto` es undefined → avatar con iniciales sobre degradado.

import type { LucideIcon } from 'lucide-react'
import {
  Crown,
  Calculator,
  Sparkles,
  ConciergeBell,
  ClipboardList,
  Headset,
  Package,
  Camera,
  AtSign,
} from 'lucide-react'

export interface Miembro {
  nombre: string
  rol: string
  descripcion: string
  tags: string[]
  /** Ícono de badge (esquina del avatar) según rol. */
  badge: LucideIcon
  /** Degradado del avatar de iniciales (fallback sin foto). */
  gradiente: string
  /** Ruta de foto real optimizada, o undefined para usar iniciales. */
  foto?: string
}

const G = {
  orange: 'linear-gradient(135deg, var(--orange), var(--gold))',
  gold:   'linear-gradient(135deg, var(--gold), var(--orange))',
  blue:   'linear-gradient(135deg, var(--blue), var(--orange))',
  mix:    'linear-gradient(135deg, var(--orange), var(--blue))',
}

export const EQUIPO: Miembro[] = [
  {
    nombre: 'Ginna Cárdenas',
    rol: 'CEO',
    descripcion: 'Lidera Travel World Colombia con la visión de hacer realidad el sueño de viajar de cada cliente.',
    tags: ['Fusagasugá', 'Dirección'],
    badge: Crown,
    gradiente: G.orange,
    foto: '/img/equipo/ginna-cardenas.webp',
  },
  {
    nombre: 'Milena Cárdenas',
    rol: 'Gerente Financiera',
    descripcion: 'Cuida que cada plan se ajuste a tu presupuesto con total transparencia y respaldo.',
    tags: ['Finanzas', 'Respaldo'],
    badge: Calculator,
    gradiente: G.gold,
    foto: '/img/equipo/milena-cardenas.webp',
  },
  {
    nombre: 'Sofía Solórzano',
    rol: 'Gerente de Marca',
    descripcion: 'Construye la identidad de Travel World Colombia y cuida cada punto de contacto con el viajero.',
    tags: ['Marca', 'Experiencia'],
    badge: Sparkles,
    gradiente: G.mix,
    foto: '/img/equipo/sofia-solorzano.webp',
  },
  {
    nombre: 'Lynda Quintero',
    rol: 'Jefe de Servicios',
    descripcion: 'Vela por que cada experiencia cumpla los más altos estándares de servicio, de principio a fin.',
    tags: ['Servicio', 'Calidad'],
    badge: ConciergeBell,
    gradiente: G.blue,
    foto: '/img/equipo/lynda-quintero.webp',
  },
  {
    nombre: 'Luisa Aguirre',
    rol: 'Agente de Operaciones',
    descripcion: 'Coordina cada detalle logístico de tu viaje: tiquetes, hoteles, traslados y actividades.',
    tags: ['Operaciones', 'Logística'],
    badge: ClipboardList,
    gradiente: G.orange,
    foto: '/img/equipo/luisa-aguirre.webp',
  },
  {
    nombre: 'Alejandra Escobar',
    rol: 'Agente Comercial',
    descripcion: 'Te asesora para diseñar el viaje ideal según tu destino, fechas y presupuesto.',
    tags: ['Asesoría', 'Ventas'],
    badge: Headset,
    gradiente: G.blue,
    foto: '/img/equipo/alejandra-escobar.webp',
  },
  {
    nombre: 'Pilar Copete',
    rol: 'Agente Comercial',
    descripcion: 'Acompaña a cada cliente en la elección de su destino y arma la propuesta perfecta.',
    tags: ['Asesoría', 'Ventas'],
    badge: Headset,
    gradiente: G.gold,
    foto: '/img/equipo/pilar-copete.webp',
  },
  {
    nombre: 'Yohana Lozano',
    rol: 'Agente Comercial',
    descripcion: 'Resuelve tus dudas y te guía paso a paso hasta confirmar tu próximo viaje.',
    tags: ['Asesoría', 'Ventas'],
    badge: Headset,
    gradiente: G.mix,
    foto: '/img/equipo/yohana-lozano.webp',
  },
  {
    nombre: 'Juan Camilo Gómez',
    rol: 'Agente Comercial',
    descripcion: 'Especialista en encontrar la mejor opción para cada viajero, con atención cercana.',
    tags: ['Asesoría', 'Ventas'],
    badge: Headset,
    gradiente: G.orange,
    foto: '/img/equipo/juan-camilo-gomez.webp',
  },
  {
    nombre: 'Juanita Cárdenas',
    rol: 'Agente Comercial y de Producto',
    descripcion: 'Diseña y asesora los paquetes que mejor se ajustan a lo que buscas.',
    tags: ['Producto', 'Asesoría'],
    badge: Package,
    gradiente: G.blue,
    foto: '/img/equipo/juanita-cardenas.webp',
  },
  {
    nombre: 'Mauricio Reyes',
    rol: 'Creador de Contenido',
    descripcion: 'Captura y comparte las historias y destinos que inspiran tu próximo viaje.',
    tags: ['Contenido', 'Audiovisual'],
    badge: Camera,
    gradiente: G.gold,
    foto: '/img/equipo/mauricio-reyes-v2.webp',
  },
  {
    nombre: 'David Talero',
    rol: 'Community Manager',
    descripcion: 'Conecta con nuestra comunidad de viajeros en redes y responde tus inquietudes.',
    tags: ['Redes', 'Comunidad'],
    badge: AtSign,
    gradiente: G.mix,
    foto: '/img/equipo/david-talero.webp',
  },
]

/** Iniciales (máx 2) para el avatar placeholder. */
export function inicialesDe(nombre: string): string {
  return nombre.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('')
}
