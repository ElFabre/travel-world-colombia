# Módulo 6 — Reglas de oro, prohibidos y certificación

> Objetivo: cerrar el curso con las reglas que protegen las automatizaciones,
> limpiar los datos de prueba y certificar a cada persona del equipo.

## Lección 6.1 — Las reglas de oro (resumen de todo el curso)

1. **El contacto es la persona; la tarjeta es el viaje.** Una tarjeta por
   viaje, nunca se recicla. Cliente que repite = tarjeta nueva, historial
   intacto.
2. **La reserva llega sola.** Nunca crees a mano la tarjeta en Reservaciones:
   marca ✅ Ganada y espera unos segundos.
3. **Ante dos campos gemelos, gana la tarjeta.** Los campos viejos del
   contacto (`CPA-`, `T1-`, `P1-`…) están en retiro: no se usan para reservas
   nuevas.
4. **Primero los datos, después la etapa.** Mover de etapa dispara
   automatizaciones que leen lo que escribiste — especialmente
   📤 Contrato Enviado.
5. **La etapa siempre dice la verdad.** El tablero es cómo la agencia ve el
   negocio en tiempo real.
6. **Todo pendiente tiene tarea con fecha.** Y todo cierre (ganado o perdido)
   tiene su motivo.
7. **Deja trabajar a Sol** hasta que califique; cuando tú entras al chat, el
   chat es tuyo.

## Lección 6.2 — Los prohibidos (esto rompe cosas de verdad)

- ⛔ **Crear o mover tarjetas en "🛫 Clientes Viajando"**: ese pipeline viejo
  está **congelado**. Los viajes que ya están ahí terminan ahí, y se acabó.
- ⛔ **Crear tarjetas a mano en Reservaciones** (duplica reservas).
- ⛔ **Quitar o poner tags del sistema** (`stop_bot`,
  `transferencia a humano`, `sol_calificado`, `lead_sin_respuesta`) sin saber
  exactamente qué disparan.
- ⛔ **Llenar campos viejos del contacto** para reservas nuevas.
- ⛔ **Borrar contactos o tarjetas** — un cierre es Perdida/Cancelada con
  motivo, no un borrado.
- ⛔ **Activar respuestas automáticas en el celular de WhatsApp** de la
  agencia (apaga a Sol en cadena — ya ocurrió).
- ⛔ **Atender clientes por fuera de la plataforma** (WhatsApp personal,
  notas de papel): lo que no está en la plataforma no existe.

Si algo de esto pasó por accidente: **no intentes deshacerlo en silencio** —
avisa a Fabrizio. Casi todo tiene arreglo si se sabe a tiempo.

## Lección 6.3 — Limpieza de los datos de prueba

Al terminar los ejercicios, cada persona borra SU rastro de prueba:

1. Verifica que tus tarjetas de prueba (Leads y Reservaciones) pertenecen al
   contacto `PRUEBA - <tu nombre>` — solo a ese.
2. Borra las tarjetas de prueba y luego el contacto de prueba (única excepción
   a la regla de "no borrar": los datos de práctica sí se limpian).
3. Confirma en el feed que quedaste limpio.

## Lección 6.4 — Checklist de certificación

Publica en el feed un post con este checklist marcado. Fabrizio valida contra
lo que quedó registrado en la plataforma durante tus ejercicios:

- [ ] Expliqué con mis palabras la diferencia contacto / tarjeta / conversación (M0)
- [ ] Encontré el resumen de Sol de un lead calificado antes de contactarlo (M1)
- [ ] Sé qué pasa cuando respondo un chat que Sol venía atendiendo (M1)
- [ ] Sé por qué a los leads de Instagram se les responde dentro de 24 h (M1)
- [ ] Mi contacto de prueba nació con tarjeta automática en 🆕 Lead Nuevo (M2)
- [ ] Moví mi tarjeta por el tramo humano y la marqué ✅ Ganada (M2)
- [ ] Vi la MISMA tarjeta llegar sola a 📋 Reserva Creada (M2)
- [ ] Llené campos del viaje en las carpetas de la TARJETA, no del contacto (M3)
- [ ] Creé una segunda tarjeta al mismo contacto (cliente repetidor) (M3)
- [ ] Creé una tarea con fecha y la completé cuando me recordó (M4)
- [ ] Moví a 📤 Contrato Enviado y verifiqué la copia de la fecha de viaje (M5)
- [ ] Sé recitar los 7 prohibidos (M6)
- [ ] Limpié mis datos de prueba (M6)

**Cuando todo el equipo esté certificado**, la agencia pasa a la siguiente
fase: se retiran los campos viejos del contacto y entra el contrato nuevo que
se genera solo desde la tarjeta. Este curso queda en la comunidad como manual
permanente — y todo cambio futuro de la plataforma se anuncia aquí.
