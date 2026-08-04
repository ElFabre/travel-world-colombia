/**
 * Constantes de la subcuenta de GoHighLevel de Travel World Colombia.
 * Mapeadas y verificadas contra la API (ver `docs/ghl-twc-mapa.md`).
 */

export const GHL = {
  api: 'https://services.leadconnectorhq.com',
  version: '2021-07-28',
  locationId: 'RMFUo0i4KOVl7eZHEn7s',
} as const

/** Pipeline principal de ventas y las etapas que Sol puede tocar. */
export const PIPELINE = {
  id: 'G9XH0U9dIBl7Jvd7hyvE',
  etapas: {
    leadNuevo: '31100b3a-0c8c-4b44-a717-0642177bdd6b',
    calificadoPorBot: 'df98abba-b57c-45d5-8a8f-4c5ff82d1b45',
    asignadoAAgente: 'f049d236-3d2e-48ae-ae61-99653b33f131',
  },
  /**
   * A partir de aquí manda un humano: si la oportunidad ya está en cotización o
   * más allá, Sol no interviene aunque no tenga `stop_bot`.
   */
  etapasVedadas: [
    '581e66d0-f2e2-407a-b2ec-04d1ba644b59', // Contactado
    '17fc06db-e871-465d-bd13-beddf574f967', // Cotización en proceso
    'd351d803-3e7c-4ade-a689-d17722f1d046', // Cotización Enviada
    'c94ca94e-3768-4624-bfdd-e147350933ce', // En Seguimiento
    'fef0ff3d-cafc-40a3-8996-09ba897b2b51', // Negociación
    '4cbf272e-674a-4c0c-aebc-9f14fa2efbc4', // Documentacion
    'be026e44-bd85-40d9-99ec-db7b4f03e44b', // Cerrado Ganado
    '6f0678b9-4f06-43ee-9e45-e4f40699fe6d', // Ganado / Abonado
  ],
} as const

/** Pipeline de post-venta: territorio 100% humano. */
export const PIPELINE_POSTVENTA = 'X2FPIf6vQa6E5VSNE922'

/**
 * Campos de calificación que YA existen en la subcuenta (folder ⭐
 * `AmOICbYAU4SyDMfuDNCL`). Se reusan a propósito — los workflows y las
 * asesoras dependen de ellos — aunque tengan typos de origen (`fecha_de_vije`).
 */
export const CAMPOS_CALIFICACION = {
  destino: 'NXvGm4sqiOhcqu7frkz1', // contact.destino_principal (LARGE_TEXT)
  fechas: 'BZk9ykccXGa8Sm2BHgFh', // contact.fecha_de_vije (TEXT)
  ciudadSalida: 'HMOk7JJUomhEQ6TBlwzx', // contact.ciudad_de_salida (TEXT)
  adultos: 'qtGK9F59HWK2u7Mqsyp1', // contact.cantidad_de_adultos (NUMERICAL)
  ninos: '1WNgkrRxbGKKXEsZYs5n', // contact.cantidad_de_nios (NUMERICAL)
  edadesNinos: 'q9pQKxDIUG9CuIKiQSpR', // contact.edades_de_los_nios (TEXT)
  presupuesto: 'yd3GW4sXa8tiY8aCUpvq', // contact.presupuesto_estimado (MONETORY)
} as const

/**
 * Tags existentes en la cuenta que Sol respeta o usa. Se reusan a propósito
 * (no se inventan nuevos) para no romper los workflows que ya funcionan.
 */
export const TAGS = {
  /** Apaga el bot para ese contacto. Lo pone una asesora o el propio Sol. */
  stopBot: 'stop_bot',
  /** Escalada: dispara la notificación al equipo. */
  transferenciaHumano: 'transferencia a humano',
  /** No son clientes: Sol no interviene. */
  noCliente: ['proveedor', 'mayorista / operadores'],
} as const

/**
 * Momento a partir del cual Sol atiende conversaciones. Decisión del cliente:
 * SOLO conversaciones nuevas — nada de contestar mensajes viejos ni de
 * perseguir el histórico al encender.
 *
 * Se compara contra la fecha del mensaje entrante, no contra la del contacto:
 * un cliente antiguo que escribe hoy sí es una conversación viva.
 */
export const ACTIVO_DESDE = new Date(
  process.env.AGENTE_ACTIVO_DESDE ?? '2099-01-01T00:00:00Z'
)

/**
 * Modo prueba: mientras el bot actual sigue en producción, Sol solo conversa
 * con contactos que tengan este tag. Vaciar la variable (AGENTE_TAG_PRUEBAS="")
 * la abre a todos los contactos.
 */
export const TAG_PRUEBAS = process.env.AGENTE_TAG_PRUEBAS ?? 'pruebas_fabrizio'

/**
 * Ventana para agrupar ráfagas de mensajes, en milisegundos.
 *
 * En WhatsApp la gente escribe en pedazos ("hola" … "quiero ir a Perú"), y
 * responder a cada pedazo es a la vez caro y peor: el primer mensaje se
 * contesta sin saber lo que viene. Sol espera este tiempo y, si llega otro
 * mensaje, cede el turno al más reciente (ventana DESLIZANTE: el reloj se
 * reinicia con cada mensaje nuevo).
 *
 * 10 s por decisión del usuario. Medido sobre 698 mensajes reales de la
 * cuenta: la pausa mediana entre mensajes seguidos es de 10,9 s, así que esta
 * ventana atrapa cerca de la mitad de las ráfagas de forma directa y bastantes
 * más al deslizarse. Poner 0 desactiva el agrupamiento.
 */
export const RAFAGA_MS = Number(process.env.AGENTE_RAFAGA_MS ?? 10_000)

/** Horario de atención de la agencia (America/Bogota), para fijar expectativas. */
export const HORARIO = {
  zona: 'America/Bogota',
  semana: { desde: 9, hasta: 17 }, // L-V 9:00-17:00
  sabado: { desde: 9, hasta: 13 }, // Sáb 9:00-13:00
  domingoCerrado: true,
} as const
