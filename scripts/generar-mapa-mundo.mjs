// Genera components/destinos/mapa-mundo.ts a partir de Natural Earth 110m
// (dominio público). Agrupa países en las 8 regiones del sitio y proyecta con
// geoNaturalEarth1 a paths SVG.
import { readFileSync, writeFileSync } from 'node:fs'
import { geoNaturalEarth1, geoPath } from 'd3-geo'

const RUTA_SALIDA = 'C:/Users/efabr/Travelworldcolombia/components/destinos/mapa-mundo.ts'
const geo = JSON.parse(readFileSync('mundo.geojson', 'utf-8'))

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

const porRegion = new Map()
let colombia = null
for (const f0 of geo.features) {
  const region = regionDe(f0)
  if (!region) continue
  const f = limpiarFrancia(f0)
  if (!porRegion.has(region)) porRegion.set(region, [])
  porRegion.get(region).push(f)
  if (f.properties.ADMIN === 'Colombia') colombia = f
}

const todas = { type: 'FeatureCollection', features: [...porRegion.values()].flat() }
const proj = geoNaturalEarth1().fitSize([960, 500], todas)
const path = geoPath(proj)

const redondear = d => d.replace(/-?\d+\.\d+/g, n => Number(n).toFixed(1))

const paths = {}
const centroides = {}
for (const [region, features] of porRegion) {
  const fc = { type: 'FeatureCollection', features }
  paths[region] = redondear(path(fc))
  centroides[region] = path.centroid(fc).map(v => Math.round(v))
}
const [w, h] = [960, Math.ceil(path.bounds(todas)[1][1]) + 4]
const colXY = path.centroid(colombia).map(v => Math.round(v))

const ts = `// GENERADO por scripts/generar-mapa-mundo.mjs — NO editar a mano.
// Fuente: Natural Earth 110m admin_0 (dominio público), proyección Natural Earth I.
// Países agrupados en las 8 regiones del sitio (México→Norteamérica, Rusia→Asia).

export const MAPA_VIEWBOX = '0 0 ${w} ${h}'

export const REGION_PATHS: Record<string, string> = ${JSON.stringify(paths, null, 0)}

export const REGION_CENTROIDES: Record<string, [number, number]> = ${JSON.stringify(centroides)}

export const COLOMBIA_XY: [number, number] = ${JSON.stringify(colXY)}
`
writeFileSync(RUTA_SALIDA, ts)
console.log('regiones:', [...porRegion.keys()].join(', '))
console.log('viewBox:', `0 0 ${w} ${h}`, '| colombia:', colXY.join(','), '| bytes:', ts.length)
