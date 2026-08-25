# HANDOFF — Travel World Colombia

> Punto de entrada para una **sesión nueva**. Actualizado **2026-08-25**.
> Lee también `AGENTS.md` (esta versión de Next tiene cambios de API: consulta
> `node_modules/next/dist/docs/` antes de escribir código nuevo) y la memoria
> persistente del proyecto (se carga sola; `MEMORY.md` es el índice).

---

## 🎯 DOS FRENTES ACTIVOS

1. **Sol** — el agente conversacional de IA (WhatsApp/IG/FB vía GoHighLevel).
   **Encendido en producción para TODOS los contactos** (ya no hay tag de prueba).
2. **La web** — rediseño de `/destinos` con taxonomía + mapa interactivo,
   páginas `/servicios` y `/cruceros`, flujo "olvidé mi contraseña" del panel.

**Documentos de referencia (en el repo):**
- `docs/agente-sol-diseno.md` — diseño funcional de Sol.
- `docs/handoff-sol-interaccion.md` — hand-off del pulido de interacción.
- `docs/ghl-twc-mapa.md` — IDs de la subcuenta GHL (pipeline, etapas, campos, tags).
- `docs/ghl-twc-auditoria.md` · `docs/auditoria-2026-08.md` — auditorías.

---

## 🤖 SOL — estado al 2026-08-25

### Fases: todas desplegadas

| Fase | Estado |
|---|---|
| 1 · Webhook escucha/registra | ✅ producción |
| 2 · Cerebro (Opus 5 + catálogo) | ✅ producción |
| 3 · Escribe en GHL (crm.ts) | ✅ producción |
| 4 · Seguimiento dinámico (cola + runner + cron) | ✅ commiteada y desplegada — ⚠️ ver "cron" abajo |
| **Encendido** | ✅ **responde a TODOS** (sonda GET lo confirma) |
| Vigilante de leads sin respuesta | ✅ código en producción — ⚠️ falta activarlo (workflow GHL + cron externo) |

### Crisis resuelta (2026-08-19/20): Sol se apagaba en cadena

- **Causa raíz**: el **auto-saludo del dispositivo WhatsApp `+57 320 489 1930`**
  (mensajes `🔁 Sent from another device`) respondía solo; la compuerta
  anti-choque lo leía como "humano tomó el chat" → `stop_bot`. Afectó
  **153/191 contactos**. **El cliente ya APAGÓ ese auto-saludo** — no volver a activarlo.
- **Bug 400 CORREGIDO** (`lib/agente/claude.ts`): el bloque de "situación" iba
  como mensaje `role:'system'` al final de `messages` y rompía cuando el último
  del historial era saliente. Ahora es el 3er bloque del arreglo `system`
  (después del breakpoint de caché — el caché no se ve afectado).
- **Bug lead-nuevo-en-silencio CORREGIDO** (`lib/agente/enriquecer.ts`): en
  leads de PRIMER contacto el webhook llegaba antes de que GHL indexara la
  conversación (carrera) → Sol callaba (~15 leads perdidos). Fix: reintentos
  (3× con 2 s) de `conversacionDe()`.
- **Rescate ejecutado**: se respondió manualmente (imitando a Sol, registrando
  los `messageId` en `agente_mensajes_enviados`) a los leads colgados; los
  calificados recibieron el tag `sol_calificado`.

### Vigilante de leads sin respuesta (nuevo, falta encender)

`lib/agente/vigilante.ts` + `GET /api/agente/vigilante` (auth `CRON_SECRET` o
`AGENTE_WEBHOOK_SECRET`; `?dry=1` = simulación sin escribir). Cada corrida:
busca conversaciones con mensaje del cliente >60 min sin NINGÚN saliente (Sol
o humano), **solo dentro del horario de atención** (`enHorario`), y pone/quita
el tag **`lead_sin_respuesta`**. Probado en dry contra producción.

**Para activarlo (pendiente del usuario):**
1. Workflow en GHL: trigger *Contact Tag* = `lead_sin_respuesta` → notificación
   interna al **Assigned User** (rama sin asignar → notificar coordinador).
   NO mensajear al cliente; NO quitar el tag (lo quita Sol al re-armar).
2. Cron **externo** (cron-job.org, gratis — el proyecto Vercel es **Hobby**, sin
   crons horarios): GET cada hora a
   `https://travel-world-colombia.vercel.app/api/agente/vigilante` con header
   `x-sol-secret: <AGENTE_WEBHOOK_SECRET>`. Probar primero con `?dry=1`.

### ⚠️ Cron de seguimiento probablemente NUNCA ha corrido

`vercel.json` tiene 2 crons de `/api/agente/seguimiento` (15:00 y 20:00 UTC)
pero **`CRON_SECRET` NO existe en Vercel** (verificado 2026-08-20 en el
dashboard) → los crons reciben 401. Opciones: crear `CRON_SECRET` en Vercel, o
sumar 2 jobs más al cron externo con el header `x-sol-secret`. **Nadie ha
verificado un seguimiento real enviado.**

