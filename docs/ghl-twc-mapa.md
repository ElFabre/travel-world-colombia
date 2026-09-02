# Mapa de la subcuenta GHL — Travel World Colombia

> Generado 2026-07-31 vía API con el Private Integration token (`GHL_TWC_PIT` en `.env.local`).
> Location: **`RMFUo0i4KOVl7eZHEn7s`** — "TRAVEL WORLD COLOMBIA AGENCIA DE VIAJES"
> (America/Bogota, +573204891930, agenciatravelworldcolombia@gmail.com).

## Pipelines

### ✅ PIPELINE PRINCIPAL — `G9XH0U9dIBl7Jvd7hyvE`

| # | Etapa | Stage ID |
|---|---|---|
| 0 | Lead Nuevo | `31100b3a-0c8c-4b44-a717-0642177bdd6b` |
| 1 | Calificado por Bot | `df98abba-b57c-45d5-8a8f-4c5ff82d1b45` |
| 2 | Asignado a Agente | `f049d236-3d2e-48ae-ae61-99653b33f131` |
| 3 | Contactado | `581e66d0-f2e2-407a-b2ec-04d1ba644b59` |
| 4 | Cotización en proceso | `17fc06db-e871-465d-bd13-beddf574f967` |
| 5 | Cotización Enviada | `d351d803-3e7c-4ade-a689-d17722f1d046` |
| 6 | En Seguimiento | `c94ca94e-3768-4624-bfdd-e147350933ce` |
| 7 | Negociación | `fef0ff3d-cafc-40a3-8996-09ba897b2b51` |
| 8 | Documentacion | `4cbf272e-674a-4c0c-aebc-9f14fa2efbc4` |
| 9 | Cerrado Ganado | `be026e44-bd85-40d9-99ec-db7b4f03e44b` |
| 10 | Ganado / Abonado | `6f0678b9-4f06-43ee-9e45-e4f40699fe6d` |
| 11 | Cierre Perdido | `e5e4328d-334d-4094-8038-b1c8a3d87bdd` |
| 12 | Cierre Abandonado | `2c78e1a9-6bbe-4f9c-9c61-9944871dcddc` |

### 🛫 Clientes Viajando — `X2FPIf6vQa6E5VSNE922`

Compro → 45 días antes → 30 días → 15 días → 1 semana (Bouchers) → Check-in →
En Viaje → Terminó su viaje → Reviews. (Post-venta; el agente conversacional
probablemente NO lo toca, lo maneja el equipo/workflows.)

## Tags relevantes para el bot

- **`stop_bot`** — apagar el bot para un contacto (convención existente).
- **`transferencia a humano`** — escalada (convención existente).
- `new_lead`, `lead`, `inbound whatsapp`, `[whatsapp] - lead capture`, `[whatsapp] - fb ads`
- Asesoras (asignación): `alejandra_mayorga`, `ginna_cardenass`, `johana_lozano`,
  `juan_camilo`, `luiza_aguirre`, `lynda_quintero`, `pilar_copete`
- `zolutium-ai` — proveedor del bot actual ("Sol").
- Pruebas: `pruebas`, `pruebas_fabrizio`, `review-solicitada-test`
- Otros: `mayorista / operadores`, `proveedor`, `cliente_con_mala_experiencia`,
  `good_review_submited`, `vts-enero`, `vts-febrero`

## Campos personalizados (~150, todos modelo `contact`; 0 en `opportunity`)

### ⭐ Calificación del lead (folder `AmOICbYAU4SyDMfuDNCL`) — los que llena el bot

| Campo | fieldKey | Tipo | ID |
|---|---|---|---|
| Destino Principal | `contact.destino_principal` | LARGE_TEXT | `NXvGm4sqiOhcqu7frkz1` |
| Fecha de Vijae (sic) | `contact.fecha_de_vije` | TEXT | `BZk9ykccXGa8Sm2BHgFh` |
| Duración del Viaje | `contact.duracin_del_viaje` | TEXT | `1wTz5oZRnHLo09EctUUK` |
| Ciudad de Salida | `contact.ciudad_de_salida` | TEXT | `HMOk7JJUomhEQ6TBlwzx` |
| Cantidad de Adultos | `contact.cantidad_de_adultos` | NUMERICAL | `qtGK9F59HWK2u7Mqsyp1` |
| Cantidad de niños | `contact.cantidad_de_nios` | NUMERICAL | `1WNgkrRxbGKKXEsZYs5n` |
| Edades de los Niños | `contact.edades_de_los_nios` | TEXT | `q9pQKxDIUG9CuIKiQSpR` |
| Habitaciones | `contact.habitaciones` | TEXT | `f7ghGzey7b9kzpLzkSwX` |
| Presupuesto Estimado | `contact.presupuesto_estimado` | MONETORY | `yd3GW4sXa8tiY8aCUpvq` |
| Nivel de urgencia | `contact.nivel_de_urgencia` | TEXT | `QBEH9FEY3GVI176JtwA4` |
| Viaje Personalizado | `contact.viaje_personalizado` | SINGLE (yes/no) | `TLYWLxgscWHRy4zwT5pG` |
| Fuente de Lead | `contact.fuente_de_lead` | TEXT | `n0Tqq31LOxsaeHgI2vCQ` |
| Mensaje de cotizacion | `contact.mensaje_de_cotizacion` | LARGE_TEXT | `9VrVWrHxICznEh1e3f81` |

