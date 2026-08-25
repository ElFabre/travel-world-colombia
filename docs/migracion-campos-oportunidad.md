# Migración a campos de oportunidad + integración TMS — Documento de diseño

**Fecha:** 2026-08-25 · **Estado:** diseño conversado y aprobado; **nada ejecutado aún** en la subcuenta.
**Subcuenta:** TRAVEL WORLD COLOMBIA (`RMFUo0i4KOVl7eZHEn7s`) · API directa con `GHL_TWC_PIT` (no usar el MCP).

---

## 1. Problema y decisión

Hoy los ~163 campos que describen una **reserva** (pasajeros, vuelos, liquidación, pagos, contrato) viven como campos personalizados de **contacto**. Un cliente que repite viaje obliga a sobrescribir su reserva anterior: se pierde historial y no puede haber dos reservas activas.

**Decisión:** migrar esos campos a campos personalizados de **oportunidad** (1 oportunidad = 1 reserva), en un **pipeline nuevo** que corre en paralelo; el pipeline actual queda intacto hasta agotar sus reservas vivas. A futuro, integración con el **TMS Agencias** (repo `tms-agencias`, SaaS multi-tenant Next.js + Supabase sobre GHL) que asume la capa financiera.

Verificado por API el 2026-08-25: la subcuenta tiene **218 campos de contacto y 0 de oportunidad**.

## 2. Gobernanza: cada dato tiene UN dueño

| Dato | Dueño | Notas |
|---|---|---|
| Contacto, conversaciones, tags, vendedor | **GHL (contacto)** | Sin cambios |
| Calificación de Sol (folder `AmOICbYAU4SyDMfuDNCL`) | **GHL (contacto)** | Sol no se toca |
| Datos del viaje, pasajeros, vuelos, liquidación de venta, **plan de pagos pactado**, inclusiones | **GHL (oportunidad)** | Se llenan al vender, se imprimen en el contrato, se congelan |
| Firma del cliente | **GHL Documents & Contracts** | Deja de ser custom field (`SIGNATURE` no existe en oportunidad) |
| Abonos reales, comprobantes, costos, utilidad, saldos, morosidad | **TMS** | GHL nunca es libro mayor |
| Saldo/estatus/último pago/link estado de cuenta | **TMS calcula → publica a contacto GHL** | Campos puente de solo lectura (§6) |
| Estado post-venta (confirmada/en viaje/completada) | **TMS** (`bookings.status`) | Convención TMS: un solo pipeline comercial; el pipeline "🛫 Clientes Viajando" se retira al integrar |

**Regla del contrato:** el contrato imprime el **pacto** (incluido el calendario de cuotas); la **realidad** de los pagos vive en el estado de cuenta público del TMS (`/estado/[token]`), cuyo link se imprime en el contrato como referencia permanente.

## 3. Pipeline nuevo "Leads y Reservaciones"

- Se crea manualmente en la UI (las etapas **no** se pueden editar por API — hallazgo TMS).
- Los leads **nuevos** nacen aquí con los campos de oportunidad; el "✅ PIPELINE PRINCIPAL" (`G9XH0U9dIBl7Jvd7hyvE`) queda en solo-lectura operativa hasta vaciarse.
- Lista de etapas: definir con el equipo partiendo de las del pipeline actual que siguen vivas (mínimo las 3 del bot: Lead Nuevo → Calificado por Bot → Asignado a Agente, y cierre Ganada/Perdida).

**⚠️ Dependencia crítica — Sol:** el pipeline y las etapas están cableados en este repo:
- `lib/agente/config.ts:14` (`PIPELINE.id = G9XH0U9dIBl7Jvd7hyvE` + IDs de etapas, p. ej. `calificadoPorBot`).
- `lib/agente/seguimiento.ts:116` (referencia a `PIPELINE_POSTVENTA`).
Al crear el pipeline nuevo hay que actualizar esos IDs y desplegar, o los leads seguirán naciendo en el viejo. También revisar el workflow GHL "2.-Calificado por Bot" (disparado por tag `sol_calificado`) que asigna asesora: debe operar sobre el pipeline nuevo.

## 4. Catálogo de campos de oportunidad (mapeo viejo → nuevo)

Principios:
1. **Nombres alineados al catálogo del TMS** donde la semántica coincide — el sync del TMS resuelve campos de oportunidad **por nombre** (`tms-agencias lib/sync/ghl.ts`). Alinear nombres = onboarding plug-and-play.
2. Claves limpias: se corrigen los typos heredados (`paasaporte`, `dcoumento`, `docuemnto`, `perosnas`, `telfono`, `Toltal`).
3. Prefijos desambiguados: pasajeros `P1–P8`, pagos `Pago 1–4` (hoy chocan ambos como "P1").
4. Las carpetas de campos de oportunidad **se crean a mano en la UI** (no hay API para folders); el script de Fase 1 crea los campos y luego se arrastran a su carpeta.

