export interface Stat {
  num: string
  label: string
}

export interface Highlight {
  icono: string
  titulo: string
  descripcion: string
  imagen?: string
  /** Valor de la actividad cuando es opcional (texto libre, ej. "$180.000"). */
  precio?: string
  /** Duración de la actividad (texto libre, ej. "4 horas" o "Día completo"). */
  duracion?: string
}

export interface InfoClave {
  icono: string
  label: string
  valor: string
  sub?: string
}

/** Un día del itinerario. El número de día sale de la posición en el array. */
export interface ItinerarioDia {
  titulo: string
  /** Etiqueta corta opcional, ej. "Cena incluida". */
  badge?: string
  descripcion?: string
  /** Fecha opcional para salidas fijas, ej. "11 NOV". */
  fecha?: string
  /** Foto del día (subida desde el panel a Storage). */
  imagen?: string
}

/** Documento descargable del viaje (subido desde el panel al bucket `documentos`). */
export interface ArchivoAdjunto {
  /** Nombre visible en la web, ej. "Itinerario detallado". */
  titulo: string
  url: string
  /** 'pdf' se puede ver en el navegador; 'word' solo se descarga. */
  tipo: 'pdf' | 'word'
  /** Peso del archivo, para mostrar "2.3 MB" junto al enlace. */
  bytes?: number
}

export interface Destino {
  id: string
  slug: string
  activo: boolean
  destacado: boolean
  orden: number

  nombre: string
  nombre_local?: string
  pais: string
  region?: string
  /** Solo para nacionales (Colombia): agrupa en "En bus" / "En avión". */
  transporte?: 'bus' | 'avion'
  /** Flag de "Salidas confirmadas fin de año" (chip de filtro en /destinos). */
  salida_fin_ano?: boolean
  /** Es un crucero: se lista en /cruceros y se excluye de /destinos. */
  es_crucero?: boolean
  frase_hero?: string
  autor_frase?: string
  cargo_autor?: string
  imagen_hero?: string
  imagen_thumb?: string

  subtitulo?: string
  descripcion?: string
  imagen_about?: string
  stats?: Stat[]
  highlights?: Highlight[]
  galeria?: string[]
  info_clave?: InfoClave[]
  itinerario?: ItinerarioDia[]
  archivos?: ArchivoAdjunto[]

  /** LEGADO: texto libre; derivado del estructurado al guardar desde el panel. */
  precio_desde?: string
  precio_valor?: number | null
  precio_moneda?: 'COP' | 'USD' | null
  precio_nota?: string | null
  incluye?: string[]
  no_incluye?: string[]
  duracion?: string
  cupos_disponibles?: number

  cta_titulo?: string
  cta_subtitulo?: string
  meta_title?: string
  meta_description?: string
  keywords?: string[]

  created_at: string
  updated_at: string
}
