# Auditoría técnica — Travel World Colombia (2026-08-03)

Alcance: seguridad, arquitectura, higiene de código, eficiencia/lógica y base de
datos. Repo Next 16 (App Router, Turbopack) + Supabase + Vercel. ~7.600 líneas
TS/TSX, 176 archivos versionados.

Método: cuatro auditorías de código en paralelo + advisors de Supabase.
Los hallazgos marcados **[verificado]** los comprobé directamente en el código,
en la base de datos o ejecutando herramientas.

---

## 🔴 P0 — Crítico: el panel admin está abierto a internet

Tres eslabones que encadenan. **[verificado]** los tres.

1. **Registros públicos habilitados**: la API de Supabase reporta
   `disable_signup: false`, y `/admin/login` muestra el enlace "Crear cuenta".
2. **Auto-aprobación como editor** — `app/admin/actions.ts:74-79`: tras `signUp`
   se hace upsert en `admin_allowlist` con `rol: 'editor', aprobado_por: 'auto'`
   para cualquier correo. La pantalla "pendiente de aprobación" es decorativa.
   La propia UI lo admite (`app/admin/usuarios/page.tsx:47`).
3. **RLS confunde "autenticado" con "administrador"** —
   `supabase/migrations/002_rls.sql:17-52` (+ `007_faqs.sql`, `004_audit.sql`):
   las políticas de escritura usan `auth.role() = 'authenticated'`. Como la anon
   key es pública por diseño, cualquiera que se registre obtiene un JWT válido y
   escribe **directo contra PostgREST**, saltándose el panel, los guards de rol y
   el audit log.

**Impacto real hoy:** un desconocido crea cuenta, confirma correo y puede editar
u ocultar viajes/FAQ/reseñas del sitio público; vía API directa además puede
borrar destinos, **leer todos los leads (nombres y teléfonos de clientes)** y
leer la bitácora.

**Mitigación inmediata (1 clic):** Supabase Dashboard → Authentication → Sign Ups
→ desactivar registros. Corta el eslabón 1.

**Fix de fondo:**
- Quitar el upsert automático de `signUp` (la cuenta queda sin fila hasta que un
  admin la apruebe), o cerrar el registro público y crear usuarios desde el panel.
- Reescribir las políticas RLS para exigir pertenencia a la allowlist:
  `using (exists (select 1 from admin_allowlist a where lower(a.email) = lower(auth.jwt()->>'email')))`
- Quitar toda lectura de `leads` desde el cliente.

### P0.1 — Bucket `destinos`: escritura para cualquier autenticado + `upsert: true`
`supabase/migrations/003_storage.sql:7-9,20-30` y `lib/supabase/upload-cliente.ts:39-41`.
Encadenado con lo anterior: se pueden **sobrescribir las fotos** de los viajes
(defacement) y subir archivos con `contentType` elegido por el cliente
(SVG/HTML → JS ejecutable en el origen `*.supabase.co`).
Fix: políticas del bucket restringidas a la allowlist, quitar `upsert: true`,
lista blanca de tipos MIME.

### P0.2 — XSS almacenado en los bloques JSON-LD **[verificado]**
`app/layout.tsx:154`, `app/destinos/[slug]/page.tsx:128`,
`components/faq/FaqSection.tsx:30`, `components/seo/OrganizationReviews.tsx:43`.
Se inyecta contenido de la BD con `dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }}`.
`JSON.stringify` no escapa `</script>`: una FAQ con
`</script><script>…</script>` ejecuta JS en el dominio público.
Fix: helper compartido `jsonLd(x) = JSON.stringify(x).replace(/</g, '\\u003c')`.

---

## 🟠 P1 — Alto

