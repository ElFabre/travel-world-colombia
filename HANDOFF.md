# HANDOFF — Travel World Colombia

> Punto de entrada para una **sesión nueva**. Actualizado 2026-08-04.
> Lee también `AGENTS.md` (esta versión de Next tiene cambios de API: consulta
> `node_modules/next/dist/docs/` antes de escribir código nuevo) y la memoria
> persistente del proyecto (se carga sola; `MEMORY.md` es el índice).

---

## 🎯 EN QUÉ ESTAMOS: el agente conversacional **Sol**

Un agente de IA que atiende WhatsApp / Instagram / Facebook / widget a través de
GoHighLevel, para reemplazar al bot actual (de zolutium-ai, que también se llama
Sol — el nombre se conserva a propósito para que el cliente final no note el
cambio de interlocutor).

**Documentos de referencia (en el repo):**
- `docs/agente-sol-diseno.md` — diseño funcional: objetivo, principios, estados,
  seguimiento dinámico, campos que faltan en GHL, correcciones previas.
- `docs/ghl-twc-mapa.md` — estructura de la subcuenta (IDs de pipeline, etapas,
  campos, tags, workflows) y cómo identificar al autor de cada mensaje.
- `docs/ghl-twc-auditoria.md` — estado de la operación en GHL y qué falla hoy.
- `docs/auditoria-2026-08.md` — auditoría técnica del repo.

### Estado por fases

| Fase | Estado |
|---|---|
| 1 · Webhook que escucha y registra | ✅ en producción |
| 2 · Cerebro (Claude Opus 5 + catálogo en vivo) | ✅ probado |
| Optimización de costo | ✅ 57% medido |
| Agrupación de ráfagas (10 s) | ✅ |
| 3 · Escribir en GHL | ✅ implementada y probada contra la API |
| **Encendido** | ✅ **`AGENTE_ACTIVO_DESDE=2026-08-03T23:00Z` ya está en Vercel** (modo prueba activo) |
| 4 · Seguimiento dinámico | ✅ implementada y probada en local — **sin commitear ni probar en vivo** |

⚠️ **Hallazgo del 2026-08-04**: las pruebas en vivo de la noche anterior
(22:19–22:42 UTC) corrieron contra el deploy VIEJO (pre-fase 2/3) y ANTES del
encendido (23:00 UTC), así que Sol calló todo — primero por un tag de
proveedor en el contacto de pruebas (ya retirado), luego por la compuerta de
encendido. **Nadie ha visto aún a Sol responder en vivo con el código actual.**
Verificado hoy: el deploy de `929d462` está en producción (status de GitHub) y
un webhook sintético dejó la anotación `SOL → anterior al encendido…` en la
bitácora — compuertas y bitácora funcionan de punta a punta. El contacto de
pruebas `uw120Td4Hyo4an1K4S0L` tiene el tag `pruebas_fabrizio` y ya no tiene
tags de proveedor: la próxima prueba desde el celular SÍ debe obtener respuesta.

### Lo que ya funciona

`app/api/agente/webhook/route.ts` + `lib/agente/`:

- **Recibe** el webhook de GHL (acción **"Webhook" gratuita**, con header
  `x-sol-secret`), responde 200 al instante y procesa en `after()`.
- **Enriquece por API**: el webhook solo manda el contacto, así que el mensaje,
  la conversación y la dirección se piden a GHL.
- **Identifica al autor** por eliminación: entrante = cliente · `messageId`
  propio = Sol · huella `CONVERSATIONS_AI` = bot actual · cualquier otro
  saliente = **humano** (y eso silencia a Sol).
- **Agrupa ráfagas** con ventana deslizante de 10 s (`AGENTE_RAFAGA_MS`).
- **Decide** con `claude-opus-5` y structured output:
  `accion` (responder/callar/escalar) · `motivo` · `mensaje` · `temperatura` ·
  `datos` capturados · `resumen` para la asesora.
- **Responde** por la API de GHL y registra el `messageId` (anti-bucle).
- **Compuertas antes del modelo** (cada una que cierra es una llamada que no se
  paga): encendido, modo prueba, `stop_bot`, proveedor/mayorista, y
  re-verificación anti-choque (si el último saliente no es nuestro, un humano
  tomó el chat).

**Probado con 5 escenarios reales:** escala a un cliente calificado, **calla**
ante un "gracias", **calla** ante un proveedor (sin tag, solo razonando),
escala cuando piden un humano, y responde sin inventar precios.

### Costo (medido, no estimado)

