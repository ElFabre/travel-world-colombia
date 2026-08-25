# Hand-off — Sol EN PRODUCCIÓN

> **Estado (2026-08-12): Sol está EN VIVO atendiendo a TODOS los leads.**
> Verificado en producción: responde, califica, escala, hace handoff silencioso,
> capta nombre, envía fotos. Este doc es el punto de partida para una sesión nueva.

## Qué es Sol
Agente conversacional de **Travel World Colombia** en GoHighLevel (GHL).
Flujo: mensaje en GHL → workflow **"Sol Webhook"** dispara el webhook →
`POST /api/agente/webhook` (Next.js en Vercel) → **Claude Opus 5** vía
`@anthropic-ai/sdk` con **structured output** → responde por la API de GHL.
Canales: WhatsApp (custom provider `TYPE_CUSTOM_SMS`), Instagram, Facebook, widget.

**Reemplazó a la Conversation AI nativa de GHL** (deshabilitada). El objetivo de
Sol: calificar sin interrogar, medir temperatura, hacer handoff al humano con
contexto, y perseguir con seguimiento dinámico — sin competir con los asesores.

### Archivos clave (`lib/agente/`)
- `config.ts` — constantes/IDs/tags/horario/env (TAG_PRUEBAS con sentinel, RAFAGA).
- `prompt.ts` — `INSTRUCCIONES` (personalidad, reglas, caminos) + `ESQUEMA_DECISION`.
- `claude.ts` — `decidir()`: arma prompt (INSTRUCCIONES + índice catálogo cacheado
  + detalle bajo demanda) + `situacion` (fecha, nombre, primerContacto…), llama al modelo.
- `conversacion.ts` — `atender()` (compuertas + turno del webhook), `humanoTomoElChat()`,
  `esNuestro()`, `registrarEnviado()`.
- `seguimiento.ts` — runner del seguimiento dinámico (cron).
- `crm.ts` — escritura en GHL: `guardarCalificacion`, `marcarHandoff`, `componerBrief`
  (el brief "📝 RESUMEN PARA COTIZAR"), `moverSiCalificado`, `nivelDeUrgencia`.
- `conocimiento.ts` — catálogo en 2 capas (`base` índice + `detallesPara`) + `extraerFotos`.
- `enriquecer.ts` — lee conversación + tags + `ia__nombre` (nombreConfirmado).
- `autor.ts` — detección de autor (cliente/sol/bot_actual/humano).
- `ghl.ts` — cliente API GHL (`enviarMensaje` con `attachments`). `transcribir.ts` — audios.

## Qué hace Sol hoy (features en vivo)
- **Calificación:** núcleo (destino, fechas, pax) + afinación. `temperatura` = INTENCIÓN
  de compra por señales (no por datos). `proximidad_viaje` (inminente/cercano/lejano).
  `nivel_de_urgencia` = temperatura + proximidad.
- **Handoff silencioso (Camino 1):** al calificar, Sol NO anuncia traspaso; manda
  "dame un momento armando tu cotización, sigo contigo", queda en **espera caliente**,
  pone el tag **`sol_calificado`** + nota interna + llena el campo **Mensaje de cotización**
  (brief formateado). Mueve la oportunidad a "Calificado por Bot".
- **Escalada dura (Camino 2 = acción `escalar`):** pide humano, molesto, dinero/pagos,
  post-venta, reclamo → tag `transferencia a humano` + aviso directo. NO apaga a Sol.
- **Aviso de datos (Ley 1581):** UNA vez, como mensaje aparte, SOLO en conversaciones
  genuinamente nuevas (sin salientes previos). Texto legal fijo en `config.AVISO_DATOS`.
- **Nombre real → `ia__nombre`:** el de WhatsApp no es confiable; Sol pregunta una vez,
  lo escribe en `ia__nombre` (un workflow de GHL lo copia al Nombre principal).
- **Destinos a la medida:** encuadre positivo ("te lo armamos"), sin decir "no publicado".
- **Apertura sin catálogo:** el primer mensaje solo saluda + pide nombre/qué viaje busca.
- **Catálogo 2 capas:** índice ligero (nombre, país, precio, 📷, link) cacheado +
  detalle pesado inyectado por turno solo del destino mencionado (`detallesPara`).
- **Envío de foto:** Sol pone marcador `[foto:slug]` → `extraerFotos` lo quita y adjunta
  `imagen_hero` (URL pública de Supabase Storage). SOLO destinos con 📷 en el índice.
  **Verificado: el provider de WhatsApp entrega imágenes.**
