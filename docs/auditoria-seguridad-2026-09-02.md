# Auditoría de seguridad — travelworldcolombia.com

**Fecha:** 2026-09-02 · **Alcance:** sitio en producción (Vercel) + código del repo + base de datos de producción (Supabase, verificación en vivo) + DNS/correo.
**Método:** sondeos en vivo (headers, endpoints, TLS, DNS, source maps), auditoría de código de las 5 rutas API y 7 archivos de server actions, revisión de migraciones + políticas RLS/Storage consultadas directamente en producción, advisors de Supabase y `npm audit`.

**Veredicto general:** la postura de seguridad es **sólida**. Los P0 de la auditoría de agosto están corregidos y verificados (panel gateado en servidor, registro sin auto-aprobación, RLS cerrado). No hay ninguna vulnerabilidad crítica explotable hoy. Quedan 1 hallazgo P1 (actualizar Next.js), 4 P2 y varios P3/higiene.

---

## Hallazgos priorizados

### P1 — Actualizar Next.js (16.2.7 → 16.3.4)
`package.json`. `npm audit` marca 4 avisos HIGH en `next` y transitivos (`sharp`, `postcss`, `nanoid`), incluyendo un **bypass de middleware en App Router**. El gate de `/admin` vive en `proxy.ts` (middleware); aunque hay defensa en profundidad (layout + `require*()` en cada action), el bypass debilitaría la primera capa. El fix es un upgrade menor, sin cambio de major.

```bash
npm install next@16.3.4
```

### P2 — Sin rate limiting en el pipeline del agente Sol
`app/api/agente/webhook/route.ts` + `lib/agente/config.ts:218` (`RAFAGA_MS = 0`). Cualquier persona que escriba por WhatsApp/IG genera llamadas a Claude Opus (max_tokens 4000) y, con audios, a OpenAI STT. Con ráfaga en 0, 100 mensajes = 100 llamadas. `checkRateLimit` (`lib/security/rateLimit.ts`) existe pero no se usa aquí.
**Explotación:** spam desde un número anónimo → factura de Anthropic/OpenAI y saturación de funciones.
**Fix:** límite por `contactId` (p. ej. N turnos/hora), restaurar `RAFAGA_MS=10000`, tope de audios por turno.

### P2 — Prompt injection hacia Sol
`lib/agente/claude.ts:46-85`, `lib/agente/prompt.ts`. El texto del cliente (y transcripciones) entra sin delimitar como datos no confiables, y la salida del modelo escribe en GHL: notas internas que las asesoras leen como confiables, tags que disparan workflows (`sol_calificado` asigna asesora y crea tarea), campos como `ia__nombre` que un workflow copia al nombre del contacto.
**Radio acotado** (solo su propio contacto, campos fijos, JSON-schema, fotos solo del catálogo), pero permite auto-calificarse con datos falsos e inyectar texto de ingeniería social en notas internas.
**Fix:** delimitar el contenido del cliente en el prompt como no confiable, regla anti-inyección explícita en `INSTRUCCIONES`, y prefijar notas/brief con "contenido proporcionado por el cliente".

### P2 — `frame-ancestors` con comodín multi-tenant de GHL
`next.config.ts:84`. `https://*.gohighlevel.com` y `https://*.leadconnectorhq.com` alojan páginas de **cualquier** cliente de GHL. Combinado con cookies `SameSite=None`, un tenant hostil podría enmarcar `/admin` con la sesión viva de un admin de TWC (clickjacking). Mitiga: las mutaciones son Server Actions (Next valida Origin), pero la UI sigue siendo superponible.
**Fix:** acotar a `'self' https://app.gohighlevel.com` + el dominio white-label exacto que use la subcuenta; probar el Custom Menu Link después.

### P2 — Correo suplantable: sin DMARC y SPF en `~all`
DNS del dominio: SPF `v=spf1 ip4:23.111.141.202 +mx ~all`, **sin registro `_dmarc`**. Cualquiera puede enviar correos como `@travelworldcolombia.com` con altas probabilidades de entrega (phishing a clientes/proveedores con la marca).
**Fix (en el DNS, no en el repo):** publicar `_dmarc.travelworldcolombia.com TXT "v=DMARC1; p=quarantine; rua=mailto:..."` (empezar con `p=none` + reportes si se prefiere observar primero) y verificar DKIM en el hosting de correo viejo.

---

### P3 — Higiene y endurecimiento