| # | Hallazgo | Archivo | Fix |
|---|---|---|---|
| 1 | Un `editor` puede aprobar usuarios y degradar admins | `app/admin/usuarios/actions.ts:11,26-36` | `requireAdminRole()` en ambas + prohibir tocar admins |
| 2 | Sin rate limit en `signIn`/`signUp`; `signUp` escribe con service-role sin autenticar | `app/admin/actions.ts:15-35,42-79` | `checkRateLimit` por IP (5/min, 3/hora) |
| 3 | CSP débil: `script-src 'unsafe-inline'` y `connect-src *` | `next.config.ts:28-38` | Nonces; acotar `connect-src`; añadir `base-uri`, `object-src`, `form-action`, `frame-ancestors` |
| 4 | Rate limit cae a `Map` en memoria si faltan `UPSTASH_*` → inefectivo en serverless | `lib/security/rateLimit.ts:19-35` | Verificar Upstash en prod y alertar si falta |
| 5 | Acciones `void` que lanzan: el error muere silencioso o tumba la página | `app/admin/actions.ts:116,145` y toggles de reseñas/FAQ | Devolver `{error}` y mostrarlo inline |
| 6 | `crearResena`/`crearFaq` llaman el guard sin try/catch (sesión expirada = página rota) | `app/admin/{resenas,faqs}/actions.ts` | Copiar el patrón de destinos |
| 7 | Drift de tipos: `nombre_local` existe en BD y se renderiza, pero no está en zod ni en el form → **no editable desde el panel** | `types/destino.ts:42`, `components/hero/HeroContent.tsx:19-23` | Añadirlo al schema y al form (misma causa raíz del bug de fotos del itinerario) |

---

## ⚡ P1 — Rendimiento (hallazgos verificados)

### R1. Todas las páginas públicas son dinámicas: los `revalidate` no hacen nada **[verificado]**
`lib/supabase/server.ts:5` llama `await cookies()`, y usar `cookies()` en una
página fuerza **renderizado dinámico** (confirmado en la doc de Next incluida en
el repo). Por tanto `export const revalidate = 1800` en `app/page.tsx:17`,
`app/destinos/page.tsx`, `app/destinos/[slug]/page.tsx`, `/contacto`, `/nosotros`
y `sitemap.ts` son **decorativos**: cada visita ejecuta render completo + queries
a Supabase.

Consecuencias: todo el tráfico paga latencia de Supabase y consume invocaciones
de función; y si Supabase se cae **no hay copia cacheada que servir** — las
fichas de destino devuelven **404 real** (`getDestino` → `null` → `notFound()`),
malo para usuarios y para Google si coincide con un crawl.

**Fix (alto retorno):** para lecturas públicas usar un cliente **sin cookies**
(`createClient` de `@supabase/supabase-js` con anon key). Las páginas vuelven a
ser ISR, los `revalidatePath` del panel cobran sentido real y una caída de
Supabase sirve la última versión generada. Además, `getDestino` debería
distinguir error de "no existe" (lanzar → 500 reintentable, no 404 indexable).

### R2. El hero del home sirve imágenes de Storage SIN optimizar (LCP)
`components/hero/BackgroundSlider.tsx:17-34` usa `background-image: url(...)` con
la URL cruda de Storage: no pasa por `/_next/image`, así que el navegador baja el
archivo original (hasta 5 MB) sin AVIF/WebP ni resize. Peor: el auto-loop cada 4 s
(`HeroSection.tsx:40-52`) descarga **todos** los heroes, también en móvil.
Fix: `<Image fill priority sizes="100vw">` o preconstruir la URL de `/_next/image`.

### R3. Todo el set de iconos de lucide viaja al navegador **[verificado]**
`components/ui/Icono.tsx:1` hace `import { icons } from 'lucide-react'` (el mapa
completo) y lo consume `components/destinos/InfoClaveCarousel.tsx`, que es
`'use client'` **[verificado]**. Resultado: **cada ficha de destino embarca
cientos de KB de iconos**. Fix: `lucide-react/dynamic` o un mapa manual con los
~70 iconos de `SUGERIDOS` (los únicos que el CMS puede guardar).

