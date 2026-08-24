-- Migración 015: cruceros
-- Un crucero es un "destino" completo (fotos, itinerario, precio, cotizar) pero
-- se lista en /cruceros aparte y se EXCLUYE de /destinos. Se marca con un flag.
alter table destinos add column if not exists es_crucero boolean not null default false;