1. **Secreto aceptado por query string** en los 4 endpoints del agente (`?secret=` queda en logs de Vercel y a la vista en la config del workflow de GHL). Un único secreto estático compartido por los 4, sin rotación. → Solo header `x-sol-secret`, secretos por endpoint, rotar al migrar.
2. **Protección de contraseñas filtradas (HIBP) desactivada** en Supabase Auth (advisor WARN en vivo). → Dashboard → Auth → habilitar.
3. **Self-signup abierto** (`disable_signup: false`, verificado en vivo). Es inocuo — sin auto-aprobación, allowlist impuesta en servidor **y en las políticas de Storage/RLS (verificado en producción)** — pero permite crear cuentas basura y usar el mailer de confirmación. → Si las cuentas solo las crea el admin por invitación, apagar signups en el dashboard.
4. **Rate limit con fallback en memoria** (`lib/security/rateLimit.ts:74`): en serverless limita "por instancia". → Confirmar `UPSTASH_REDIS_REST_URL/TOKEN` en Vercel Production.
5. **IDs sin `encodeURIComponent`** en paths de la API de GHL (`lib/agente/ghl.ts`, ~12 sitios). Llamadores autenticados, riesgo bajo. → Codificar cada segmento.
6. **Validación laxa en el formulario público** (`lib/validations/cotizacion.ts:37-38`): `fecha_mes`/`fecha_año` sin enum ni tope → strings arbitrarios hacia campos custom de GHL. → `z.enum(MESES)` + regex de 4 dígitos.
7. **`err.message` devuelto al llamador** en seguimiento/vigilante/reservacion (hasta 300 chars del cuerpo de GHL). Llamadores autenticados; informativo.
8. **CSP con `'unsafe-inline'` en scripts** (tradeoff documentado por GTM/ISR) y cookies de Supabase no-HttpOnly por diseño: cualquier XSS futuro = robo de sesión. Hoy los sumideros están limpios (React escapa; `jsonld.ts` escapa los 4 `dangerouslySetInnerHTML`). Mantener disciplina; considerar nonces si se abandona ISR.
9. **Documentos internos en el repo** (`estrategia-interaccion-2026-09-01.html`, `docs/curso-ghl/`, este mismo informe): no se sirven (verificado 404), pero cuidar qué se commitea a un repo que podría hacerse público.

### Operativo (disponibilidad, no seguridad)
- **`CRON_SECRET` falta en Vercel**: los crons fallan **cerrado** (401, verificado en vivo y en código — nadie anónimo puede ejecutarlos), pero el seguimiento de Sol **nunca corre**. Configurar la variable lo arregla.
- El **vigilante no tiene cron** en `vercel.json` — solo corre a mano.

---

## Verificado y en buen estado

**En vivo (producción):**
- TLS 1.3, certificado Let's Encrypt válido (30-ago → 28-nov-2026, renovación automática de Vercel); HTTP→HTTPS 308; www→apex.
- Headers completos: CSP, HSTS 2 años con `includeSubDomains; preload`, `nosniff`, `X-Frame-Options: SAMEORIGIN`, Referrer-Policy, Permissions-Policy. El permiso de iframe de GHL aplica **solo** a `/admin` — no se filtra al sitio público.
- Los 4 endpoints del agente devuelven 401/405 sin credenciales (comparación en tiempo constante, fallan cerrado si falta la env var).
- `/admin` → login; `/.env`, `/.git/config`, source maps (403), archivos internos: no expuestos. `X-Robots-Tag: noindex` en admin.
- RLS activo en las 11 tablas; `leads` y `agente_*` en deny-all (solo service_role). Bucket `destinos`: 5 MB máx, solo MIME de imagen, y las 4 operaciones exigen `authenticated` + `es_admin_aprobado()` — **verificado consultando `pg_policy` en producción**.

**En código:**
- Server actions del panel re-verifican sesión y rol en servidor en cada mutación (gate triple: proxy + layout + `require*`); rol `representante` confinado a Reservas en las tres capas.
- Sin SQL crudo ni interpolación; sin SSRF (fetch solo a URLs de env); `/auth/confirm` sin open redirect; salida del modelo restringida por JSON-schema; `extraerFotos` solo resuelve slugs del catálogo.
- Login/signup/reset con rate limit por IP y cuenta, anti-enumeración, signup sin auto-aprobación, superadmin no revocable, nadie cambia su propio rol.
- Cero secretos hardcodeados en el árbol ni en el historial de git (grep de patrones sobre 60 commits: limpio); `.gitignore` cubre `.env*` y dumps con PII de GHL; `NEXT_PUBLIC_*` sin nada sensible.
- Formulario público con zod + honeypot + rate limit 5/min por IP.

## Plan de acción sugerido (en orden)

1. `npm install next@16.3.4` y desplegar (P1, 10 min).
2. Rate limit por contacto en el webhook de Sol + restaurar `RAFAGA_MS` (P2).
3. Endurecer el prompt de Sol contra inyección y marcar notas como contenido del cliente (P2).
4. Publicar DMARC (+revisar DKIM) en el DNS (P2, fuera del repo).
5. Acotar `frame-ancestors` al subdominio exacto de GHL (P2).
6. Dashboard Supabase: habilitar protección HIBP y, si aplica, apagar self-signup (P3, 5 min).
7. Configurar `CRON_SECRET` en Vercel y decidir cron del vigilante (operativo).
8. Migrar secretos de query string a header y rotarlos (P3).
