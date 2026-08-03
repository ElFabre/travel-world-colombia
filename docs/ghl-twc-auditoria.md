# Auditoría de la subcuenta GHL — Travel World Colombia

> 2026-07-31, vía API con `GHL_TWC_PIT`. Complementa `docs/ghl-twc-mapa.md`.
> Muestras: 300 oportunidades más recientes del pipeline principal, 100 contactos
> más recientes, conversaciones no leídas. La API no expone los pasos internos de
> los workflows (solo nombre/estado/versión).

## Números globales

- **6.426 contactos** · **1.777 conversaciones** · **1.385 oportunidades** (1.183 open, 104 won, 7 lost, 91 abandoned)
- **170 conversaciones sin leer (~10%)** — la más vieja lleva **156 días**; las 10 más viejas son todas *inbound* (clientes que escribieron y nadie leyó).

## Embudo (PIPELINE PRINCIPAL)

| Etapa | Opps | Señal |
|---|---|---|
| Lead Nuevo | **512** | 43% de todo lo abierto. En la muestra reciente: mediana **18 días** sin moverse, **0/181 con valor monetario** |
| Calificado por Bot | **0** | La etapa del bot está VACÍA — nadie califica |
| Asignado a Agente | **325** | Segundo estacionamiento. 70/93 recientes sí tienen valor |
| Contactado → Documentacion | 136 | El "medio" del embudo es delgado pero se mueve |
| Cerrado Ganado | 120 | — |
| Cierre Perdido / Abandonado | 96 | — |

**Diagnóstico:** el embudo es un embudo solo de nombre — es un **estacionamiento
en la entrada**. Los leads entran a "Lead Nuevo", nadie/nada los califica (la
etapa del bot en 0 delata que Sol no está calificando o el workflow salta la
etapa), y pasan en bloque a "Asignado a Agente" donde otros 325 esperan.

## Inconsistencia etapa ↔ status

- Etapa "Cerrado Ganado" tiene 120 opps pero solo **104 tienen status `won`**.
- Etapa "Cierre Perdido" tiene 74 pero solo **7 con status `lost`**; `abandoned` = 91 vs etapa "Cierre Abandonado" = 22.

Los reportes nativos de GHL (win rate, forecast, pie del funnel) usan el status →
**hoy los reportes mienten** (7 perdidos "oficiales" contra 74 reales).

## Calificación real de leads (últimos 100 contactos)

| Campo | Llenado |
|---|---|
| IA - NOMBRE | 41% |
| Ciudad de Salida | 40% |
| Cantidad de Adultos | 34% |
| Destino Principal | 31% |
| Presupuesto Estimado | 28% |
| Mensaje de cotización | **0%** |
| Fecha de Viaje (texto) | **0%** |
| Fuente de Lead | **0%** |

El bot actual llena parcialmente los campos en menos de la mitad de los leads y
**ningún** campo de fecha de viaje se usa (existiendo 3 campos de fecha de viaje).
Tags dominantes en leads nuevos: ruido de sistema (`wa: +573204891930` 85%,
`another-device-replied-whatsapp` 36%) + `new_lead` 82%.

## Conversaciones

- El equipo responde **desde el celular** ("Sent from another device") — funciona,
  pero significa que la atención vive fuera de GHL y explica las 170 no-leídas:
  el inbox de GHL no es la fuente de verdad para nadie.
- El mismo canal mezcla **B2C (ventas), B2B (mayoristas/proveedores) y post-venta**
  en una sola bandeja. Existen tags `[device] - mayorista b2b` / `b2c` pero en la
  muestra reciente casi no se aplican.

## Estructura — lo que está BIEN ✅

- Pipelines bien diseñados conceptualmente (ventas 13 etapas + journey post-venta).
- Convención de bot ya montada: etapa "Calificado por Bot", tags `stop_bot` /
  `transferencia a humano`, workflow "Stop/Active Bot".
- Automatización post-venta completa (45/30/15/7/2 días, en viaje, terminó, reviews).
- Máquina de reviews (solicitar / buena / mala / con foto) y contratos con firma
  (workflow "Envio de Contrato" v49 — el más maduro).
- Campos organizados en carpetas temáticas coherentes.

## Estructura — lo que está MAL ❌

1. **0 campos de oportunidad, ~150 de contacto.** Datos que son POR VIAJE
   (pasajeros P1–P8, pagos P1–P4, trayectos T1–T4, contrato, tarifas) viven en el
   contacto → un cliente que repite compra **sobrescribe** los datos del viaje
   anterior. Deberían ser campos de oportunidad.
2. **Campos duplicados:**
   - 3 fechas de viaje: `fecha_de_vije` (TEXT, typo), `fecha_estiada_de_viaje`
     (DATE, typo), `fecha_de_viaje_operaciones` (DATE) — y ninguna se llena.
   - 2 sets de subida de pasaportes: "Pasajero N Pasaporte" (1–6) y
     "Pasaporte - Pasajero N" (1–4).
   - ~6 formas de contar pasajeros: `cantidad_de_adultos`, `cantidad` (vuelos),
     `cuantas_personas_viajaran`, `numero_de_pasajeros`, `c__numero_de_pasajeros`,
     `total_pasajeros` + duplicado TEXT `total_pasajeros__cantidad`.
   - "Total Pasajeros - Valor Total" existe como NUMERICAL y como TEXT.
3. **"Etapa del Lead" (CHECKBOX)** duplica las etapas del pipeline con nombres
   divergentes ("Recopilación de Documentos" vs "Documentacion", "Cierre Ganado"
   vs "Cerrado Ganado") y al ser checkbox permite varios estados a la vez.
   Dos fuentes de verdad = ninguna.