- **Detección de humano robusta:** `humanoTomoElChat` revisa TODA la ventana (no solo el
  último msg): cualquier saliente real que no sea de Sol → `stop_bot`.

## Gotchas caros (NO repetir)
1. **"Schema is too complex"** (structured output de Anthropic): el objeto `datos`
   ~10 propiedades es el borde. `additionalProperties:false` es OBLIGATORIO (no se
   puede quitar). NO agregar campos al esquema sin quitar otros. Para probar variantes:
   script tsx con `new Anthropic({ timeout: 40000, maxRetries: 0 })` (si no, cuelga
   10 min reintentando) llamando `messages.create` con `output_config.format.json_schema`.
   El fallo es SILENCIOSO (Sol no responde, registra "SOL falló").
2. **Vercel guarda el string vacío como `""` literal.** Poner `AGENTE_TAG_PRUEBAS=""` en
   la UI lo dejó = dos comillas → Sol respondía solo a un tag inexistente. Fix: sentinel
   en `config.ts` (normaliza `''`/`""`/`all`/`*`/`todos`/`none`/`off` → sin compuerta).
3. **Compilación en frío de la gramática** tras un cambio de esquema: los primeros leads
   pueden morir por el `maxDuration` (90s) sin dejar rastro. Mitigación: PRECALENTAR con
   una llamada al modelo con el esquema exacto tras desplegar.
4. **`humanoTomoElChat` excluye `TYPE_ACTIVITY_*`** ("Opportunity updated" son salientes
   pero no de una persona; si no se excluyen, apagarían a Sol por error).
5. **GHL API:** 403 error 1010 (Cloudflare) si el request no lleva `User-Agent`. El MCP de
   GHL apunta a subcuenta equivocada → usar API directa con `GHL_TWC_PIT`. El param `page`
   de `/conversations/search` se ignora.
6. **Push a GitHub:** si da 403, `gh auth switch --user ElFabre`.
7. **Vaciar campos GHL:** PUT `field_value: ""`; los multi-opción necesitan `[]`.

## Config / IDs / entorno
- **Vercel:** proyecto en la cuenta **ElFabre** (NO el team "Fabrizio's projects").
  Sirve `travel-world-colombia.vercel.app`. Dominio real **travelworldcolombia.com** ya
  conectado (`NEXT_PUBLIC_SITE_URL`). ⚠️ No se pueden leer logs de runtime de TWC desde
  aquí (el conector de Vercel ve el team equivocado) → **falta terminar el login de Vercel CLI**.
- **Supabase:** proyecto `xedqgagkrtfcbenyimkg`. Tablas: `agente_eventos` (bitácora,
  la nota trae "SOL → responder/callar/escalar/falló"), `agente_mensajes_enviados`
  (anti-bucle), `agente_seguimientos` (cola), `agente_transcripciones`.
- **GHL:** location `RMFUo0i4KOVl7eZHEn7s`, token `GHL_TWC_PIT` (en `.env.local`).
  Sol envía con userId `gtBMafW2RLtgisOI1iuN`.
- **Env clave (Vercel):** `AGENTE_TAG_PRUEBAS=""` (atiende a todos), `AGENTE_RAFAGA_MS=5000`,
  `AGENTE_ACTIVO_DESDE=2026-08-03T23:00:00Z`, `AGENTE_WEBHOOK_SECRET`, `OPENAI_API_KEY`.
- **Tags:** `stop_bot`, `transferencia a humano`, `sol_calificado`, `sol_aviso_datos`;
  exclusión (noCliente): `proveedor`, `mayorista / operadores`, `zolutium-ai`,
  `[device] - mayorista b2b`.
- **Campos GHL:** carpeta ⭐ Calificación (destino_principal, fecha_de_vije, ciudad_de_salida,
  cantidad_de_adultos/nios, edades, presupuesto_estimado, nivel_de_urgencia,
  viaje_personalizado, mensaje_de_cotizacion=`9VrVWrHxICznEh1e3f81`) + `ia__nombre`=`ZJgh8LCTvQz6VIne19uz`
  + carpeta `sol_*`. Mapa completo en `docs/ghl-twc-mapa.md`.

## Cómo detener a Sol (por si un asesor la quiere parar)
1. **Responderle tú** (CRM o celular) → Sol detecta el saliente humano y se pone `stop_bot` sola.
2. **Poner el tag `stop_bot`** al contacto (apagado manual). Reactivar = quitar el tag.
3. **Pausar a TODOS (emergencia):** `AGENTE_TAG_PRUEBAS=pruebas_fabrizio` en Vercel + redeploy.
- Escalar (`transferencia a humano`) **NO** detiene a Sol (queda en espera caliente).