### 4a. Campos alineados al catálogo TMS (nombres EXACTOS, no traducir ni "mejorar")

| Campo actual (contacto) | Campo nuevo de oportunidad (nombre exacto TMS) |
|---|---|
| `fecha_de_ida` (CPA-Fecha de Ida) | **Fecha confirmada de salida** (DATE) |
| `fecha_regreso` (CPA-Fecha de Regreso) | **Fecha confirmada de regreso** (DATE) |
| `cpa__noches` (CPA - Noches) | **Numero de noches** (NUMERICAL) |
| `cpa__total_perosnas` (CPA - Total Perosnas) | **Pax total** (NUMERICAL) |
| `cpa__hotel` (CPA - Hotel) | **Hotel o producto** (TEXT) |
| `cpa__observaciones` (CPA - Observaciones) | **Peticiones especiales** (LARGE_TEXT) |
| `cpa__plan` (CPA - Plan) | **Tipo de paquete** (TEXT) |
| `c__destino` (Contrato - Destino) | **Destino de interés** (TEXT) |
| — (nuevo) | **Moneda de operacion** (TEXT/opciones) |
| — (nuevo) | **Proveedor principal** (TEXT) |
| — (nuevo) | **Numero de reservacion del proveedor** (TEXT) |
| — (nuevo) | **Motivo del viaje** (TEXT) |
| — (nuevo) | **Forma de pago** (TEXT) |
| — (opcional, resumen texto) | **Pasajeros** (LARGE_TEXT) |
| copia desde calificación al convertir | **Presupuesto estimado** (TEXT/MONETORY) |

### 4b. Campos propios de TWC (el TMS los ignora; los usa el contrato)

**Carpeta "Contrato"** (desde 🧾Contratos): Tipo de Contrato (SINGLE_OPTIONS), Fecha del contrato (DATE), Número de Pasajeros (SINGLE_OPTIONS), Número de Trayectos (SINGLE_OPTIONS), TWC (NUMERICAL), Acomodación (TEXT, desde `cpa__acomodacion`), Cant. Habitaciones (TEXT, desde `cpa__cant_hab`), ENVIAR CONTRATO? (disparador, desde `enviar_contrato`). ❌ `firma_del_cliente` NO migra → firma nativa de Documents.

**Carpeta "Pasajeros"** (desde 👨‍💼 Información de Pasajeros, 48 → 48): `P{n} - Nombre y Apellido / Documento / Fecha de Nacimiento / Pasaporte / Vencimiento Pasaporte / Teléfono` para n=1..8, claves limpias `opportunity.p{n}_nombre_y_apellido`, etc. (corrige `paasaporte`, `dcoumento`, `docuemnto`, `telfono`). Tope P1–P8 aceptado como limitación conocida mientras el contrato viva en GHL Documents.

**Carpeta "Vuelos"** (desde 🛫Información de Vuelos, 25 → 25): `T{n} - Ruta / Fecha de salida / Hora de Salida / Hora de Llegada / Vuelo / Aerolínea` para n=1..4 + Notas Importantes (LARGE_TEXT).

**Carpeta "Liquidación"** (desde 💸🛫Liquidación Vuelos + 🏢Liquidación Porción Terrestre, 37 → 37): se mantienen 1:1 (todos se imprimen en el contrato): ADL Sencillo/Doble/Múltiple, Valor Niño, Valor Infante, TRM × (Tarifa por pax / Cantidad / Valor Plan / Valor Total), totales, valores de vuelos por adulto/niño. Corrige `Toltal`; unificar los duplicados `total_pasajeros` vs `total_pasajeros__cantidad` y `tp__valor_total` vs `total_pasajeros__valor_total` en UN solo par. Nota: esto es desglose de **venta** (va al cliente); el costo del proveedor y la utilidad NO se modelan aquí — son del TMS.

**Carpeta "Plan de Pagos"** (desde 💰Registro de Pagos, 25 → 25): `Pago {n} - Fecha / Medio / TRM / Total Plan / Abono / Saldo en Pesos` para n=1..4 (+ Tipo de Pago del pago 1). **Semántica nueva: es el plan PACTADO que se imprime y firma, no el libro de abonos.** Los abonos reales se registran en el TMS cuando esté integrado; mientras tanto el equipo puede seguir usándolos como hoy, sabiendo que ese hábito migra al TMS.

**Carpeta "Inclusiones"** (desde ✅⛔, 3 → 3): Inclusiones (MULTIPLE_OPTIONS, mismas opciones), No incluye (MULTIPLE_OPTIONS), Observaciones (LARGE_TEXT).

