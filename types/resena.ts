export type ResenаFuente = 'google' | 'facebook' | 'manual'

export interface Resena {
  id: string
  nombre: string
  texto: string
  estrellas: number
  destino?: string
  fecha?: string
  activa: boolean
  orden: number
  fuente: ResenаFuente
}