### R4. `select('*')` con todos los jsonb serializados al cliente
`lib/destinos.ts:9` trae todo (itinerario, galería, highlights, keywords…) y lo
reciben componentes cliente en home, /destinos y /contacto — este último solo usa
`id, nombre, pais`. Fix: `getDestinosResumen()` con las ~15 columnas necesarias.

### R5. Queries duplicadas por request
`getDestino` se ejecuta 2× en la ficha (generateMetadata + page); el panel hace
3× `auth.getUser()` + 3× consulta de allowlist por navegación (proxy + layout +
page). Fix: `React.cache()` en `getDestino` y `getAdminSession` (1 línea cada uno).

### R6. Otros
- **Fallback de imagen roto**: `lib/hero.ts:15-32` cae a `/img/{slug}/hero.webp`,
  que solo existe para 9 slugs antiguos. Los destinos nuevos sin foto muestran
  **imagen rota** (coincide con los 9 de 18 destinos sin `imagen_hero`
  **[verificado]**). Fix: placeholder genérico.
- `app/robots.ts:10` bloquea `/_next/` → impide a Googlebot cargar imágenes y
  assets al renderizar. Quitarlo del disallow.
- Thumbnails del hero con `priority` (3 imágenes eager compitiendo con el LCP) y
  DOM duplicado desktop/móvil.
- `precioToOffer` (`app/destinos/[slug]/page.tsx:28`) concatena **todos** los
  dígitos del texto libre: "Desde $899 USD · 8 días" → `lowPrice: "8998"`. Ese
  precio inventado se publica en el JSON-LD que Google puede mostrar. Fix:
  extraer solo el primer grupo numérico.
- **Reseñas sin orden determinista**: `crearResena` no asigna `orden` (todas en 0)
  y la tabla no tiene `created_at`; el testimonio que sale en cada ficha puede
  cambiar entre renders. Fix: `max(orden)+1` como en FAQ + desempate por `id`.
- **Horas del panel en UTC**: los tres formatters de fecha no fijan `timeZone`;
  `TZ` solo está en `.env.local`. Si falta en Vercel, la bitácora miente 5 horas.
- Errores silenciados en `proxy.ts:46` y `lib/admin/allowlist.ts:47`: si la query
  de allowlist falla (RLS, timeout), un usuario legítimo es expulsado a
  "pendiente" **sin ninguna traza**.
- Al renombrar un slug no se revalida la ruta vieja (inocuo hoy por R1; relevante
  al activar ISR).

---

## 🟡 P2 — Medio (arquitectura y consistencia)

- **`PublicOnly` es un parche client** de lo que resuelve un route group: el
  layout raíz envía JS de Navbar/Footer al admin. La carpeta vacía
  `app/(public)/` muestra que la migración se empezó. Completarla y eliminar
  `components/layout/PublicOnly.tsx`.
- **Directorios fantasma** (vacíos, no trackeados): `app/(public)/*`,
  `app/api/{cotizacion,destinos,newsletter}`, `components/{admin,forms,popups,sections}`,
  `data/`. Confunden cualquier lectura del repo. Borrar.
- **Revalidación duplicada** en `app/admin/destinos/actions.ts:100-107` y
  `app/admin/actions.ts:94-99` → extraer `lib/revalidacion.ts` o migrar a
  `revalidateTag`.
- **Reseñas no revalidan las páginas de destino**: `app/admin/resenas/actions.ts:10-14`
  solo revalida `/`, pero `/destinos/[slug]` muestra una reseña → queda visible
  hasta 30 min tras ocultarla.
- **Tarjeta de destino duplicada**: `components/home/DestinosGrid.tsx:47-125` vs
  el card interno de `components/destinos/DestinosLista.tsx` — ya divergieron.
  Extraer `components/destinos/DestinoCard.tsx`.