| | |
|---|---|
| Cache HIT | $0,0099 / mensaje |
| Cache MISS (reescribe) | $0,080 / mensaje |
| A 50 msg/día en horario hábil | **~$24/mes** |

Palancas por impacto: **TTL del caché a 1 h** (57% de ahorro — el prefijo es
idéntico para todas las conversaciones, así que cualquier mensaje lo mantiene
caliente) › tamaño del catálogo › agrupación de ráfagas.
⚠️ **Bajar `effort` o apagar el thinking solo ahorra 3%** — no vale la pena
degradar la calidad.

---

## ✅ HECHO: Fase 3 — Sol escribe en GHL (`lib/agente/crm.ts`)

Después de cada turno del modelo, `sincronizarCrm()` (llamado desde
`atender()`, SIEMPRE después de enviar la respuesta al cliente):

1. **Guarda la calificación** en los campos existentes del folder ⭐
   (`destino_principal`, `fecha_de_vije`, `ciudad_de_salida`,
   `cantidad_de_adultos`, `cantidad_de_nios`, `edades_de_los_nios`,
   `presupuesto_estimado`). El presupuesto solo se escribe si el texto trae una
   cifra clara (es MONETORY); "algo económico" no se escribe.
2. **Mueve la oportunidad** a "Calificado por Bot" cuando hay destino + fechas
   + pax, SOLO si está en "Lead Nuevo" (cualquier otra etapa es territorio
   humano). Si el contacto no tiene oportunidad abierta, lo anota y no crea una.
   ⚠️ **Sigue pendiente revisar en la UI el workflow "2.-Calificado por Bot"
   (v45)** — se disparará la primera vez que Sol mueva una tarjeta.
3. **Deja nota interna** con el briefing (`resumen` + datos + temperatura) al
   escalar.
4. **Campos `sol_*`**: se escriben SOLO los que existan en la cuenta (se
   detectan por `fieldKey`, cache de 10 min). **Los 11 de §6.2 ya están
   creados por API (2026-08-04) en la carpeta "IA"** (`a3uTifBfuZDOYpqDRYzj`,
   la misma de `IA - NOMBRE`) — IDs y opciones en `docs/ghl-twc-mapa.md`.
   El código hoy llena `sol_estado`, `sol_temperatura`, `sol_canal`,
   `sol_resumen` y `sol_ultima_interaccion`; los demás (seguimiento,
   objeciones, idioma, confianza) son de la fase de seguimiento dinámico.
   Verificado de punta a punta: escritura y reversión sobre el contacto de
   pruebas por el mismo camino que usa `crm.ts`.

Todo es a prueba de fallos: cada paso captura su error y lo reporta en la
bitácora (`agente_eventos.nota`); un tropiezo del CRM nunca deja al cliente sin
respuesta. **Probado contra la API real** (escritura de campos + nota, creadas
y revertidas sobre el contacto de pruebas `uw120Td4Hyo4an1K4S0L`).

## ✅ HECHO: Fase 4 — Seguimiento dinámico (2026-08-04, SIN commitear)

Implementación de §5 del diseño. Piezas:

- **El modelo programa cada seguimiento**: el esquema de decisión ganó
  `seguimiento {proximo_contacto, angulo}`, `objeciones`, `idioma` y
  `confianza`; las instrucciones tienen las reglas (temperatura, proximidad
  del viaje, decaimiento, domingos no, prohibido "¿sigues interesado?").
  El bloque variable ahora incluye la fecha de hoy (sin ella no puede fechar).
- **Cola operativa** `agente_seguimientos` en Supabase (migración 012, ✓
  APLICADA en prod): una fila por contacto, upsert en cada turno desde
  `sincronizarCrm()` (`crm.ts` → paso "agenda"). Estados:
  pendiente / dormido / cerrado. Los campos `sol_proximo_seguimiento`,
  `sol_intentos_seguimiento`, `sol_objeciones`, `sol_idioma`, `sol_confianza`
  y `sol_motivo_cierre` de GHL son el espejo visible para las asesoras.
- **Runner** `lib/agente/seguimiento.ts` + `GET /api/agente/seguimiento`
  (`vercel.json` → cron a las 15:00 y 20:00 UTC = 10:00 y 15:00 Bogotá).
  Por fila re-verifica TODO: tag de pruebas, `stop_bot`, proveedor/mayorista,
  oportunidad en etapa vedada o post-venta, humano escribió de último,
  ventana 8-20 Bogotá sin domingos. Luego `decidir()` con contexto de
  seguimiento (intento N de 3) — el modelo puede callar y reprogramar.
  Máx. 3 intentos → `dormido`. Callar+reprogramar no gasta intento. Si el
  modelo escribe pero olvida programar el siguiente, hay decaimiento por
  defecto (3 días × intento, esquivando domingo).