## Diagnóstico rápido
- **Salud/modo:** `GET travel-world-colombia.vercel.app/api/agente/webhook` con header
  `x-sol-secret: <AGENTE_WEBHOOK_SECRET>` → `encendido`, `modo` (debe decir "responde a
  todos los contactos"), `activoDesde`, config presente.
- **Ver decisiones reales:** `agente_eventos` en Supabase (`SELECT recibido_en, autor,
  cuerpo, nota ... ORDER BY recibido_en DESC`). La `nota` trae "SOL → ...".
- **Conversación cruda de GHL:** API directa con PIT + User-Agent (ver scripts previos).

## Pendientes / abierto
- **Hueco:** la etapa avanzada del pipeline (Cotización en proceso, etc.) hoy solo detiene
  los SEGUIMIENTOS, no las RESPUESTAS entrantes (`atender` no chequea `etapasVedadas`, solo
  `seguimiento.ts` sí). Ofrecido cerrarlo (que la etapa avanzada silencie a Sol del todo).
- **Workflow 2 "2.-Calificado por Bot":** su trigger debe ser el tag **`sol_calificado`**
  (el usuario lo iba a configurar). Manda una notificación interna a "CI Conta Al Día" con
  `{{contact.mensaje_de_cotizacion}}` — captura un snapshot temprano (puede verse incompleto);
  el campo se sigue actualizando. Se puede afinar con un "Wait" si se quiere el brief completo.
- **Costo de tokens:** medir por conversación y afinar (índice ya bajó el costo; caché 1h).
- **Fotos faltantes:** destinos sin `imagen_hero` (p.ej. "Plan Mercados Navideños") — el
  usuario podría subir la foto; sin ella Sol no la ofrece (marca 📷 solo si existe).
- **Login de Vercel CLI** a medias (para leer logs de runtime de TWC).
- **Regla de identidad RNT** (menor).

## Commits recientes (main, cuenta ElFabre)
`8b64d55` foto solo si hay 📷 · `cfedc2a` envío de fotos · `76b9978` detección de humano en toda
la ventana · `ec4d2f3` no re-avisar en convos iniciadas · `60bfb71` catálogo 2 capas ·
`332e90e` apertura sin catálogo · `757e6b4` fix esquema (Schema too complex) ·
`eb66dcb` sentinel TAG_PRUEBAS · `518db35` nombre real + destinos a la medida ·
`1de6837` handoff silencioso.

Diseño funcional completo en `docs/agente-sol-diseno.md`; mapa de la cuenta GHL en
`docs/ghl-twc-mapa.md`.

---

## Actualización 2026-08-25 (ver HANDOFF.md raíz para el detalle completo)

- **Sol responde a TODOS** los contactos (sin tag de prueba) y el auto-saludo del
  dispositivo WhatsApp `+57 320 489 1930` — que lo apagaba en cadena vía `stop_bot`
  (153/191 contactos) — **ya fue apagado por el cliente**. No reactivarlo.
- **Fixes en producción:** error 400 del prompt (`claude.ts`: la "situación" ahora es
  3er bloque de `system`, no un mensaje `role:'system'`) y carrera de leads de primer
  contacto (`enriquecer.ts`: reintentos de `conversacionDe`).
- **Nuevo vigilante** (`lib/agente/vigilante.ts` + `/api/agente/vigilante`): marca con
  el tag `lead_sin_respuesta` los leads >60 min sin respuesta de nadie, solo en horario.
  Desplegado pero **inactivo**: falta el workflow de GHL sobre ese tag y un cron externo
  (Vercel Hobby no tiene crons horarios). `?dry=1` simula sin escribir.
- **`CRON_SECRET` sigue sin existir en Vercel** → los 2 crons de seguimiento dan 401;
  el seguimiento dinámico probablemente nunca ha corrido en vivo.
- **`sol_calificado` confirmado**: dispara "2.-Calificado por Bot", que asigna asesora sola.
- Limpieza de pipeline: "Lead Nuevo" 519→8 por API (309 movidas, 169 lost, 33 B2B);
  quedan 7 ventas activas por reubicar a mano.
- Cuellos de canal vigentes: ventana 24 h de IG/FB y contactos sin teléfono del custom
  provider `6a22bfc4…` (422 al enviar) — esos requieren humano.
