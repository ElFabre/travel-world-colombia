# Supabase — Travel World Colombia

Configuración de base de datos. Ejecutar **en orden** desde el **SQL Editor** del dashboard de Supabase.

## Datos del proyecto (al crearlo)
- **Nombre:** `travel-world-colombia`
- **Región:** South America (São Paulo) — la más cercana a Colombia
- **Zona horaria:** `America/Bogota` → Settings → General → Timezone

## Orden de ejecución

| # | Archivo | Qué hace |
|---|---------|----------|
| 1 | `migrations/001_schema.sql` | Crea tablas `destinos`, `leads`, `resenas`, `security_logs` + índices + trigger `updated_at` |
| 2 | `migrations/002_rls.sql` | Habilita RLS y crea políticas (lectura pública / escritura admin) |
| 3 | `seed.sql` | Inserta los 8 destinos iniciales + 5 reseñas reales verificadas |

## Credenciales → pegar en `.env.local`

Settings → API:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...          # Project API keys → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJ...              # Project API keys → service_role (NUNCA exponer al cliente)
```

> ⚠️ El `service_role_key` **jamás** debe llevar prefijo `NEXT_PUBLIC_` ni commitearse.

## Storage (manual, en el dashboard)
1. Storage → New bucket → nombre `destinos` → **Public** (lectura pública).
2. Policies → subida (`insert`/`update`/`delete`) solo para rol `authenticated`.
3. Estructura de carpetas SEO-friendly: ver sección SEO del `CLAUDE.md`.

## Notas
- Las imágenes del seed son de Unsplash (temporales). Reemplazar por imágenes propias en Supabase Storage con nombres SEO-friendly.
- Tras ejecutar, verificar en Table Editor que hay 8 filas en `destinos` y 5 en `resenas`.
