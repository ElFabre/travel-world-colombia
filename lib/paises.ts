// Lista de países para el desplegable del panel (registro de tours) y los
// filtros de /destinos. Mantener nombres consistentes (en español) para que
// el filtro por país agrupe correctamente los tours.

/**
 * Regiones/continentes canónicos del sitio. Alimentan el desplegable del panel
 * y DEBEN coincidir con las zonas del mapa (components/destinos/mapa-mundo.ts)
 * para que el filtro, las tarjetas de categorías y el mapa casen entre sí.
 */
export const REGIONES: string[] = [
  'Norteamérica',
  'Centroamérica',
  'Caribe',
  'Suramérica',
  'Europa',
  'África',
  'Asia',
  'Oceanía',
]

export const PAISES: string[] = [
  // Colombia y Latinoamérica
  'Colombia',
  'México',
  'Costa Rica',
  'Panamá',
  'Guatemala',
  'Perú',
  'Ecuador',
  'Brasil',
  'Argentina',
  'Chile',
  'Uruguay',
  'Bolivia',
  // Caribe
  'República Dominicana',
  'Cuba',
  'Aruba',
  'Curazao',
  'Jamaica',
  'Bahamas',
  // Norteamérica
  'Estados Unidos',
  'Canadá',
  // Europa
  'España',
  'Francia',
  'Italia',
  'Portugal',
  'Reino Unido',
  'Alemania',
  'Países Bajos',
  'Suiza',
  'Austria',
  'Bélgica',
  'Grecia',
  'Croacia',
  'Turquía',
  // África y Medio Oriente
  'Egipto',
  'Marruecos',
  'Sudáfrica',
  'Emiratos Árabes Unidos',
  // Asia y Oceanía
  'Japón',
  'China',
  'Corea del Sur',
  'Tailandia',
  'Singapur',
  'Indonesia',
  'Vietnam',
  'India',
  'Maldivas',
  'Australia',
  'Nueva Zelanda',
]