### Proceso de venta (folder `AiUFVzGezgyjSzBTRQuh`)

- Etapa del Lead — `contact.etapa_del_lead` (CHECKBOX: Lead Nuevo, **Calificado por bot**,
  Asignado a agente, Contactado, Cotización en proceso, Cotización Enviada, En Seguimiento,
  Recopilación de Documentos, Cierre Ganado, Ganado/Abonado, Cierre Abandonado, Cierre Perdido) — `8nxLpEH7ZUvbLHOT9e1n`
- 💰 Fecha del Viaje — `contact.fecha_estiada_de_viaje` (DATE) — `KhqxHNqEhYtwaO912IdR`
- Fecha de Regreso — `contact.fecha_de_regreso` (DATE) — `gTZTV5dW5b1nswG0kAEq`
- Tipo de Compra — `contact.tipo_de_compra` (Ticketes / Ticketes & Asistencia / Porción Terrestre / Paquete) — `tqp3MqdqgoQSGEabHdI8`
- Cotización Enviada — `contact.cotizacin_enviada` (MONETORY) — `szO2icue1XnH5pccM5PH`
- Cliente en Viaje — `contact.cliente_en_viaje` (SINGLE_OPTIONS, viaje del cliente) — `7KO8lGy4nsjvhOIorfn5`
- 📩 Contrato y Facturación — `contact._enviar_contrato` (Enviar Contrato / Link de pago) — `0hp9eDRUScTWyl732YkY`

### IA (folder `a3uTifBfuZDOYpqDRYzj`)

- IA - NOMBRE — `contact.ia__nombre` (TEXT) — `ZJgh8LCTvQz6VIne19uz` (nombre capturado por el bot actual)

Campos del agente Sol (creados por API el 2026-08-04, propuesta §6.2 del diseño;
`lib/agente/crm.ts` los detecta por `fieldKey` y escribe los que apliquen):

| Campo | fieldKey | Tipo | ID |
|---|---|---|---|
| Sol Estado | `contact.sol_estado` | SINGLE_OPTIONS (conversando/calificado/escalado/dormido/no_interesado/fuera_de_alcance) | `ViQHLxaiqquWXN3C4g1R` |
| Sol Temperatura | `contact.sol_temperatura` | SINGLE_OPTIONS (caliente/tibio/frio/no_interesado) | `Pb7LLMKqnSaRNWeYXplh` |
| Sol Resumen | `contact.sol_resumen` | LARGE_TEXT | `UwiRAbz1hd52PZEnTN1I` |
| Sol Proximo Seguimiento | `contact.sol_proximo_seguimiento` | DATE | `SbW0fZvzaMlyrSljEsZs` |
| Sol Intentos Seguimiento | `contact.sol_intentos_seguimiento` | NUMERICAL | `FzV3rBcYBNOTl0Dd7icw` |
| Sol Motivo Cierre | `contact.sol_motivo_cierre` | TEXT | `raDE38awjgeZkDz9nJPw` |
| Sol Objeciones | `contact.sol_objeciones` | LARGE_TEXT | `ZWdjCHswoFSpXl86d9gR` |
| Sol Ultima Interaccion | `contact.sol_ultima_interaccion` | DATE | `3lFkVNxsnsEAem7o6BFB` |
| Sol Canal | `contact.sol_canal` | SINGLE_OPTIONS (whatsapp/instagram/facebook/widget) | `Xu5kJNEhfEq0VJE2VeNq` |
| Sol Idioma | `contact.sol_idioma` | TEXT | `6HTkEjejzS5pYuFseaz4` |
| Sol Confianza | `contact.sol_confianza` | SINGLE_OPTIONS (alta/media/baja) | `fwAJmk7Br9RB85UEFqmY` |

> Nota API: no existe endpoint para CREAR carpetas de campos de contacto (la V2
> de `/custom-fields` rechaza `objectKey: contact`), pero el PUT clásico de
> `/locations/{id}/customFields/{fieldId}` SÍ acepta `parentId` para moverlos
> de carpeta. Los campos nuevos caen por defecto en `Y050KGaF6GSPM0NGqjBo`.

