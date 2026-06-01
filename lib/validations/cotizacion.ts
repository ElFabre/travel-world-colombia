import { z } from 'zod'

export const cotizacionSchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'Solo se permiten letras y espacios')
    .transform(val => val.trim()),

  email: z
    .string()
    .email('Correo electrónico inválido')
    .max(254)
    .toLowerCase()
    .transform(val => val.trim()),

  telefono: z
    .string()
    .min(7, 'Teléfono inválido')
    .max(15, 'Teléfono inválido')
    .regex(/^[\d\s+\-()]+$/, 'Formato de teléfono inválido')
    .transform(val => val.replace(/\s/g, '')),

  destino_interes: z.string().max(100).optional(),

  num_personas: z.coerce.number().int().min(1).max(50).optional(),

  fecha_viaje: z.string().max(50).optional(),

  presupuesto: z
    .enum(['menos-500', '500-1000', '1000-2000', 'mas-2000', 'sin-definir'])
    .optional(),

  mensaje: z
    .string()
    .max(1000, 'Mensaje demasiado largo')
    .optional()
    .transform(val => val?.trim()),

  website: z.string().max(0, 'Bot detectado').optional(),
})

export type CotizacionInput = z.infer<typeof cotizacionSchema>
