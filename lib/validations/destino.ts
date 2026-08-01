import { z } from 'zod'

/** Validación de los campos escalares del formulario de destino. */
export const destinoSchema = z.object({
  nombre: z.string().min(2, 'El nombre es obligatorio.'),
  slug: z
    .string()
    .min(2, 'El slug es obligatorio.')
    .regex(/^[a-z0-9-]+$/, 'Slug: solo minúsculas, números y guiones (ej. punta-cana).'),
  pais: z.string().min(2, 'El país es obligatorio.'),
  region: z.string().optional(),
  activo: z.boolean(),
  destacado: z.boolean(),
  orden: z.number().int().min(0),
  precio_desde: z.string().optional(),
  duracion: z.string().optional(),
  cupos_disponibles: z.number().int().min(0).optional(),

  frase_hero: z.string().optional(),
  autor_frase: z.string().optional(),
  cargo_autor: z.string().optional(),

  subtitulo: z.string().optional(),
  descripcion: z.string().optional(),

  incluye: z.array(z.string()).optional(),
  no_incluye: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),

  stats: z.array(z.object({ num: z.string(), label: z.string() })).optional(),
  highlights: z.array(z.object({ icono: z.string(), titulo: z.string(), descripcion: z.string(), imagen: z.string().optional(), precio: z.string().optional() })).optional(),
  info_clave: z.array(z.object({ icono: z.string(), label: z.string(), valor: z.string(), sub: z.string().optional() })).optional(),
  itinerario: z.array(z.object({ titulo: z.string(), badge: z.string().optional(), descripcion: z.string().optional(), fecha: z.string().optional(), imagen: z.string().optional() })).optional(),
  galeria: z.array(z.string()).optional(),

  cta_titulo: z.string().optional(),
  cta_subtitulo: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
})

export type DestinoInput = z.infer<typeof destinoSchema>
