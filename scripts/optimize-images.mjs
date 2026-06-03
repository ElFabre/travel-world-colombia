/**
 * optimize-images.mjs
 * Procesa raw-images/<destino>/ y genera imágenes optimizadas en WebP
 * listas para subir a Supabase Storage.
 *
 * Uso:
 *   node scripts/optimize-images.mjs                  → procesa todos los destinos
 *   node scripts/optimize-images.mjs republica-dominicana  → solo ese destino
 */

import sharp from 'sharp'
import { readdir, mkdir, access } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const ROOT      = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const RAW_DIR   = join(ROOT, 'raw-images')
const OUT_DIR   = join(ROOT, 'optimized-images')

// ─── Configuración de salidas ────────────────────────────────────────────────
const OUTPUTS = {
  hero: {
    suffix:  'hero',
    width:   1920,
    height:  1080,
    fit:     'cover',
    quality: 82,
    desc:    '1920×1080 · fondo hero + OG image',
  },
  thumb: {
    suffix:  'thumb',
    width:   600,
    height:  600,
    fit:     'cover',
    quality: 78,
    desc:    '600×600 · thumbnail coverflow + cards',
  },
  about: {
    suffix:  'about',
    width:   1200,
    height:  900,
    fit:     'cover',
    quality: 80,
    desc:    '1200×900 · sección "sobre el destino"',
  },
  galeria: {
    suffix:  null,   // usa el nombre original del archivo
    width:   1200,
    height:  800,
    fit:     'cover',
    quality: 80,
    desc:    '1200×800 · galería de fotos',
  },
}

const SUPPORTED = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.tiff', '.avif']

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function exists(p) {
  try { await access(p); return true } catch { return false }
}

function kbOf(bytes) {
  return (bytes / 1024).toFixed(0) + ' KB'
}

async function processFile(inputPath, outputPath, cfg) {
  const { width, height, fit, quality } = cfg
  const result = await sharp(inputPath)
    .resize(width, height, { fit, position: 'attention' })
    .webp({ quality })
    .toFile(outputPath)
  return result.size
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function processDestino(slug) {
  const inDir  = join(RAW_DIR, slug)
  const outDir = join(OUT_DIR, slug)

  if (!(await exists(inDir))) {
    console.log(`⚠️  Carpeta no encontrada: raw-images/${slug}`)
    return
  }

  const files = (await readdir(inDir))
    .filter(f => SUPPORTED.includes(extname(f).toLowerCase()))
    .sort()

  if (files.length === 0) {
    console.log(`📂 raw-images/${slug}/ — vacía, sin cambios`)
    return
  }

  await mkdir(outDir, { recursive: true })

  console.log(`\n🌎 ${slug} (${files.length} archivo${files.length > 1 ? 's' : ''})`)

  for (const file of files) {
    const inputPath = join(inDir, file)
    const name      = basename(file, extname(file)).toLowerCase()

    // Detectar tipo por nombre de archivo
    // hero.jpg → genera hero
    // thumb.jpg → genera thumb
    // about.jpg → genera about
    // galeria-*.jpg / cualquier otro → genera galería optimizada

    const isHero  = name === 'hero'  || name.startsWith('hero-')
    const isThumb = name === 'thumb' || name.startsWith('thumb-')
    const isAbout = name === 'about' || name.startsWith('about-')
    const isGal   = !isHero && !isThumb && !isAbout

    const targets = []
    if (isHero)  targets.push({ key: 'hero',  cfg: OUTPUTS.hero  })
    if (isThumb) targets.push({ key: 'thumb', cfg: OUTPUTS.thumb })
    if (isAbout) targets.push({ key: 'about', cfg: OUTPUTS.about })
    if (isGal) {
      // Numerar las imágenes de galería secuencialmente
      const galFiles = files.filter(f => {
        const n = basename(f, extname(f)).toLowerCase()
        return !n.startsWith('hero') && !n.startsWith('thumb') && !n.startsWith('about')
      })
      const galIndex = galFiles.indexOf(file) + 1
      targets.push({
        key:     `galeria-${galIndex}`,
        cfg:     { ...OUTPUTS.galeria, suffix: `galeria-${galIndex}` },
        outName: `galeria-${galIndex}`,
      })
    }

    const hasThumb = files.some(f => { const n = basename(f, extname(f)).toLowerCase(); return n === 'thumb' || n.startsWith('thumb-') })
    const hasAbout = files.some(f => { const n = basename(f, extname(f)).toLowerCase(); return n === 'about' || n.startsWith('about-') })
    // Si es hero y no hay thumb/about separado, los genera también desde el hero
    if (isHero && !hasThumb) targets.push({ key: 'hero→thumb', cfg: OUTPUTS.thumb, outName: 'thumb' })
    if (isHero && !hasAbout) targets.push({ key: 'hero→about', cfg: OUTPUTS.about, outName: 'about' })

    for (const { key, cfg, outName } of targets) {
      const outputName = `${outName ?? cfg.suffix ?? name}.webp`
      const outputPath = join(outDir, outputName)
      const bytes      = await processFile(inputPath, outputPath, cfg)
      console.log(`  ✓ ${outputName.padEnd(22)} ${cfg.desc} — ${kbOf(bytes)}`)
    }
  }
}

async function main() {
  const arg = process.argv[2]

  if (!existsSync(RAW_DIR)) {
    console.error('❌ No existe la carpeta raw-images/')
    process.exit(1)
  }

  const slugs = arg
    ? [arg]
    : (await readdir(RAW_DIR, { withFileTypes: true }))
        .filter(e => e.isDirectory())
        .map(e => e.name)

  if (slugs.length === 0) {
    console.log('📂 No hay carpetas en raw-images/')
    return
  }

  console.log(`\n🚀 Travel World Colombia — Image Optimizer`)
  console.log(`   Procesando ${slugs.length} destino${slugs.length > 1 ? 's' : ''}...\n`)

  for (const slug of slugs) {
    await processDestino(slug)
  }

  console.log(`\n✅ Listo. Archivos en optimized-images/`)
  console.log(`   Sube cada carpeta a Supabase Storage y`)
  console.log(`   copia las URLs en la columna correspondiente de la tabla "destinos".\n`)
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
