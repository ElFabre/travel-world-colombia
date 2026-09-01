-- 016: Precio estructurado (P2) — valor numérico + moneda + nota.
--
-- `precio_desde` (texto libre) SE CONSERVA: lo lee el agente Sol
-- (lib/agente/conocimiento.ts) y sirve de fallback en la web y de rollback.
-- Desde el panel ahora se edita el precio estructurado y precio_desde se
-- regenera como texto derivado al guardar (app/admin/destinos/actions.ts).

alter table destinos
  add column if not exists precio_valor numeric,
  add column if not exists precio_moneda text check (precio_moneda in ('COP', 'USD')),
  add column if not exists precio_nota text;

comment on column destinos.precio_valor is 'Precio "desde", solo el número (1290000 COP / 1290 USD)';
comment on column destinos.precio_moneda is 'COP o USD';
comment on column destinos.precio_nota is 'Condición del precio: acomodación, temporada, etc.';
comment on column destinos.precio_desde is 'LEGADO: texto libre. Derivado del estructurado al guardar desde el panel; lo lee el agente Sol.';

-- Backfill desde el texto libre existente (estado al 2026-08-28, 25 destinos
-- con precio; los 9 sin precio quedan null). Interpretaciones asumidas:
--   · peru-sonado "1.161 en Acomodación triple" → USD (los planes de Perú se
--     venden en USD; 1.161 COP sería absurdo). REVISAR con el equipo.
--   · perlas-del-caribe tiene doble precio → valor = múltiple ($900.000),
--     la acomodación doble va en la nota. REVISAR con el equipo.
update destinos d
set precio_valor  = v.valor,
    precio_moneda = v.moneda,
    precio_nota   = v.nota
from (
  values
    ('peru-al-completo',          2153::numeric,     'USD', 'Acomodación triple'),
    ('solo-cusco',                775::numeric,      'USD', null),
    ('panama',                    2800000::numeric,  'COP', null),
    ('quindio-cali',              1279000::numeric,  'COP', null),
    ('mexico-esencial',           385::numeric,      'USD', null),
    ('perudecolores',             984::numeric,      'USD', 'Acomodación triple'),
    ('festivalfaroles',           1098000::numeric,  'COP', null),
    ('peru-a-su-medida',          771::numeric,      'USD', 'Acomodación triple'),
    ('peru-sonado',               1161::numeric,     'USD', 'Acomodación triple'),
    ('plan-mercados-europa',      12699000::numeric, 'COP', null),
    ('estados-unidos',            1290::numeric,     'USD', null),
    ('sangil',                    1149000::numeric,  'COP', null),
    ('republica-dominicana',      2900000::numeric,  'COP', null),
    ('espana',                    1690::numeric,     'USD', null),
    ('brasil',                    1090::numeric,     'USD', null),
    ('japon',                     3290::numeric,     'USD', null),
    ('paris',                     1890::numeric,     'USD', null),
    ('santorini',                 2290::numeric,     'USD', null),
    ('eje-cafetero',              1100000::numeric,  'COP', null),
    ('guajira-cabo-de-la-vela',   1799000::numeric,  'COP', null),
    ('medellin-hacienda-napoles', 1279000::numeric,  'COP', null),
    ('quindio-y-antioquia',       1279000::numeric,  'COP', null),
    ('doradal-aventura-salvaje',  930000::numeric,   'COP', null),
    ('sur-de-colombia',           2159000::numeric,  'COP', null),
    ('perlas-del-caribe',         900000::numeric,   'COP', 'Acomodación múltiple · en doble $960.000')
) as v(slug, valor, moneda, nota)
where d.slug = v.slug
  and d.precio_valor is null; -- idempotente: no pisa valores ya cargados