4. **Typos** en nombres y keys: Vijae, Docuemnto, Dcoumento, Toltal, estiada,
   Perosnas, proovedores, compardores. (Renombrar el *nombre* es seguro; el
   fieldKey no cambia.)
5. **Tags sin convención**: mezcla de espacios/guiones/underscores/corchetes;
   tags de prueba en producción (`pruebas`, `pruebas_fabrizio`,
   `review-solicitada-test`); tag por asesora duplicando la asignación de
   usuario nativa de GHL.
6. **Workflows**: numeración colisionada entre pipelines (dos "4.-", dos "5.-",
   dos "6.-"); no existe "3.-" (¿Asignado a Agente?); basura publicada
   (`pruebas`) y drafts sin nombre ("New Workflow : 1783703028705").

## Recomendaciones priorizadas

### Ya — impacto directo en ventas
1. **Triaje de las 170 no-leídas** (las recientes primero: hay de hoy con
   `unread`). Definir dueño del inbox de GHL o asumir que WhatsApp del celular
   es la fuente de verdad y marcar leídas en bloque las >30 días.
2. **Limpiar el estacionamiento**: cerrar en bloque como "Cierre Abandonado"
   (con status `abandoned`) las opps de Lead Nuevo / Asignado a Agente sin
   actividad >60 días. Deja el pipeline legible y los reportes útiles.
3. **Alinear status con etapa** de aquí en adelante: mover a Cerrado Ganado ⇒
   marcar `won`; Cierre Perdido ⇒ `lost` (se puede automatizar en los workflows
   de etapa existentes).

### Cuando entre el agente conversacional (nuestro proyecto)
4. El agente ataca exactamente el cuello detectado: califica en la conversación,
   **llena los campos ⭐ consistentemente** (hoy ≤41%), usa de verdad la etapa
   "Calificado por Bot" (hoy 0) y solo pasa a "Asignado a Agente" leads con
   datos completos + notificación. KPI sugerido: >90% de llenado de
   destino/pax/fecha en leads que conversan.
5. Reusar `stop_bot` / `transferencia a humano` / workflow "Stop/Active Bot".

### Higiene estructural (bajo riesgo, alto orden)
6. Unificar fecha de viaje en UN campo DATE; deprecar los otros 2 (renombrar
   "zz-DEPRECATED …" antes de borrar, por si algún workflow los usa).
7. Consolidar conteos de pasajeros (1 adultos + 1 niños + edades) y un solo set
   de subida de pasaportes.
8. Retirar "Etapa del Lead" o convertirla en espejo automático de la etapa
   (workflow), nunca editable a mano.
9. Convención de tags (`snake_case`, prefijos `bot_`, `b2b_`…), borrar tags de
   prueba, documentar los de sistema.
10. Renombrar/archivar workflows basura y renumerar por pipeline (V1…V10 ventas,
    P1…P9 post-venta) para que el número no colisione.
11. Plan a mediano plazo: mover datos por-viaje a campos de **oportunidad**
    (GHL los soporta; hoy hay 0) para clientes recurrentes.

## Adenda: comportamiento del bot actual ("Sol") en conversaciones reales

Leídas vía API (2026-07-31). Sol es un **AI Employee de GHL** (los "Employee
action log created" en el hilo lo delatan). La sección de Agentes de IA no es
accesible por API (endpoint `/conversations/ai-agents` responde 400 sin detalle)
— su configuración solo se ve en la UI.

**Caso 1 — lead calificado PERDIDO por rigidez (Milena):** la clienta dio
destino (Bogotá→Madrid), fechas exactas, 1 pasajero, 1 habitación y presupuesto
(8M) — calificación COMPLETA. Sol insistió una y otra vez en "necesito un rango
mínimo de presupuesto" / "es necesario" en vez de cotizar o escalar. La clienta
se despidió molesta: *"preguntan mucho pero no dicen nada"*. Sol nunca escaló a
un humano ni movió la oportunidad; se despidió y ya.

**Caso 2 — escalada ignorada (Isabel):** pidió explícitamente *"hablar con un
responsable"* y Sol respondió exigiendo destino/fechas/presupuesto. (Sí filtró
bien que era una agencia B2B de India — eso es un acierto.)

**Patrones:**
- Interrogatorio rígido y secuencial (nombre → apellido → ciudad → habitación →
  presupuesto) que fricciona antes de aportar valor.
- La palabra "responsable/asesor/humano" NO dispara la transferencia
  (`transferencia a humano` existe como tag pero no se usa).
- Aun con datos completos, la oportunidad no se mueve a "Calificado por Bot" —
  consistente con la etapa en 0.
- Latencia buena (~1 min) y registra `IA - NOMBRE`.
- Ruido: "Employee action log created" aparece como mensaje outbound en el hilo.

**Implicación para nuestro agente:** las 3 reglas que Sol viola son el corazón
del diseño: (1) escalar SIEMPRE que el cliente lo pida o se frustre, (2) mover
pipeline al calificar, (3) aportar valor (rangos, opciones del catálogo) antes
de exigir el dato siguiente.

## Limitaciones de esta auditoría

- Muestras: últimas 300 opps / últimos 100 contactos (sesgo a lo reciente).
- Sin visibilidad de pasos internos de workflows ni de la configuración del bot
  de zolutium — verificar en la UI el trigger de "Stop/Active Bot" y por qué
  "Calificado por Bot" nunca recibe opps.
