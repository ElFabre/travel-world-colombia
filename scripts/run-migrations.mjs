// Ejecuta las migraciones y el seed contra Supabase Postgres.
// Uso: node scripts/run-migrations.mjs
// Requiere env: SUPABASE_DB_URL (connection string del pooler con la contraseña).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const connectionString = process.env.SUPABASE_DB_URL
if (!connectionString) {
  console.error('❌ Falta SUPABASE_DB_URL en el entorno.')
  process.exit(1)
}

const files = [
  'supabase/migrations/001_schema.sql',
  'supabase/migrations/002_rls.sql',
  'supabase/seed.sql',
]

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('✓ Conectado a Postgres\n')

  for (const file of files) {
    const sql = readFileSync(join(root, file), 'utf8')
    process.stdout.write(`▶ Ejecutando ${file} ... `)
    await client.query(sql)
    console.log('OK')
  }

  // Verificación
  const { rows: d } = await client.query('select count(*)::int as n from destinos')
  const { rows: r } = await client.query('select count(*)::int as n from resenas')
  const { rows: t } = await client.query(
    "select tablename from pg_tables where schemaname='public' order by tablename"
  )
  console.log(`\n✓ destinos: ${d[0].n} filas`)
  console.log(`✓ resenas:  ${r[0].n} filas`)
  console.log(`✓ tablas:   ${t.map(x => x.tablename).join(', ')}`)
} catch (err) {
  console.error('\n❌ Error:', err.message)
  process.exitCode = 1
} finally {
  await client.end()
}