### Otros folders (operación interna — el agente NO los toca)

- **Pasajeros P1–P8** (`29aTQqp17HR5lKH9ZTnb`): nombre, documento, pasaporte,
  vencimiento, nacimiento, teléfono por pasajero.
- **Pagos P1–P4** (`a2cZXllEXghKlaw7nG4E`): total plan, abono, saldo, fecha,
  medio de pago, TRM por cuota.
- **Tarifas de cotización** (`L26kaNQSh1iqgyyqyGQf`): ADL sencillo/doble/múltiple,
  valor niño/infante, TRM, totales.
- **Trayectos T1–T4** (`J7JckqAf66S8b03t5giN`): vuelo, ruta, aerolínea, fecha,
  horas salida/llegada + Notas Importantes.
- **Contrato** (`llcyG360i0VrgEvDVftV`): destino, fecha, nº pasajeros, nº trayectos,
  tipo de contrato, firma (SIGNATURE), TWC.
- **Vuelos** (`EgFTy9c391kCV7y17REZ`): cantidades/valores adultos-niños vuelos.
- **CPA / plan cotizado** (`3Wja41HCzgz4g0N1ZPlC`): plan, hotel, noches, acomodación,
  fechas ida/regreso, total personas, observaciones.
- **Inclusiones** (`RZZYWf5PRgrsj9gDGpPf`): Inclusiones / No incluye (MULTIPLE_OPTIONS
  con opciones estándar de equipaje/seguros), Observaciones.
- **Facturación** (`YQbWTr8Voc8t4WgCObt4` y campos "Fact" en `Y050KGaF6GSPM0NGqjBo`).
- **Documentos pasaporte** (FILE_UPLOAD): dos sets — "Pasajero N Pasaporte" 1-6
  (`aVxw7MX3VQfuRhB4iNbo`) y "Pasaporte - Pasajero N" 1-4 (`hXNd9KRUgYaYK0SvAyCe`).
- **Operaciones** (`BCJxgwzUK3LMWHmrrMtr`): Compra Ejecutada, Envío de documentos,
  Fecha de Viaje (operaciones), Pagos (Abonos/Pago completo).
- **Legacy inglés** (`Y050KGaF6GSPM0NGqjBo`): Your destination, How many people…,
  Comentarios de Review.

## Workflows (39 — la API solo da nombre/estado; los pasos se ven en la UI de GHL)