- **Probado en local contra la cola real**: fila con contacto inexistente →
  `cerrado` (GHL responde **400**, no 404, a ids malformados — cubierto);
  fila con contacto real sin tag de pruebas → `saltado: modo prueba` (sin
  llamar al modelo); sin secreto → 401. `tsc` y `lint` limpios. **NO se ha
  probado un envío real de seguimiento** (requiere una conversación de prueba
  viva con seguimiento programado).

## 🐛 ARREGLADO (2026-08-04, SIN commitear): el canal de respuesta

Primera prueba en vivo real: Sol decidió responder bien, pero el envío quedó
`failed` con `locale.whatsapp.errors.subscriptionNotActiveLocation`. Causa: la
cuenta NO usa el WhatsApp nativo de GHL — el canal es la app de marketplace
**"Whatsapp, iMessage and SMS"** (custom provider `67fb7921ff76fb73c232c866`,
mensajes `TYPE_CUSTOM_SMS`), y Sol enviaba con `type: 'WhatsApp'`.

Fix en `ghl.ts`: `rutaDeRespuesta(mensajes)` deriva el tipo del último mensaje
ENTRANTE (TYPE_CUSTOM_SMS → `type: 'SMS'` + `conversationProviderId`; IG/FB/
Live_Chat mapeados; default WhatsApp) y `enviarMensaje` recibe la ruta. Ambos
puntos de envío (webhook y runner de seguimiento) la usan. **Verificado**: la
respuesta compuesta por Sol se reenvió por el proveedor correcto y quedó
`delivered` (messageId `M0t3cvsL7ANXeNmrDEQk`, registrado como propio en
`agente_mensajes_enviados` para el anti-bucle).

### ⏭️ SIGUIENTE

1. **Commit + push URGENTE de fase 4 + fix del canal** (requiere aprobación
   del usuario). ⚠️ Hasta el deploy, producción sigue con el código viejo:
   cada mensaje nuevo del contacto de pruebas hará que Sol "responda" al vacío
   (envío `failed`). Con el push también queda creado el cron de `vercel.json`.
2. **Repetir la prueba en vivo tras el deploy**: contestar a Sol desde el
   celular y confirmar que la respuesta llega sola.
3. **`CRON_SECRET` en Vercel** (nueva variable): sin ella el cron recibirá
   401 y el seguimiento no correrá solo. Cualquier valor secreto sirve;
   Vercel lo manda como `Authorization: Bearer` automáticamente.
4. Revisar en la UI qué hace el workflow **"2.-Calificado por Bot" (v45)**
   (sigue pendiente; la API no muestra los pasos). No bloquea el modo prueba:
   el contacto de pruebas no tiene oportunidad y Sol no crea oportunidades.
5. Probar un seguimiento real de punta a punta con el contacto de pruebas
   (conversar, dejar que programe, adelantar `programado_para` a hoy en la
   cola y llamar al runner con el secreto).

---

## 🔑 CONFIGURACIÓN

**Vercel (Production) — ya cargadas:** `ANTHROPIC_API_KEY`, `GHL_TWC_PIT`,
`AGENTE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAILS`.

**`AGENTE_ACTIVO_DESDE` ya está cargada** (= `2026-08-03T23:00Z`): Sol está
encendido en modo prueba. Doble red: `AGENTE_TAG_PRUEBAS` (default
`pruebas_fabrizio`) limita a Sol a contactos con ese tag; vaciarla
(`AGENTE_TAG_PRUEBAS=""`) lo abre a todos.

**Falta para el seguimiento automático:**
```
CRON_SECRET = <cualquier secreto>   # Vercel lo manda al cron; sin él, 401
```

**Sonda de diagnóstico** (dice si está encendido, en qué modo y qué variables
faltan, sin exponer valores):
```
GET https://travel-world-colombia.vercel.app/api/agente/webhook
Header: x-sol-secret: <AGENTE_WEBHOOK_SECRET>
```

**Workflow en GHL:** "Sol Webhook" — disparador *El Cliente Ha Respondido* →
acción **Webhook** (la gratuita, NO la premium: la premium cobra por ejecución
y manda solo 4 campos).

---

## ⚠️ PENDIENTES DEL USUARIO (no son de código)

