/**
 * fetch-unsplash.mjs
 * Descarga fotos de Unsplash para cada destino y las procesa automáticamente.
 *
 * Uso:
 *   node scripts/fetch-unsplash.mjs                       → todos los destinos
 *   node scripts/fetch-unsplash.mjs republica-dominicana  → solo ese destino
 *
 * Requiere: UNSPLASH_ACCESS_KEY en .env.local
 */

import sharp from 'sharp'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, readFileSync } from 'fs'
import https from 'https'

// ─── Cargar .env.local ────────────────────────────────────────────────────────
const ROOT    = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const envPath = join(ROOT, '.env.local')

if (!existsSync(envPath)) {
  console.error('❌ No se encontró .env.local')
  process.exit(1)
}

const envVars = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const [k, ...v] = l.split('='); return [k.trim(), v.join('=').trim()] })
)

const ACCESS_KEY = envVars['UNSPLASH_ACCESS_KEY']
if (!ACCESS_KEY) {
  console.error('❌ Falta UNSPLASH_ACCESS_KEY en .env.local')
  console.error('   Agrégala así: UNSPLASH_ACCESS_KEY=tu_access_key')
  process.exit(1)
}

// ─── Queries por destino ──────────────────────────────────────────────────────
const DESTINOS = {
  'republica-dominicana': {
    nombre:  'República Dominicana',
    queries: {
      hero:    'Punta Cana Dominican Republic beach turquoise water',
      galeria: [
        'Punta Cana resort pool',
        'Dominican Republic jungle waterfall',
        'Samaná beach Dominican Republic',
        'Bavaro beach sunset',
      ],
    },
  },
  'estados-unidos': {
    nombre: 'Estados Unidos',
    queries: {
      hero:    'New York City skyline Manhattan aerial',
      galeria: [
        'Miami South Beach Florida',
        'Grand Canyon Arizona sunset',
        'Times Square New York night',
        'Las Vegas Nevada night lights',
      ],
    },
  },
  'espana': {
    nombre: 'España',
    queries: {
      hero:    'Barcelona Spain Sagrada Familia architecture',
      galeria: [
        'Madrid Spain Royal Palace',
        'Seville Spain flamenco architecture',
        'Ibiza Spain beach sunset',
        'Granada Alhambra palace Spain',
      ],
    },
  },
  'panama': {
    nombre: 'Panamá',
    queries: {
      hero:    'Panama City skyline waterfront',
      galeria: [
        'Panama Canal ships',
        'Bocas del Toro Panama beach',
        'Panama City Casco Viejo historic',
        'San Blas Islands Panama turquoise',
      ],
    },
  },
  'brasil': {
    nombre: 'Brasil',
    queries: {
      hero:    'Rio de Janeiro Brazil beach',
      galeria: [
        'Christ the Redeemer Rio de Janeiro',
        'Amazon rainforest Brazil',
        'Iguazu Falls Brazil Argentina',
        'Salvador Bahia Brazil colorful',
      ],
    },
  },
  'japon': {
    nombre: 'Japón',
    queries: {
      hero:    'Tokyo Japan city night neon lights',
      galeria: [
        'Kyoto Japan cherry blossom temple',
        'Mount Fuji Japan sunrise',
        'Japan bamboo forest Arashiyama',
        'Osaka Japan Dotonbori street food',
      ],
    },
  },
  'paris': {
    nombre: 'París',
    queries: {
      hero:    'Eiffel Tower Paris France golden sunset',
      galeria: [
        'Paris France Louvre Museum',
        'Champs Elysees Paris night',
        'Montmartre Paris France',
        'Seine River Paris bridge',
      ],
    },
  },
  'santorini': {
    nombre: 'Santorini',
    queries: {
      hero:    'Santorini Greece Oia blue dome sunset',
      galeria: [
        'Santorini white buildings sea view',
        'Santorini Greece caldera',
        'Mykonos Greece windmills',
        'Greek islands Aegean Sea',
      ],
    },
  },
}

