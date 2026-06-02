import { z } from 'zod'

export const PRESUPUESTO_OPCIONES = [
  { value: 'menos-2m',  label: 'Menos de $2.000.000 COP' },
  { value: '2m-5m',     label: '$2.000.000 – $5.000.000 COP' },
  { value: '5m-10m',    label: '$5.000.000 – $10.000.000 COP' },
  { value: 'mas-10m',   label: 'Más de $10.000.000 COP' },
] as const

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
] as const

export const cotizacionSchema = z.object({
  nombre: z
    .string()
    .min(2, 'Mínimo 2 caracteres')
    .max(100, 'Nombre demasiado largo')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, 'Solo letras y espacios')
    .transform(val => val.trim()),

  whatsapp: z
    .string()
    .min(10, 'Ingresa los 10 dígitos de tu celular')
    .max(10, 'Solo 10 dígitos sin el prefijo +57')
    .regex(/^\d{10}$/, 'Debe ser un número de 10 dígitos'),

  destino_interes: z.string().min(1, 'Selecciona un destino').max(100),

  num_viajeros: z
    .number({ error: 'Número inválido' })
    .int()
    .min(1, 'Mínimo 1 viajero')
    .max(20, 'Máximo 20 viajeros'),

  fecha_mes: z.string().min(1, 'Selecciona un mes'),
  fecha_año: z.string().min(1, 'Selecciona un año'),

  presupuesto: z.enum(
    ['menos-2m', '2m-5m', '5m-10m', 'mas-10m'] as const,
    { error: 'Selecciona un rango de presupuesto' }
  ),

  mensaje: z.string().max(1000, 'Máximo 1000 caracteres').optional(),

  // Honeypot anti-bot
  website: z.string().max(0, 'Bot detectado').optional(),
})

export type CotizacionInput = z.infer<typeof cotizacionSchema>