1. **Desactivar registros públicos** en Supabase → Authentication → Sign Ups.
   Sigue en `disable_signup: false`. El agujero grave ya está cerrado por RLS,
   pero sin esto cualquiera puede seguir creando cuentas.
2. Activar protección de contraseñas filtradas (HaveIBeenPwned) en Supabase.
3. **Precio de "Perú de Colores"**: es el único programa activo sin
   `precio_desde`, y es el primero del listado. Sol no puede dar su tarifa.
4. Re-subir las **fotos del itinerario** que se perdieron antes del fix del
   esquema (commit `ef7a385`).
5. Fotos de los **7 paquetes ocultos** de Drive (órdenes 20-26) para activarlos.
6. Decisiones del cliente pendientes: transición con el bot de zolutium,
   a quién se asigna al escalar, idiomas, si Sol agenda citas.

---

## 📦 ESTADO DEL PROYECTO

**Stack:** Next.js 16.2.7 (App Router, Turbopack) · React 19 · Tailwind v4 ·
TypeScript · Supabase (proyecto `xedqgagkrtfcbenyimkg`, acceso vía MCP) ·
GoHighLevel (API REST con `GHL_TWC_PIT`) · Claude Opus 5.
**Repo:** `C:\Users\efabr\Travelworldcolombia` (GitHub `ElFabre/travel-world-colombia`).
**Producción:** https://travel-world-colombia.vercel.app — auto-deploy con push a `main`.

### Hecho recientemente

- **Seguridad P0 cerrada** (`5a1a3c0`): el panel estaba abierto a internet —
  el registro público auto-aprobaba como editor y RLS confundía "autenticado"
  con "admin". Migración 010: las políticas exigen `admin_allowlist`; `leads` y
  `security_logs` cerradas al cliente; Storage solo aprobados; helper
  `lib/seo/jsonLd.ts` escapa `<` (había XSS almacenado en los 4 bloques JSON-LD).
- **Rendimiento** (`c8f4c7d`): `lib/supabase/publico.ts` (cliente SIN cookies)
  recuperó el ISR — antes `cookies()` hacía dinámicas todas las páginas
  públicas. Catálogo de iconos curado (`lib/iconos.ts`) en vez del set completo
  de lucide. React.cache, `precioToOffer` arreglado, timeZone en el panel.
- Rediseño de producto (fases 1-3), itinerario con fotos por día, tarjetas y CTA
  en azul de marca.

### Gotchas vigentes

1. **Turbopack cachea `globals.css`**: tras editarlo, `rm -rf .next` + reiniciar.
2. **El navegador del preview congela las animaciones** — verificar por estilos
   computados, no por screenshot.
3. **PowerShell 5.1 no manda UTF-8**: al probar webhooks con emojis hay que
   pasar el body como bytes o el JSON se rompe (es la prueba, no la ruta).
4. **El parámetro `page` de `/conversations/search` de GHL se IGNORA**: devuelve
   siempre la misma página. Paginar infla los conteos; usar `startAfterDate`.
5. **Zod descarta lo que no está en el esquema**: al agregar un campo a un jsonb
   hay que tocar `types/`, el editor del panel **y**
   `lib/validations/destino.ts`. Ya causó dos bugs (fotos del itinerario y
   precios de experiencias).
6. **No usar el MCP `prod-ghl-mcp`**: apunta a otra subcuenta. Usar la API REST
   con `GHL_TWC_PIT`.
7. Push a GitHub: si da 403, `gh auth switch --user ElFabre`.

### Convenciones

- Server Components por defecto; `'use client'` solo cuando hace falta.
- Animaciones en CSS puro (no framer-motion).
- `npx tsc --noEmit` **y** `npm run lint` antes de commitear.
- No commitear sin aprobación explícita del usuario.
- Commits: conventional commits en español.
- Español para el dominio (`crearDestino`, `resenas`), inglés para
  infraestructura (`guard`, `rateLimit`).

### Deuda conocida (de `docs/auditoria-2026-08.md`)

No bloquea nada, ordenada por valor: `select('*')` manda los jsonb completos al
cliente · hero sin `<Image>` (LCP) · fallback de imagen roto para destinos sin
foto · route group `(public)` a medio migrar (`PublicOnly` es un parche) ·
tres formatos distintos de resultado en server actions · revalidación duplicada
· drift de `nombre_local` (está en BD y en el hero, pero no es editable) ·
limpieza P3 (3 archivos muertos, 4 exports, `sharp` fantasma, ~70 MB de
imágenes crudas en local).