// ─── Configuración de tamaños ──────────────────────────────────────────────────
const SIZES = {
  hero:  { w: 1920, h: 1080, q: 82, desc: '1920×1080' },
  thumb: { w: 600,  h: 600,  q: 78, desc: '600×600' },
  about: { w: 1200, h: 900,  q: 80, desc: '1200×900' },
  gal:   { w: 1200, h: 800,  q: 80, desc: '1200×800' },
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const opts = { headers: { 'Authorization': `Client-ID ${ACCESS_KEY}`, 'Accept-Version': 'v1' } }
    https.get(url, opts, res => {
      if (res.statusCode === 403) { reject(new Error('API key inválida o límite alcanzado')); return }
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch { reject(new Error('JSON inválido')) } })
    }).on('error', reject)
  })
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const follow = (u, redirects = 0) => {
      if (redirects > 5) { reject(new Error('Demasiados redirects')); return }
      https.get(u, res => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          follow(res.headers.location, redirects + 1)
          return
        }
        const chunks = []
        res.on('data', c => chunks.push(c))
        res.on('end', () => resolve(Buffer.concat(chunks)))
        res.on('error', reject)
      }).on('error', reject)
    }
    follow(url)
  })
}

// ─── Buscar foto en Unsplash ──────────────────────────────────────────────────

async function searchPhoto(query, orientation = 'landscape') {
  const q   = encodeURIComponent(query)
  const url = `https://api.unsplash.com/search/photos?query=${q}&per_page=3&orientation=${orientation}&content_filter=high`
  const res = await fetchJSON(url)
  if (!res.results?.length) throw new Error(`Sin resultados para: "${query}"`)
  return res.results[0] // mejor resultado
}

// ─── Procesar imagen ──────────────────────────────────────────────────────────

async function processImage(buffer, cfg, outputPath) {
  await sharp(buffer)
    .resize(cfg.w, cfg.h, { fit: 'cover', position: 'attention' })
    .webp({ quality: cfg.q })
    .toFile(outputPath)
}

// ─── Procesar destino ─────────────────────────────────────────────────────────

async function processDestino(slug) {
  const config = DESTINOS[slug]
  if (!config) {
    console.log(`⚠️  Destino desconocido: ${slug}`)
    return
  }

  const outDir = join(ROOT, 'optimized-images', slug)
  await mkdir(outDir, { recursive: true })

  console.log(`\n🌎 ${config.nombre}`)

  // ── Hero → genera hero.webp, thumb.webp y about.webp ──
  try {
    process.stdout.write(`   Buscando hero...`)
    const photo  = await searchPhoto(config.queries.hero)
    const rawUrl = `${photo.urls.raw}&w=1920&q=90&fm=jpg&fit=crop`
    process.stdout.write(` descargando...`)
    const buf    = await downloadBuffer(rawUrl)

    await processImage(buf, SIZES.hero,  join(outDir, 'hero.webp'))
    await processImage(buf, SIZES.thumb, join(outDir, 'thumb.webp'))
    await processImage(buf, SIZES.about, join(outDir, 'about.webp'))
    console.log(` ✓ hero.webp · thumb.webp · about.webp`)
    console.log(`   📸 Foto: ${photo.user.name} — ${photo.links.html}`)
  } catch (err) {
    console.log(` ❌ ${err.message}`)
  }

  // ── Galería ──
  for (let i = 0; i < config.queries.galeria.length; i++) {
    const query  = config.queries.galeria[i]
    const outName = `galeria-${i + 1}.webp`
    try {
      process.stdout.write(`   Galería ${i + 1}/4 "${query.slice(0, 35)}..."`)
      const photo  = await searchPhoto(query)
      const rawUrl = `${photo.urls.raw}&w=1200&q=85&fm=jpg&fit=crop`
      const buf    = await downloadBuffer(rawUrl)
      await processImage(buf, SIZES.gal, join(outDir, outName))
      console.log(` ✓ ${outName}`)
    } catch (err) {
      console.log(` ❌ ${err.message}`)
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const arg   = process.argv[2]
  const slugs = arg ? [arg] : Object.keys(DESTINOS)

  console.log(`\n🚀 Travel World Colombia — Unsplash Image Fetcher`)
  console.log(`   ${slugs.length} destino${slugs.length > 1 ? 's' : ''} · API: Unsplash`)

  let ok = 0
  for (const slug of slugs) {
    await processDestino(slug)
    ok++
    // Pausa entre destinos para no exceder el rate limit (50 req/hora en free)
    if (ok < slugs.length) {
      await new Promise(r => setTimeout(r, 1200))
    }
  }

  console.log(`\n✅ Imágenes en optimized-images/`)
  console.log(`   Siguiente paso: subir a Supabase Storage y actualizar las URLs.\n`)
  console.log(`   ⚠️  Unsplash requiere attribution en producción.`)
  console.log(`   Agrega "Foto: [nombre] / Unsplash" en el footer o en cada imagen.\n`)
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