- **Trío de acciones de fila casi idéntico**: `RowActions`, `ResenaActions`,
  `FaqActions` (~120 líneas repetidas). Un genérico unifica también el feedback
  de errores (P1-5).
- **Widget de reseñas GHL duplicado** con IDs hardcodeados en dos archivos →
  componente único + constantes en `lib/site.ts`.
- **Tres formatos de resultado de acción** (`FormState`, `ResenaState`,
  `ActionResult`) → unificar en `type Resultado = {ok:true} | {ok:false; error:string}`
  **antes** de escribir el agente, o serán cuatro.
- **Errores de Supabase crudos al cliente** (nombres de columnas/constraints) en
  4 acciones → loguear detalle, devolver mensaje genérico.
- **Lecturas públicas que silencian errores**: `getDestinos`/`getFaqs` devuelven
  `[]` ante fallo → ISR cachea una home vacía 30 min. `getResenaDestino` ni
  siquiera lee `error`.
- Sin `loading.tsx` en el admin (`force-dynamic` + `select('*')`).
- Convenciones: ruta `/admin/viajes` vs carpeta `app/admin/destinos/` (elegir
  una); `lib/` mezcla queries, datos estáticos, helpers y config;
  `lib/hero.ts` mal nombrado (sus helpers se usan fuera del hero).

---

## 🟢 P3 — Higiene (borrado seguro)

**Archivos muertos confirmados (0 referencias):** `components/ui/StatCard.tsx`,
`components/ui/TrustBadges.tsx`, `types/resena.ts` (contiene además un carácter
cirílico invisible en `ResenаFuente`), carpeta `data/`.

**Exports muertos:** `fbEvent` (`lib/analytics/fbpixel.ts:3`), `gtmPageView`/`gtmEvent`
(`lib/analytics/gtm.ts:3,8`), `DestinoInput` (`lib/validations/destino.ts:42`),
`WHATSAPP.alterno` (`lib/site.ts:26`).

**Lint roto hoy [verificado]:** `npm run lint` falla — 2 errores
(`components/ui/CountUp.tsx:26`, `components/ui/Reveal.tsx:27`:
`react-hooks/set-state-in-effect`) + 4 warnings.

**Duplicación:** `initials()` (`lib/hero.ts:48`) e `inicialesDe()` (`lib/equipo.ts:152`)
idénticas; `heroBg()` y `destinoCardImg()` con cuerpos idénticos; tres variantes
de `whatsapp*Url` que solo difieren en el mensaje.

**Otros:** `import Link` sin usar en `app/not-found.tsx:1`; ternario como
statement en `ThumbnailBar.tsx:141`; prop `destino` nunca pasada a `WhatsAppButton`.

**Dependencias:** `@types/pg` sobra; `sharp` es **dependencia fantasma** (5 scripts
la importan y no está en package.json — funciona porque Next la instala como
opcional); `remotePattern` de Unsplash innecesario (**[verificado]**: 0 de 18
destinos usan URLs de Unsplash).

**Assets:** `public/img/viajeros/{6,7}.webp` sin referencias. NO borrar
`public/img/<slug>/hero.webp` — son el fallback por convención de `lib/hero.ts`
y **[verificado]** 9 de 18 destinos aún no tienen `imagen_hero` en Storage.

**CSS muerto:** `@keyframes fadeDown` + `--animate-fade-down` + `--animate-pulse-slow`
en `globals.css`.

**Raíz:** `HANDOFF.md` (obsoleto, ya absorbido en memoria), `README.md`
(boilerplate de create-next-app: dice puerto 3000 y fuente Geist),
`dev-server.log` (80 KB), `.env.vercel.local` (token expirado),
`raw-images/` (64 MB) y `optimized-images/` (7 MB) fuera del repo,
`supabase/migrations/_aplicar_en_produccion_004_006.sql` (ya aplicado).

