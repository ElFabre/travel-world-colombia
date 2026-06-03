/**
 * optimize-logos.mjs
 * Optimiza los logos de aliados (PNG con transparencia) → WebP.
 * Preserva el canal alfa, NO recorta (fit: contain) y normaliza la altura.
 * Renombra a kebab-case SEO-friendly.
 *
 * Estructura esperada:
 *   raw-images/alianzas/hoteles-cruceros/*.png
 *   raw-images/alianzas/aerolineas/*.png
 *
 * Salida:
 *   public/img/alianzas/<kebab-case>.webp
 *
 * Uso:
 *   node scripts/optimize-logos.mjs
 */

import sharp from 'sharp'
import { readdir, mkdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const ROOT    = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const RAW_DIR = join(ROOT, 'raw-images', 'alianzas')
const OUT_DIR = join(ROOT, 'public', 'img', 'alianzas')

const GROUPS  = ['hoteles-cruceros', 'aerolineas']
const SUPPORTED = ['.png', '.svg', '.jpg', '.jpeg', '.webp']

// Altura objetivo del logo (el ancho se ajusta proporcionalmente)
const TARGET_HEIGHT = 128   // 2x para retina; en pantalla se muestra a 48–56px
const QUALITY       = 90

/** Convierte un nombre de archivo a kebab-case SEO. */
function toKebab(name) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function kb(bytes) { return (bytes / 1024).toFixed(0) + ' KB' }

async function processGroup(group) {
  const inDir = join(RAW_DIR, group)
  if (!existsSync(inDir)) {
    console.log(`⚠️  No existe raw-images/alianzas/${group}`)
    return []
  }

  const files = (await readdir(inDir))
    .filter(f => SUPPORTED.includes(extname(f).toLowerCase()))
    .sort()

  if (files.length === 0) {
    console.log(`📂 ${group}/ — vacía`)
    return []
  }

  console.log(`\n📁 ${group} (${files.length} logo${files.length > 1 ? 's' : ''})`)
  const results = []

  for (const file of files) {
    const slug       = toKebab(basename(file, extname(file)))
    const outputName = `${slug}.webp`
    const outputPath = join(OUT_DIR, outputName)

    const info = await sharp(join(inDir, file))
      .trim()  // recorta el borde transparente sobrante → tamaño uniforme
      .resize({ height: TARGET_HEIGHT, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: QUALITY, alphaQuality: 100 })
      .toFile(outputPath)

    console.log(`  ✓ ${outputName.padEnd(34)} ${info.width}×${info.height} — ${kb(info.size)}`)
    results.push({ group, slug, file: `/img/alianzas/${outputName}` })
  }

  return results
}

async function main() {
  if (!existsSync(RAW_DIR)) {
    console.error('❌ No existe raw-images/alianzas/')
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })

  console.log('\n🚀 Travel World Colombia — Logo Optimizer (alianzas)')

  const all = []
  for (const g of GROUPS) {
    all.push(...await processGroup(g))
  }

  if (all.length === 0) {
    console.log('\n📭 No hay logos para procesar todavía.')
    console.log('   Sube los PNG a raw-images/alianzas/hoteles-cruceros/ y /aerolineas/')
    return
  }

  console.log(`\n✅ ${all.length} logos optimizados en public/img/alianzas/\n`)
  console.log('   Rutas para pegar en lib/alianzas.ts (campo logo):')
  for (const r of all) {
    console.log(`   [${r.group}] ${r.slug.padEnd(28)} → logo: '${r.file}'`)
  }
  console.log('')
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
