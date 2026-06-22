/**
 * migrate-destinos-storage.mjs
 * Sube las imágenes locales optimizadas de destinos (hero/thumb) a
 * Supabase Storage (bucket "destinos") y actualiza imagen_hero/imagen_thumb
 * en la tabla `destinos`. Idempotente (upsert).
 *
 * Uso: node scripts/migrate-destinos-storage.mjs
 */
import { readFileSync, existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

// Cargar .env.local sin dependencias
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'destinos'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

async function main() {
  const { data: destinos, error } = await supabase.from('destinos').select('id, slug, nombre')
  if (error) { console.error('❌', error.message); process.exit(1) }

  console.log(`\n🚀 Migrando ${destinos.length} destinos a Storage...\n`)

  for (const d of destinos) {
    for (const campo of ['hero', 'thumb']) {
      const local = `public/img/${d.slug}/${campo}.webp`
      if (!existsSync(local)) { console.log(`  ⚠️  ${d.slug}: falta ${local}`); continue }
      const buf = readFileSync(local)
      const path = `${d.slug}/${campo}.webp`
      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(path, buf, { upsert: true, contentType: 'image/webp' })
      if (upErr) { console.log(`  ❌ ${path}: ${upErr.message}`); continue }
    }
    const heroUrl = supabase.storage.from(BUCKET).getPublicUrl(`${d.slug}/hero.webp`).data.publicUrl
    const thumbUrl = supabase.storage.from(BUCKET).getPublicUrl(`${d.slug}/thumb.webp`).data.publicUrl
    const { error: updErr } = await supabase
      .from('destinos')
      .update({ imagen_hero: heroUrl, imagen_thumb: thumbUrl })
      .eq('id', d.id)
    if (updErr) console.log(`  ❌ update ${d.slug}: ${updErr.message}`)
    else console.log(`  ✓ ${d.slug.padEnd(22)} → hero + thumb en Storage`)
  }
  console.log('\n✅ Migración completa.\n')
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