**Scripts one-off ya ejecutados** (archivar): `migrate-destinos-storage.mjs`,
`fetch-unsplash.mjs`, `run-migrations.mjs`. Conservar los de optimización de
imágenes y `shoot.mjs`.

---

## 🗄️ Base de datos (advisors de Supabase)

**Seguridad:** función `set_updated_at` con `search_path` mutable; políticas
INSERT abiertas en `leads` (intencional) y `security_logs`; bucket público
`destinos` permite **listar** todos los archivos (política SELECT amplia
innecesaria); protección de contraseñas filtradas (HaveIBeenPwned) desactivada.

**Performance:** 8 políticas RLS re-evalúan `auth.*()` por fila → envolver en
`(select auth...)`; políticas SELECT duplicadas en `destinos`, `faqs`, `resenas`
(admin + pública se ejecutan ambas); 5 índices sin uso.

---

## ✅ Fortalezas (mantener)

- Todas las server actions re-verifican sesión y rol antes de mutar; gate doble
  real (proxy + guard) y `getUser()` (revalida JWT) en vez de `getSession()`.
- Service-role nunca llega al cliente (12 importadores, todos server).
- Sin secretos en el repo; sin inyección de filtros PostgREST; zod en formularios.
- Formulario público con rate limit, honeypot, timeout de 8 s y sin PII en Supabase.
- Headers sólidos: HSTS con preload, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`, `noindex` en `/admin/*`, señuelos de `/wp-admin`.
- Convención server-first bien aplicada: ISR en público, `force-dynamic` en admin,
  `'use client'` casi siempre justificado, `preload()` de la imagen LCP.
- Migración 008 ya cerró una fuga previa de la allowlist — el hardening anterior
  se hizo bien.
- Comentarios que explican decisiones (no obviedades).

---

## Plan de remediación sugerido

**Hoy (bloquea todo lo demás):**
1. Desactivar registros públicos en el dashboard de Supabase (1 clic).
2. Migración RLS: allowlist en vez de `authenticated`, en todas las tablas + bucket.
3. Quitar la auto-aprobación de `signUp`; `requireAdminRole` en gestión de usuarios.
4. Helper `jsonLd()` que escapa `</script>` en los 4 bloques.

**Esta semana (rendimiento, mucho retorno por poco código):**
5. Cliente Supabase sin cookies para lecturas públicas → recupera ISR (R1).
   Es el cambio de mayor impacto del informe: arregla caché, costo y resiliencia
   de un plumazo.
6. `Icono.tsx` sin el set completo de lucide (R3) y hero con `<Image>` (R2).
7. Rate limit en login/registro + verificar Upstash en producción.
8. Endurecer CSP y `remotePatterns`.
9. Arreglar los 2 errores de lint (el lint debe pasar antes de tocar más código).
10. Arreglar el drift de `nombre_local` y adoptar zod como fuente única de los
    sub-tipos jsonb (`z.infer`) para que no se repita el bug del itinerario.
11. Correcciones puntuales: placeholder de imagen, `robots.ts`, `precioToOffer`,
    orden de reseñas, `timeZone` en el panel, `React.cache()` (R5, R6).

**Antes de construir el agente conversacional:**
9. Unificar el tipo `Resultado` de las server actions.
10. Centralizar revalidación (o migrar a tags).
11. Estructura propuesta: `app/api/agente/webhook/route.ts` (capa HTTP delgada:
    verifica firma, parsea con zod, responde 200 rápido) + `lib/agente/`
    (`schemas.ts`, `conversacion.ts`, `claude.ts`, `conocimiento.ts`, `ghl.ts`),
    reusando `lib/security/rateLimit.ts`.

**Cuando haya tiempo:** limpieza P3 completa, route group `(public)`,
`DestinoCard` compartido, genérico de acciones de fila, migración de higiene
de la BD (search_path, políticas duplicadas, índices sin uso).