### Pipeline de ventas (espejo de las etapas del PIPELINE PRINCIPAL)
- `99784d96` 1.-Nuevo Lead (Actualización den Pipeline)
- `7a2a522c` **2.-Calificado por Bot (Actualización en Pipeline)** ← v45, muy iterado; clave para el agente.
  Desde 2026-09-01 además crea una TAREA "🤖 Cotizar lead calificado por Sol" (asignada al
  Contact's Assigned User, con el campo *Mensaje de cotización* en la descripción) después del paso de asignación.
- `40df1f58` 4.-Contactado · `939394cd` 5.- Cotización en Proceso · `29dca22e` 6.- Cotización enviada
- `f0b80f21` 7.- En Seguimiento · `c093feef` Documentacion · `dd2b503e` 8.- Cierre Ganado
- `44ef6e3e` Ganado / Abonado · `6ace2f77` 9.- Cierre Perdido · `c0394b05` 10.- Cierre Abandonado

### Bot / IA
- **Escalada a humano** (creado 2026-09-01) ← dispara con tag `transferencia a humano`:
  SMS interno al usuario asignado + tarea "🚨 Cliente pidió humano / escalado por Sol".
  Antes de esto NADA reaccionaba al tag: la escalada dura solo dejaba tag + nota.
  ⚠️ No debe enviar mensajes al cliente (Sol lo leería como intervención humana → `stop_bot`).
- `45776930` **Stop/Active Bot** (v15) ← el switch del bot actual; seguramente reacciona al tag `stop_bot`
- `a8191fc5` Nombre de usuario (probable: guarda `contact.ia__nombre`)

### Asignación de asesoras
- `af7da5a7` Asignación a Usuario (B2B & B2C) · `e7e2306e` Asignación de agentes temporal.
- `3aebb027` Asignar Lead a Usuario Creador · `73f0dd42` Asignar followers a proovedores

### Post-venta (pipeline 🛫 Clientes Viajando)
- `e132e5ec` Compro · `1a186466` 45 días antes · `af83a9e3` 30 días · `89db43c9` 15 días
- `6743c0b9` 7 días antes · `63db3b22` 2 días antes · `4ea65b61` 4.-En Viaje · `e1f494db` 5.-Termino su viaje

### Reviews
- `df5926a8` 6.-Solicitar Review · `0ef22c76` Good Review Submited · `b0a93cf5` Bad Review Submited · `b19381e6` Picture Review

### Contratos
- `484c9805` Envio de Contrato (v49, el más iterado) · `7d5744a6` Notificación Contrato Firmado

### Entradas por webhook / formularios
- `2e69a59a` **web-webhook** ← probable receptor de los leads de nuestra web (GHL_WEBHOOK_URL)
- `a813ae32` WH-Evento LP form. · `cc33a5e6` Webhook para formularios. /panama Flash

### Otros
- `a4971dbc` Flujo de actualizacion de compardores. · `48cfc063` pruebas
- Drafts: `d6ec85dd` Flash Sale - Panama · `7c691c48` New Workflow : 1783703028705

## Detección de autor de mensajes (clave para coexistencia bot ↔ humanos)

Verificado 2026-07-31 leyendo el JSON crudo de mensajes reales:

| Autor | Huella en el mensaje |
|---|---|
| **Sol (AI Employee)** | Mensaje normal (`TYPE_CUSTOM_SMS`, `userId` = Alejandra) **+ mensaje de actividad pareado** `type: 38` / `messageType: TYPE_ACTIVITY_EMPLOYEE_ACTION_LOG`, `activity.data.product: "CONVERSATIONS_AI"`, `agentId: opQsxSI25uAzoXrSG6Pe` |
| **Asesora desde celular** | `userId` de la asesora + sufijo en el body `"🔁 Sent from another device (+573204891930 ) 🔁"` (+ GHL tagea `another-device-replied-whatsapp`) |
| **Asesora desde chat de GHL** | `TYPE_CUSTOM_SMS` outbound con `userId` de la asesora y **SIN** action-log de CONVERSATIONS_AI pareado |
| **Nuestro agente (API/PIT)** | Registramos los `messageId` que devuelve el endpoint de envío → todo outbound cuyo id no esté en nuestro registro no es nuestro |

⚠️ **`userId` solo NO distingue a Sol de un humano**: Sol envía "como" el usuario
de Alejandra Mayorga (`TUADpssNhFeR5ZKoFQeE`). El discriminador confiable del AI
Employee es el action-log `CONVERSATIONS_AI` que acompaña cada respuesta suya.

Usuarios de la subcuenta (userId → persona):
- `TUADpssNhFeR5ZKoFQeE` Alejandra Mayorga (asesor2) ← **identidad que usa Sol**
- `DEOpN0jovQXAXy49fo9D` Johana Lozano (asesor1) · `2fa0Pph0vWepKKCNmju8` Ginna Cardenas (admin)
- `LCUXUU3Ai3hyU2oPtkso` Juan Camilo Gomez · `GXv9erHPii1ZKzwfbLhD` Juanita Sue Cardenas (mayorista)
- `YufMwsZbiQHyk4qiI3w5` Luisa Aguirre (admin, operaciones) · `gtBMafW2RLtgisOI1iuN` Lynda Quintero (admin)
- `hmeFAKEBi0ceNb1QVgFe` Maria Pilar Copete · `GD0MuNI9ecpKYcK28siv` Mauricio (marketing)
- `FZufw2WRWXrqbMb1L6Ea` Milena Cardenas (facturas) · `i8UCCTuCQeKlhDc3p2RV` oscar Cosio (admin)

**Regla de silenciamiento del agente** (al recibir un outbound por webhook):
1. ¿`messageId` está en mi registro de enviados? → soy yo, ignorar.
2. ¿Es action-log o mensaje pareado de CONVERSATIONS_AI? → es Sol (mientras conviva), coordinar/ignorar.
3. Cualquier otro outbound (userId humano, venga de UI o de celular) → **HUMANO INTERVINO** → `stop_bot` + modo escucha pasiva.

Pendiente Fase 1: confirmar la forma exacta del payload del **webhook** de GHL
(puede diferir del shape del API de mensajes) logueando eventos crudos.

## Implicaciones para el agente conversacional

1. **Ya existe la convención de bot**: etapa "Calificado por Bot" en el pipeline,
   tags `stop_bot` y `transferencia a humano`, campo "Etapa del Lead" y `IA - NOMBRE`
   (del bot actual de zolutium-ai / "Sol"). Nuestro agente debe REUSAR estas
   convenciones, no inventar nuevas — así los workflows existentes siguen funcionando.
2. Las herramientas del agente escriben en el folder ⭐ de calificación +
   mueven la oportunidad en PIPELINE PRINCIPAL (Lead Nuevo → Calificado por Bot →
   Asignado a Agente) + tag de escalada.
3. No hay custom fields de oportunidad: todo vive en el contacto.
