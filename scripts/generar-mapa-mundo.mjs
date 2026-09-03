// Genera components/destinos/mapa-mundo.ts a partir de Natural Earth 110m
// (dominio público). Emite una silueta POR PAÍS para los países del catálogo
// del sitio (lib/paises.ts, casados vía NAME_ES) y agrupa el resto en un path
// decorativo por región. Proyección: geoNaturalEarth1.
//
// Uso: node scripts/generar-mapa-mundo.mjs [ruta/a/mundo.geojson]
//   mundo.geojson = ne_110m_admin_0_countries.geojson (Natural Earth master)
import { readFileSync, writeFileSync } from 'node:fs'
import { geoNaturalEarth1, geoPath } from 'd3-geo'

const RUTA_SALIDA = 'C:/Users/efabr/Travelworldcolombia/components/destinos/mapa-mundo.ts'
const geo = JSON.parse(readFileSync(process.argv[2] ?? 'mundo.geojson', 'utf-8'))

// Países del sitio (deben coincidir con lib/paises.ts). Los que NO existen a
// escala 110m (micro-islas) se representan con un punto proyectado a mano.
const PAISES_SITIO = [
  'Colombia', 'México', 'Costa Rica', 'Panamá', 'Guatemala', 'Perú', 'Ecuador',
  'Brasil', 'Argentina', 'Chile', 'Uruguay', 'Bolivia',
  'República Dominicana', 'Cuba', 'Aruba', 'Curazao', 'Jamaica', 'Bahamas',
  'Estados Unidos', 'Canadá',
  'España', 'Francia', 'Italia', 'Portugal', 'Reino Unido', 'Alemania',
  'Países Bajos', 'Suiza', 'Austria', 'Bélgica', 'Grecia', 'Croacia', 'Turquía',
  'Egipto', 'Marruecos', 'Sudáfrica', 'Emiratos Árabes Unidos',
  'Japón', 'China', 'Corea del Sur', 'Tailandia', 'Singapur', 'Indonesia',
  'Vietnam', 'India', 'Maldivas', 'Australia', 'Nueva Zelanda',
]

/** Micro-países sin polígono a 110m → [lon, lat] para un pin puntual. */
const PUNTOS_MICRO = {
  Aruba: [-69.97, 12.52],
  Curazao: [-68.99, 12.17],
  Singapur: [103.82, 1.35],
  Maldivas: [73.5, 3.2],
}

// País → región del sitio. Prioridad: overrides > SUBREGION > CONTINENT.
const OVERRIDES = {
  Mexico: 'Norteamérica', // en el sitio México se vende como Norteamérica
  Russia: 'Asia', // Natural Earth lo clasifica Europa; visualmente va mejor en Asia
}
const POR_SUBREGION = {
  'Northern America': 'Norteamérica',
  'Central America': 'Centroamérica',
  Caribbean: 'Caribe',
  'South America': 'Suramérica',
}
const POR_CONTINENTE = {
  Europe: 'Europa',
  Africa: 'África',
  Asia: 'Asia',
  Oceania: 'Oceanía',
}
/** Región de las micro-islas puntuales (no tienen feature de la que derivarla). */
const REGION_MICRO = { Aruba: 'Caribe', Curazao: 'Caribe', Singapur: 'Asia', Maldivas: 'Asia' }

function regionDe(f) {
  const p = f.properties
  if (p.CONTINENT === 'Antarctica' || p.SUBREGION === 'Seven seas (open ocean)') return null
  return OVERRIDES[p.ADMIN] ?? POR_SUBREGION[p.SUBREGION] ?? POR_CONTINENTE[p.CONTINENT] ?? null
}

/** Centroide burdo de un anillo (promedio de vértices). */
const lonMedio = anillo => anillo.reduce((s, pt) => s + pt[0], 0) / anillo.length

