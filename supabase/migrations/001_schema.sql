-- ============================================================
-- Travel World Colombia — Esquema de base de datos
-- Migración 001: Tablas
-- Zona horaria del proyecto: America/Bogota (UTC-5)
-- ============================================================

-- ── Función reutilizable: actualizar updated_at ──
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================
-- Tabla: destinos
-- ============================================================
create table if not exists destinos (
  id              uuid default gen_random_uuid() primary key,
  slug            text unique not null,
  activo          boolean default true,
  destacado       boolean default false,
  orden           int default 0,

  nombre          text not null,
  nombre_local    text,
  pais            text not null,
  region          text,
  frase_hero      text,
  autor_frase     text,
  cargo_autor     text,
  imagen_hero     text,
  imagen_thumb    text,

  subtitulo       text,
  descripcion     text,
  imagen_about    text,
  stats           jsonb,       -- [{num, label}]
  highlights      jsonb,       -- [{icono, titulo, descripcion}]
  galeria         jsonb,       -- [url1..url5]
  info_clave      jsonb,       -- [{icono, label, valor, sub}]

  precio_desde    text,        -- "desde $899 USD"
  incluye         text[],
  no_incluye      text[],
  duracion        text,        -- "8 días / 7 noches"
  cupos_disponibles int,       -- urgency "solo quedan X cupos"

  cta_titulo      text,
  cta_subtitulo   text,
  meta_title      text,
  meta_description text,
  keywords        text[],

  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_destinos_activo    on destinos (activo);
create index if not exists idx_destinos_destacado on destinos (destacado);
create index if not exists idx_destinos_orden     on destinos (orden);

drop trigger if exists trg_destinos_updated_at on destinos;
create trigger trg_destinos_updated_at
  before update on destinos
  for each row execute function set_updated_at();

-- ============================================================
-- Tabla: leads
-- ============================================================
create table if not exists leads (
  id              uuid default gen_random_uuid() primary key,
  nombre          text not null,
  email           text not null,
  telefono        text not null,
  destino_interes text,
  num_personas    int,
  fecha_viaje     text,
  presupuesto     text,
  mensaje         text,
  origen          text default 'web',     -- 'popup', 'form', 'whatsapp'
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  ghl_enviado     boolean default false,
  ghl_contact_id  text,
  created_at      timestamptz default now()
);

create index if not exists idx_leads_created_at on leads (created_at desc);
create index if not exists idx_leads_destino    on leads (destino_interes);

-- ============================================================
-- Tabla: resenas
-- ============================================================
create table if not exists resenas (
  id        uuid default gen_random_uuid() primary key,
  nombre    text not null,
  texto     text not null,
  estrellas int default 5,
  destino   text,
  fecha     text,
  activa    boolean default true,
  orden     int default 0,
  fuente    text default 'google'   -- 'google', 'facebook', 'manual'
);

create index if not exists idx_resenas_activa on resenas (activa);

-- ============================================================
-- Tabla: security_logs (monitoreo — sección 11 del CLAUDE.md)
-- ============================================================
create table if not exists security_logs (
  id         uuid default gen_random_uuid() primary key,
  evento     text not null,  -- 'rate_limit', 'bot_detected', 'admin_login', 'admin_failed'
  ip         text,
  user_agent text,
  detalles   jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_security_logs_evento     on security_logs (evento);
create index if not exists idx_security_logs_created_at on security_logs (created_at desc);