### Cuellos de botella de canal (siguen vivos, no son bugs de Sol)

- **Instagram/Facebook**: pasadas 24 h del último mensaje del cliente, la API
  rechaza el envío (política de Meta). Solo se puede responder desde el inbox.
- **Contactos SIN teléfono** (custom provider `6a22bfc4fcbd457e97784fbb`):
  todo envío por API falla con `422 Missing phone number`. Las asesoras deben
  responder desde ese inbox o conseguir el número.

### Limpieza del pipeline (2026-08-19, hecha por API)

Etapa "Lead Nuevo" tenía 519 oportunidades → quedaron **8**: 309 (ya asignadas)
→ "Asignado a Agente", 169 (muertas >90 días) → `lost`, 33 B2B/proveedores →
`abandoned` + tag `proveedor`. **7 ventas activas quedaron protegidas en Lead
Nuevo y el cliente debe reubicarlas a mano** (Alicia Castro, Ecoinnhotelcusco,
Nath, LuzA, Fernanda, María Eugenia + 1). Causa de fondo NO resuelta: ningún
workflow mueve la etapa al asignar → se volverá a acumular.

Confirmado: el tag **`sol_calificado`** dispara el workflow **"2.-Calificado
por Bot (Actualización en Pipeline)"** que **asigna asesora automáticamente**.

---

## 🌐 WEB — estado al 2026-08-25

### `/destinos` — taxonomía + mapa interactivo (aprobado por el cliente)

- **Modelo por facetas** (no árbol): `pais` + `region` (= continente en
  internacionales) + `transporte` ('bus'|'avion', solo Colombia; migración
  **014**) + `salida_fin_ano` (bool, 014) + `destacado` (= "Favoritos") +
  `es_crucero` (bool, migración **015**).
- **`MapaDestinos.tsx`**: mapamundi interactivo con **geografía real**
  (Natural Earth 110m → `components/destinos/mapa-mundo.ts`, generado por
  `scripts/generar-mapa-mundo.mjs`; regenerable con `npm i d3-geo` + node).
  Compacto (max-w-3xl centrado), visible en **todas** las pantallas (el cliente
  lo aprobó también en móvil). Hover ilumina + pastilla con conteo; clic filtra
  la página a esa región (toggle); pin animado de Colombia → nacionales;
  regiones sin datos tenues y no clicables.
- **`DestinosExplorador.tsx`** (reemplazó a DestinosLista): el mapa es LA
  navegación geográfica; chips solo para facetas transversales (⭐ Favoritos,
  🎄 Salidas fin de año cuando exista data) + chip ✕ de limpiar. Colombia en
  sub-grupos 🚌 bus / ✈️ avión; internacionales en grilla de 3 por región con
  el país como etiqueta en cada tarjeta (`DestinoCard.tsx`, badges ⭐/🎄).
- `/destinos` **excluye** cruceros.

### Páginas nuevas

- **`/servicios`**: Renta de autos · Seguro de viajes · SIM internacional,
  con CTA de WhatsApp (contenido hardcodeado).
- **`/cruceros`**: lista los destinos con `es_crucero` (checkbox en el panel);
  estado vacío "Muy pronto" + CTA mientras no haya cruceros cargados.
- **Nav**: Inicio · Destinos · Cruceros · Servicios · Nosotros · Contacto.
  (Fase 4 pendiente: agrupar en dropdowns.)

### Panel admin

- **"Olvidé mi contraseña" en producción**: `/admin/recuperar` (pide enlace,
  respuesta genérica anti-enumeración) + `/admin/actualizar-password` (nueva
  contraseña sobre la sesión de recovery). Server actions `solicitarReset` /
  `actualizarPassword` en `app/admin/actions.ts`; rutas eximidas en `proxy.ts`.
  La plantilla **"Reset Password" de Supabase ya quedó configurada** por el
  cliente (`/auth/confirm?token_hash=...&type=recovery&next=/admin/actualizar-password`).
- Form de destinos: controles nuevos (Transporte, Salida fin de año, Es
  crucero, Región/Continente con hint).
- ⚠️ El panel de FAQs **no tiene botón de editar** (solo crear/ocultar/borrar);
  las correcciones de texto se hicieron directo en la BD. Mejora candidata.

### Cifras de marca (corregidas en toda la web + FAQs en BD)

**+500 destinos · +14 años de experiencia · 1 centro de operación** (antes
había 8+/5/15/3 mezclados). Si aparece una cifra vieja en algún lugar nuevo,
esa es la fuente de verdad.

---

## 🔑 CONFIGURACIÓN / INFRA

- **Vercel**: cuenta **ElFabre**, plan **Hobby** (sin crons horarios; el
  cliente descartó migrar a Pro). Auto-deploy con push a `main`. Preview
  deployments **funcionan** (el cliente habilitó las env vars de Supabase para
  el entorno Preview) pero están tras login de Vercel.
- **Env en Vercel**: todo cargado **excepto `CRON_SECRET`** (ver arriba).
- **Sonda de Sol**: `GET /api/agente/webhook` con header
  `x-sol-secret: <AGENTE_WEBHOOK_SECRET>` → dice modo y variables presentes.