/** Francia (110m) incluye la Guayana Francesa: fuera los polígonos americanos. */
function limpiarFrancia(f) {
  if (f.properties.ADMIN !== 'France' || f.geometry.type !== 'MultiPolygon') return f
  const polys = f.geometry.coordinates.filter(poly => lonMedio(poly[0]) > -20)
  return { ...f, geometry: { type: 'MultiPolygon', coordinates: polys } }
}

const sitio = new Set(PAISES_SITIO)
const paisesFeatures = new Map() // nombre en español → feature
const fondoPorRegion = new Map() // región → features del resto de países
const todasFeatures = []
for (const f0 of geo.features) {
  const region = regionDe(f0)
  if (!region) continue
  const f = limpiarFrancia(f0)
  todasFeatures.push(f)
  const nombreEs = f.properties.NAME_ES
  if (nombreEs && sitio.has(nombreEs)) {
    paisesFeatures.set(nombreEs, { feature: f, region })
  } else {
    if (!fondoPorRegion.has(region)) fondoPorRegion.set(region, [])
    fondoPorRegion.get(region).push(f)
  }
}

const todas = { type: 'FeatureCollection', features: todasFeatures }
const proj = geoNaturalEarth1().fitSize([960, 500], todas)
const path = geoPath(proj)

const redondear = d => d.replace(/-?\d+\.\d+/g, n => Number(n).toFixed(1))

const paisPaths = {}
const paisXY = {}
const paisRegion = {}
for (const [nombre, { feature, region }] of paisesFeatures) {
  paisPaths[nombre] = redondear(path(feature))
  paisXY[nombre] = path.centroid(feature).map(v => Math.round(v))
  paisRegion[nombre] = region
}
// EEUU: el centroide lo arrastra Alaska; anclarlo al territorio continental.
paisXY['Estados Unidos'] = proj([-98.5, 39.8]).map(v => Math.round(v))
for (const [nombre, lonLat] of Object.entries(PUNTOS_MICRO)) {
  paisXY[nombre] = proj(lonLat).map(v => Math.round(v))
  paisRegion[nombre] = REGION_MICRO[nombre]
}

const fondoPaths = {}
for (const [region, features] of fondoPorRegion) {
  fondoPaths[region] = redondear(path({ type: 'FeatureCollection', features }))
}

const [w, h] = [960, Math.ceil(path.bounds(todas)[1][1]) + 4]
const colXY = path.centroid(paisesFeatures.get('Colombia').feature).map(v => Math.round(v))

const ts = `// GENERADO por scripts/generar-mapa-mundo.mjs — NO editar a mano.
// Fuente: Natural Earth 110m admin_0 (dominio público), proyección Natural Earth I.
// Siluetas por país (clave = nombre en español de lib/paises.ts) + fondo por región.

export const MAPA_VIEWBOX = '0 0 ${w} ${h}'

/** Silueta de cada país del catálogo. Micro-islas (Aruba, Curazao, Singapur, Maldivas) no tienen path: se pintan como punto en PAIS_XY. */
export const PAIS_PATHS: Record<string, string> = ${JSON.stringify(paisPaths, null, 0)}

/** Punto de anclaje (centroide o punto manual) de cada país del catálogo. */
export const PAIS_XY: Record<string, [number, number]> = ${JSON.stringify(paisXY)}

/** Región del sitio a la que pertenece cada país (México→Norteamérica, etc.). */
export const PAIS_REGION: Record<string, string> = ${JSON.stringify(paisRegion)}

/** Resto del mundo, agrupado por región: solo decorativo (tinte de zona). */
export const FONDO_REGIONES: Record<string, string> = ${JSON.stringify(fondoPaths, null, 0)}

export const COLOMBIA_XY: [number, number] = ${JSON.stringify(colXY)}
`
writeFileSync(RUTA_SALIDA, ts)
console.log('países con path:', Object.keys(paisPaths).length, '| micro-puntos:', Object.keys(PUNTOS_MICRO).length)
console.log('regiones de fondo:', [...fondoPorRegion.keys()].join(', '))
console.log('viewBox:', `0 0 ${w} ${h}`, '| colombia:', colXY.join(','), '| bytes:', ts.length)
