-- ============================================================
-- Travel World Colombia — Preguntas frecuentes
-- Migración 007: Tabla faqs + RLS + seed
-- ============================================================
-- Reemplaza el bloque de FAQ que vivía hardcodeado como JSON-LD en
-- /nosotros. Ahora se administra desde el panel (pestaña "Preguntas
-- frecuentes") y alimenta tanto el acordeón visible como el Schema.org.

create table if not exists faqs (
  id          uuid default gen_random_uuid() primary key,
  pregunta    text not null,
  respuesta   text not null,
  orden       int default 0,
  activa      boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists idx_faqs_activa on faqs (activa);
create index if not exists idx_faqs_orden  on faqs (orden);

-- Reusa la función set_updated_at() definida en 001_schema.sql
drop trigger if exists trg_faqs_updated_at on faqs;
create trigger trg_faqs_updated_at
  before update on faqs
  for each row execute function set_updated_at();

-- ── RLS: lectura pública (solo activas), escritura solo admin ──
alter table faqs enable row level security;

drop policy if exists "faqs_public_read" on faqs;
create policy "faqs_public_read" on faqs
  for select using (activa = true);

drop policy if exists "faqs_admin_all" on faqs;
create policy "faqs_admin_all" on faqs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ── Seed inicial (solo si la tabla está vacía) ──
-- Las 5 preguntas que vivían como JSON-LD en /nosotros, con los valores
-- dinámicos ya resueltos (RNT, dirección, horario, etc.). Se evita
-- incrustar el dominio temporal de Vercel: se referencian las páginas.
insert into faqs (pregunta, respuesta, orden)
select v.pregunta, v.respuesta, v.orden
from (values
  (
    $$¿Travel World Colombia es una agencia legalmente registrada?$$,
    $$Sí. Travel World Colombia está registrada en el Registro Nacional de Turismo con el número RNT 27287, cumpliendo todos los requisitos del Ministerio de Comercio, Industria y Turismo de Colombia.$$,
    1
  ),
  (
    $$¿Dónde están ubicados?$$,
    $$Estamos ubicados en C.C. Manila, Transversal 12 #22-42, Local 126, Fusagasugá, Cundinamarca, Colombia. Atendemos de Lun–Vie 9am–6pm · Sáb 9am–1pm.$$,
    2
  ),
  (
    $$¿Cómo puedo cotizar un viaje?$$,
    $$Puedes cotizar tu viaje de forma gratuita a través de nuestro formulario en la página de Contacto, o escribirnos directamente por WhatsApp al +57 320 489 1930. Respondemos en menos de 24 horas.$$,
    3
  ),
  (
    $$¿Cuántos años de experiencia tienen?$$,
    $$Travel World Colombia tiene más de 5 años de experiencia organizando viajes nacionales e internacionales para familias colombianas, con más de 126 reseñas de 5 estrellas verificadas.$$,
    4
  ),
  (
    $$¿Qué destinos manejan?$$,
    $$Manejamos más de 8 destinos nacionales e internacionales incluyendo República Dominicana, Estados Unidos, España, Panamá, Brasil, Japón, París y Santorini. Consulta todos en nuestra página de Destinos.$$,
    5
  )
) as v(pregunta, respuesta, orden)
where not exists (select 1 from faqs);
