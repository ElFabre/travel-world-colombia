-- ============================================================
-- Travel World Colombia — Itinerario día a día
-- Migración 009: columna `itinerario` en destinos
-- ============================================================
-- Cada elemento del array es un día del viaje (el número de día
-- sale de la posición): [{titulo, badge, descripcion}]
--   titulo      → "Arribo y bienvenida"
--   badge       → etiqueta opcional, ej. "Cena incluida"
--   descripcion → texto corto del día
--
-- IMPORTANTE: aplicar en producción ANTES de desplegar el panel
-- con el editor de itinerario (si no, guardar un viaje fallará
-- con "Could not find the 'itinerario' column").

alter table destinos add column if not exists itinerario jsonb;