- **Supabase**: proyecto `xedqgagkrtfcbenyimkg` (MCP). Migraciones aplicadas
  en prod hasta la **015**.
- **GitHub**: `ElFabre/travel-world-colombia`. Si el push da 403:
  `gh auth switch --user ElFabre`.
- **MCP de Vercel apunta al team equivocado** (Fabrizio, no ElFabre): para
  estado de deploys usar `gh api repos/ElFabre/travel-world-colombia/deployments`
  (+ `/statuses`).

---

## ⚠️ PENDIENTES DEL USUARIO (no son de código)

1. **Activar el vigilante**: workflow GHL del tag `lead_sin_respuesta` + cron
   externo (ver sección del vigilante).
2. **`CRON_SECRET` en Vercel** (o cron externo) para que el seguimiento corra.
3. **Etiquetar destinos en el panel**: revisar `transporte` pre-cargado por SQL
   (bus = Andina/Eje Cafetero, avión = Caribe), marcar ⭐ favoritos reales y
   🎄 salidas fin de año, y **cargar los cruceros** (checkbox "Es crucero").
4. **Reubicar las 7 ventas activas** que quedaron protegidas en "Lead Nuevo".
5. Leads sin teléfono pendientes de respuesta humana: Trujillo, Diego Romero,
   Killiam, Esteban (custom provider) · Diana M Muñoz, El Mapu620 (inbox IG).
6. Workflow que **mueva la etapa al asignar** (para que Lead Nuevo no se vuelva
   a llenar) — se puede diseñar en una sesión.
7. Históricos aún abiertos: registros públicos de Supabase (Sign Ups),
   protección HaveIBeenPwned, precio de "Perú de Colores", fotos del
   itinerario perdidas, fotos de los 7 paquetes ocultos de Drive.

## ⏭️ CANDIDATOS PARA LA PRÓXIMA SESIÓN

- Fase 4 de la web: menú con dropdowns.
- Botón "Editar" en el panel de FAQs.
- Probar un seguimiento real de punta a punta (tras resolver el cron).
- Diseñar el workflow de progresión de pipeline al asignar.

---

## 📦 ESTADO DEL PROYECTO

**Stack:** Next.js 16.2.7 (App Router, Turbopack) · React 19 · Tailwind v4 ·
TypeScript · Supabase · GoHighLevel (API REST con `GHL_TWC_PIT`) · Claude Opus 5.
**Repo:** `C:\Users\efabr\Travelworldcolombia`.
**Producción:** https://travel-world-colombia.vercel.app

### Gotchas vigentes

1. **Turbopack cachea `globals.css`**: tras editarlo, `rm -rf .next` + reiniciar.
2. **El navegador del preview congela animaciones/screenshots** — verificar por
   estilos computados o `javascript_tool`, no por screenshot.
3. **PowerShell 5.1 no manda UTF-8**: probar webhooks con emojis pasando bytes.
4. **GHL `/conversations/search`**: el parámetro `page` se IGNORA — paginar con
   `startAfterDate` + `startAfter` (el campo `sort` viene como `[epoch_ms]`,
   pasar el entero). La API está tras **Cloudflare**: curl necesita
   `--ssl-no-revoke` y User-Agent de navegador (si no, error 1010/403); tras
   muchos requests puede bloquear temporalmente.
5. **Zod descarta lo que no está en el esquema**: al agregar un campo hay que
   tocar `types/destino.ts`, `lib/validations/destino.ts`, el form del panel
   **y** `construirPayload` en `app/admin/destinos/actions.ts`.
6. **No usar el MCP `prod-ghl-mcp`**: apunta a otra subcuenta. API REST directa.
7. **Enviar mensajes "como Sol" por API**: POST `/conversations/messages` con
   `type:'SMS'` + `conversationProviderId` del canal del cliente (WhatsApp
   custom = `67fb7921ff76fb73c232c866`), y **registrar el `messageId` en
   `agente_mensajes_enviados`** — si no, Sol lo lee como humano y se apaga.
8. Las páginas públicas son ISR: un cambio hecho directo en la BD no se ve
   hasta revalidar (redeploy o `revalidatePath` desde una action).

### Convenciones

- Server Components por defecto; `'use client'` solo cuando hace falta.
- Animaciones en CSS puro (no framer-motion).
- `npx tsc --noEmit` **y** lint antes de commitear (ignorar el error de tipos
  generados obsoletos en `.next/dev/types`).
- No commitear sin aprobación explícita del usuario.
- Commits: conventional commits en español.
- Español para el dominio, inglés para infraestructura.

### Deuda conocida (de `docs/auditoria-2026-08.md`)

Sin cambios: `select('*')` manda jsonb completos al cliente · hero sin
`<Image>` (LCP) · fallback de imagen roto para destinos sin foto · route group
`(public)` a medio migrar · tres formatos de resultado en server actions ·
revalidación duplicada · drift de `nombre_local` · limpieza P3.
