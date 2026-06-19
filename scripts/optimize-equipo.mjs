/**
 * optimize-equipo.mjs
 * Optimiza fotos del equipo → avatares cuadrados WebP (240px, recorte facial).
 *
 * Entrada:  raw-images/equipo/*.{png,jpg,jpeg,heic,webp}
 * Salida:   public/img/equipo/<kebab>.webp
 *
 * Luego conecta cada `foto: '/img/equipo/<slug>.webp'` en lib/equipo.ts
 *
 * Uso:  node scripts/optimize-equipo.mjs
 */

import sharp from 'sharp'
import { readdir, mkdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const ROOT    = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const RAW_DIR = join(ROOT, 'raw-images', 'equipo')
const OUT_DIR = join(ROOT, 'public', 'img', 'equipo')

const SUPPORTED = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.webp', '.tiff']
const SIZE      = 240   // 2x para mostrar a 110px (retina)
const QUALITY   = 84

const toKebab = n => n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
const kb = b => (b / 1024).toFixed(0) + ' KB'

async function main() {
  if (!existsSync(RAW_DIR)) { console.error('❌ No existe raw-images/equipo/'); process.exit(1) }
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(RAW_DIR)).filter(f => SUPPORTED.includes(extname(f).toLowerCase())).sort()
  if (files.length === 0) {
    console.log('📭 raw-images/equipo/ vacía — sube las fotos del equipo aquí.')
    return
  }

  console.log(`\n🚀 Travel World Colombia — Equipo (avatares ${SIZE}×${SIZE})\n`)
  for (const file of files) {
    const slug = toKebab(basename(file, extname(file)))
    const out  = join(OUT_DIR, `${slug}.webp`)
    const info = await sharp(join(RAW_DIR, file))
      .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: QUALITY })
      .toFile(out)
    console.log(`  ✓ ${(slug + '.webp').padEnd(22)} ${info.width}×${info.height} — ${kb(info.size)}   → foto: '/img/equipo/${slug}.webp'`)
  }
  console.log(`\n✅ Avatares en public/img/equipo/ — conecta las rutas en lib/equipo.ts\n`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