**Facturación** (desde 📋Datos de Facturación, 8 → 2 en oportunidad): a oportunidad solo lo per-reserva: Titular de la reserva, Teléfono del titular. Lo estable (NIT, dirección, ciudad, correo, nombre fiscal, teléfono) **se queda en contacto** — Documents mezcla tags `{{contact.x}}` y `{{opportunity.x}}` en la misma plantilla.

**Total nuevo aproximado: ~150 campos de oportunidad** (48 pasajeros + 25 vuelos + 37 liquidación + 25 plan de pagos + 8 contrato + 3 inclusiones + 2 facturación + ~15 catálogo TMS, menos solapes).

## 5. Se queda en contacto (no migra)

- Calificación (Sol) — `AmOICbYAU4SyDMfuDNCL` completa.
- Acciones del Representante, Contact, Additional Info, Operaciones Luisa.
- Pasaportes y Form | Pasaportes (FILE_UPLOAD): los formularios de GHL solo escriben en contacto → quedan como **buzón de entrada**; un workflow copia a la oportunidad si hiciera falta.
- Datos estables de facturación (§4b).
- Los 163 campos viejos: congelados durante la transición, renombrar carpetas a `ZZ (obsoleto) …` en Fase 5, borrar después.

## 6. Campos puente para el TMS (crear en CONTACTO, nombres y opciones EXACTOS)

| Nombre exacto | Tipo | Escribe |
|---|---|---|
| `Saldo total` | MONETORY | credit-bridge + payment-notify |
| `Estatus de crédito` | SINGLE_OPTIONS, opciones exactas `Al corriente` / `En mora` | credit-bridge |
| `Último pago` | TEXT | payment-notify |
| `Link estado de cuenta` | TEXT | payment-notify |

El alta está scripteada en el TMS: `scripts/ghl-setup-cobranza-fields.mjs` + `scripts/ghl-setup-custom-fields.mjs` contra esta location. El match de `Estatus de crédito` es contra las **opciones** además del nombre.

## 7. Contrato (Documents & Contracts)

Verificado por API (2026-08-25): 10 plantillas; las activas son variantes por nº de pasajeros ("🌎4-", "🌎8-"). Un contrato real enviado el 2026-08-25 usa **129 fillable fields, 128 merge tags de `contact.*`** — pasajeros, vuelos, paquete, facturación, inclusiones, liquidación completa y plan de pagos 1–4. Lista completa extraíble con: `GET /proposals/document?locationId=…` → `fillableFields`.

Plan Fase 3:
1. Duplicar las plantillas activas → versión "v2 (oportunidad)" con `{{opportunity.x}}` (y `{{contact.x}}` solo para identidad/facturación estable).
2. Añadir al pie el `{{contact.link_estado_de_cuenta}}` como referencia permanente a los pagos reales (cuando el TMS esté activo).
3. Firma con el campo de firma nativo del documento.
4. El disparador (hoy: cambio del custom field "ENVIAR CONTRATO?") se recrea como workflow sobre el campo de oportunidad equivalente o cambio de etapa. **Verificar en la prueba piloto** que el workflow/envío corre en contexto de oportunidad y resuelve los tags `{{opportunity.*}}` (los merge fields de oportunidad son frágiles fuera de contexto — hallazgo TMS: `{{opportunity.id}}` llega vacío en webhooks).

## 8. Plan de fases

| Fase | Qué | Riesgo |
|---|---|---|
| 0 | Inventario de workflows/formularios que tocan los 163 campos (manual en la UI, checklist) + lista final de etapas del pipeline | — |
| 1 | Crear pipeline "Leads y Reservaciones" (UI) + carpetas (UI) + ~150 campos de oportunidad (script API) + repuntar Sol (`lib/agente/config.ts`) y el workflow "2.-Calificado por Bot" | Bajo (aditivo, salvo el repunte de Sol que es el cutover de leads nuevos) |
| 2 | Leads nuevos operan en el pipeline nuevo; reservas viejas terminan su vida en el viejo. Workflow puente forms→oportunidad si hace falta | Medio (hábitos del equipo) |
| 3 | Plantillas v2 del contrato + disparador nuevo + prueba con reserva real | Medio (validar merge tags) |
| 4 | **En paralelo con la Fase 2** (no después de la 3): onboarding TWC al TMS en cuanto el pipeline nuevo tenga oportunidades reales — fila en `agencies` + extender `getTokenForLocation` en tms-agencias (hoy solo reconoce el tenant Travelto) + scripts de campos puente + Custom Menu Link + webhook. Cuanto antes entre, antes los abonos reales dejan de registrarse en Pago 1–4 y menos hábito hay que desaprender | Bajo-medio (cambio de código en TMS, ~1 tarde) |
| 5 | Histórico (opcional, script) + retirar carpetas viejas (`ZZ obsoleto` 1 mes → borrar) | Bajo |

