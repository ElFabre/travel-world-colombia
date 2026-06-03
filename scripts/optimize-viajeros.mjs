/**
 * optimize-viajeros.mjs
 * Optimiza las fotos de viajeros → avatares circulares cuadrados WebP.
 * Recorta al rostro (fit: cover + estrategia "attention") y normaliza a 160×160.
 *
 * Entrada:  raw-images/viajeros/*.{png,jpg,jpeg,heic,webp}
 * Salida:   public/img/viajeros/<kebab>.webp
 *
 * Uso:  node scripts/optimize-viajeros.mjs
 */

import sharp from 'sharp'
import { readdir, mkdir } from 'fs/promises'
import { join, extname, basename } from 'path'
import { existsSync } from 'fs'

const ROOT    = new URL('..', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1')
const RAW_DIR = join(ROOT, 'raw-images', 'viajeros')
const OUT_DIR = join(ROOT, 'public', 'img', 'viajeros')

const SUPPORTED = ['.png', '.jpg', '.jpeg', '.heic', '.heif', '.webp', '.tiff']
const SIZE      = 160   // 2x para mostrar a 40px (retina)
const QUALITY   = 82

function toKebab(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
function kb(b) { return (b / 1024).toFixed(0) + ' KB' }

async function main() {
  if (!existsSync(RAW_DIR)) { console.error('❌ No existe raw-images/viajeros/'); process.exit(1) }
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(RAW_DIR))
    .filter(f => SUPPORTED.includes(extname(f).toLowerCase()))
    .sort()

  if (files.length === 0) { console.log('📭 Carpeta vacía'); return }

  console.log(`\n🚀 Travel World Colombia — Viajeros (avatares)\n   ${files.length} fotos → ${SIZE}×${SIZE} circular\n`)

  for (const file of files) {
    const slug = toKebab(basename(file, extname(file)))
    const out  = join(OUT_DIR, `${slug}.webp`)
    const info = await sharp(join(RAW_DIR, file))
      .resize(SIZE, SIZE, { fit: 'cover', position: sharp.strategy.attention })
      .webp({ quality: QUALITY })
      .toFile(out)
    console.log(`  ✓ ${(slug + '.webp').padEnd(22)} ${info.width}×${info.height} — ${kb(info.size)}`)
  }

  console.log(`\n✅ Avatares en public/img/viajeros/\n`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
