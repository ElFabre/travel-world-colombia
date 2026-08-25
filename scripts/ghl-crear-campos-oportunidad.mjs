// Crea los campos personalizados de OPORTUNIDAD en la subcuenta de Travel World Colombia
// a partir de scripts/ghl-campos-oportunidad.catalog.json (diseño: docs/migracion-campos-oportunidad.md).
//
// Uso:
//   node scripts/ghl-crear-campos-oportunidad.mjs                  # dry-run: muestra qué crearía
//   node scripts/ghl-crear-campos-oportunidad.mjs --execute        # crea los campos que falten
//   node scripts/ghl-crear-campos-oportunidad.mjs --execute --carpetas=scripts/ghl-carpetas-oportunidad.json
//
// Idempotente: compara por nombre contra los campos de oportunidad existentes y solo crea los que faltan.
// Las carpetas NO se pueden crear por API: créalas a mano en la UI y pasa el mapeo
// { "Nombre de carpeta": "folderId" } con --carpetas para que los campos nazcan dentro.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const LOCATION_ID = 'RMFUo0i4KOVl7eZHEn7s'
const API = 'https://services.leadconnectorhq.com'

const env = readFileSync(resolve('.env.local'), 'utf8')
const pit = env.match(/^GHL_TWC_PIT=(.+)$/m)?.[1]?.trim()
if (!pit) throw new Error('No se encontró GHL_TWC_PIT en .env.local')

const execute = process.argv.includes('--execute')
const carpetasArg = process.argv.find(a => a.startsWith('--carpetas='))
const folderIds = carpetasArg
  ? JSON.parse(readFileSync(resolve(carpetasArg.split('=')[1]), 'utf8'))
  : {}

const catalog = JSON.parse(
  readFileSync(resolve('scripts/ghl-campos-oportunidad.catalog.json'), 'utf8'),
)

const headers = {
  Authorization: `Bearer ${pit}`,
  Version: '2021-07-28',
  'Content-Type': 'application/json',
}

async function ghl(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(json).slice(0, 300)}`)
  return json
}

const existing = await ghl('GET', `/locations/${LOCATION_ID}/customFields?model=opportunity`)
const existingNames = new Set((existing.customFields ?? []).map(f => f.name))
console.log(`Campos de oportunidad existentes: ${existingNames.size}`)

const pending = catalog.filter(f => !existingNames.has(f.name))
console.log(`Catálogo: ${catalog.length} · ya existen: ${catalog.length - pending.length} · por crear: ${pending.length}\n`)

if (!execute) {
  for (const f of pending) {
    const folder = folderIds[f.folder] ? `→ carpeta ${f.folder}` : `(sin carpeta: ${f.folder})`
    console.log(`  [dry-run] ${f.name} (${f.dataType}) ${folder}`)
  }
  console.log('\nDry-run: nada creado. Ejecuta con --execute para crear.')
} else {
  let ok = 0
  const errores = []
  for (const f of pending) {
    const body = {
      name: f.name,
      dataType: f.dataType,
      model: 'opportunity',
      placeholder: '',
    }
    if (f.options) body.options = f.options
    if (folderIds[f.folder]) body.parentId = folderIds[f.folder]
    try {
      await ghl('POST', `/locations/${LOCATION_ID}/customFields`, body)
      ok++
      console.log(`  ✓ ${f.name}`)
    } catch (e) {
      errores.push({ name: f.name, error: String(e.message) })
      console.error(`  ✗ ${f.name}: ${e.message}`)
    }
    await new Promise(r => setTimeout(r, 200)) // respeta el rate limit de GHL
  }

  console.log(`\nCreados: ${ok}/${pending.length}`)
  if (errores.length) {
    console.log('Errores (revisar y re-ejecutar; el script es idempotente):')
    for (const e of errores) console.log(` - ${e.name}: ${e.error}`)
    process.exitCode = 1
  }
}