### 8b. Fase 0 — checklist de inventario (manual, en la UI de GHL)

Inventario por API del 2026-08-25: **40 workflows** (34 published) y **5 formularios**. Los que hay que abrir y auditar (Automation → Workflows), anotando *disparador* y *campos que lee/escribe*:

**Grupo A — contrato (críticos para Fase 3):**
- [ ] `Envio de Contrato` — confirmar que dispara con "ENVIAR CONTRATO?" y qué plantilla envía.
- [ ] `Notificación Contrato Firmado`
- [ ] `Documentacion`

**Grupo B — atados a etapas del pipeline viejo (definen las etapas del pipeline nuevo):**
- [ ] `1.-Nuevo Lead (Actualización den Pipeline)` (draft), `2.-Calificado por Bot (Actualización en Pipeline)`, `4.-Contactado`, `5.- Cotización en Proceso`, `6.- Cotización enviada`, `7.- En Seguimiento`, `8.- Cierre Ganado`, `9.- Cierre Perdido`, `10.- Cierre Abandonado`, `Ganado / Abonado`, `Compro`.

**Grupo C — dependen de la fecha de viaje en el CONTACTO (⚠️ riesgo principal):**
- [ ] `45 días antes de viaje`, `30 días antes de viaje`, `15 días antes de viaje`, `7 dias antes de viaje`, `2 Dias antes del viaje`, `4.-En Viaje`, `5.-Termino su viaje`.
- Casi seguro disparan con el campo de contacto `fecha_de_ida` (CPA-Fecha de Ida). Si las reservas nuevas solo llenan la fecha en la oportunidad, **estos workflows nunca disparan para ellas**. Mitigación transicional: el pipeline nuevo mantiene una copia de la fecha de ida en el contacto (un paso extra en un workflow al ganar la venta) hasta que el TMS asuma los recordatorios.

**Grupo D — infra del bot y asignación (solo confirmar que no tocan campos de reserva):**
- [ ] `Sol Webhook`, `Stop/Active Bot`, `Asignación a Usuario (B2B & B2C)`, `Asignar Lead a Usuario Creador`, `Nombre de usuario`, `Flujo de actualizacion de compardores.`, `Asignar followers a proovedores`.

**Formularios (Sites → Forms):** `Pasaportes form, para landing de oferta flash panama` (escribe los FILE_UPLOAD de pasaportes en contacto — se queda así, es el buzón), `Eventos Presenciales QR`, `Tu aventura a Panamá empieza aquí ✈️`, `Malos Reviews Form`, `Marketing Form - Claim Offer`.

Los de reviews (`Good/Bad Review Submited`, `Picture Review`, `6.-Solicitar Review`) y marketing (`Flash Sale - Panama`, `WH-Evento LP form.`, `web-webhook`, `pruebas`, `Lead No Response Alert`) no tocan campos de reserva — no requieren auditoría, solo verificación rápida.

## 9. Riesgos y verificaciones pendientes

- [ ] Confirmar que Documents resuelve `{{opportunity.*}}` en el flujo de envío elegido (prueba piloto Fase 3 — bloqueante del cutover del contrato).
- [ ] Inventario Fase 0 de workflows que leen/escriben los campos viejos (no listable por API).
- [ ] Lista final de etapas del pipeline nuevo con el equipo.
- [ ] En tms-agencias: extender `lib/ghl/client.ts getTokenForLocation` (env vars del 2º tenant o tokens en BD).
- [ ] `MONETORY` (sic) es el dataType real de campos monetarios en la API.
- [ ] El search de oportunidades devuelve custom fields en formato distinto al GET por id (`fieldValueString/Number/Date`, fechas epoch ms) — relevante para cualquier script del histórico.
- [ ] Paginación de `/opportunities/search` por cursor (`startAfter`/`startAfterId`); `page=N` está rota.

## 10. Fuentes

- Dump de campos: API `GET /locations/RMFUo0i4KOVl7eZHEn7s/customFields` (2026-08-25; 218 contacto / 0 oportunidad; 17 folders).
- Plantillas y contratos: `GET /proposals/templates` y `GET /proposals/document` (2026-08-25).
- Informe técnico del TMS: sesión del repo `tms-agencias` (2026-08-25) — gobernanza, catálogo de campos por nombre, campos puente, hallazgos de API.
- Mapa previo de la subcuenta: `docs/ghl-twc-mapa.md`.
