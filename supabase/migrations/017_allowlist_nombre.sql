-- 017: nombre de la persona en la allowlist del panel.
-- Los correos solos no dicen quién es quién (asesor1, asesor2…); el nombre se
-- muestra en /admin/usuarios y se captura al invitar. Fuente inicial: usuarios
-- de GoHighLevel cruzados por correo.
alter table admin_allowlist add column if not exists nombre text;
