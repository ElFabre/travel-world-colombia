-- Migración 014: categorías de destinos
-- Facetas nuevas para la taxonomía de /destinos:
--   * transporte      → agrupa los NACIONALES (Colombia) en "En bus" / "En avión"
--   * salida_fin_ano  → flag para "Salidas confirmadas fin de año" (chip de filtro)
-- Las demás facetas ya existen: pais, region (continente en internacionales) y
-- destacado (= "Favoritos").

alter table destinos add column if not exists transporte text;
alter table destinos add column if not exists salida_fin_ano boolean not null default false;

-- Solo valores válidos (o null si no aplica: los internacionales no lo usan).
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'destinos_transporte_check'
  ) then
    alter table destinos
      add constraint destinos_transporte_check
      check (transporte is null or transporte in ('bus', 'avion'));
  end if;
end $$;

-- Limpieza: Perú no tenía región → Suramérica (para agruparlo en internacionales).
update destinos set region = 'Suramérica'
where pais = 'Perú' and (region is null or btrim(region) = '');
