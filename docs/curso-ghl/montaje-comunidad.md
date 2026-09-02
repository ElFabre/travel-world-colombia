# Montaje del curso en la Comunidad de GHL

> Pasos para crear la comunidad y cargar el curso en la subcuenta de TWC
> (`RMFUo0i4KOVl7eZHEn7s`). Las comunidades y cursos **no tienen API pública**
> confiable para crearse: esto se hace en la UI de GHL. Los textos de las
> lecciones se copian de los archivos `modulo-N-*.md` de esta carpeta.

## 1. Crear el grupo

1. En la subcuenta TWC: **Memberships → Communities → Create Group** (según la
   versión de la UI puede aparecer como **Sites → Communities**).
2. Nombre: **Academia TWC** · Descripción: "Capacitación interna en nuestra
   plataforma. De cero a cien." · Grupo **privado** (solo invitados).
3. Subir un banner con la marca (sin naranja — paleta del manual: amarillo
   oscuro / azul claro).

## 2. Invitar al equipo

Invitar por correo a: Alejandra Mayorga, Johana Lozano, Ginna Cardenas,
Juan Camilo Gomez, Luisa Aguirre, Lynda Quintero, Maria Pilar Copete,
Milena Cardenas (facturación), Oscar Cosio y Mauricio (marketing).
Los usuarios ya existen en la subcuenta (IDs en `docs/ghl-twc-mapa.md`).

## 3. Crear el curso en la pestaña Learning

1. Dentro del grupo: pestaña **Learning → + Add Course**.
2. Título: **GHL de cero a cien** · Descripción: "Cómo trabajamos en la
   plataforma: conversaciones, embudo, tarjetas, tareas y post-venta."
3. Crear **7 módulos** (uno por archivo `modulo-N-*.md`, en orden) y dentro de
   cada módulo una lección por cada `## Lección` del archivo. El editor acepta
   texto enriquecido: pegar el contenido, respetar negritas y listas.
4. En el módulo 2, incrustar la guía visual del embudo: exportar el Artifact
   "Embudo TWC" a imagen/PDF (o capturas por sección) y subirlas a la lección 2.1.
5. Marcar el curso con **progresión lineal** si la opción existe (cada módulo
   desbloquea el siguiente): fuerza el orden de cero a cien.

## 4. El feed del grupo

- Post fijado de bienvenida: qué es la academia, en qué orden tomar el curso, y
  que las dudas van como comentarios o posts en el feed (no por WhatsApp — así
  la respuesta queda para todo el equipo).
- Canal para anuncios de cambios de la plataforma (p. ej. cuando entre el
  contrato v2 se anuncia aquí).

## 5. Ejercicios y certificación

- Cada módulo cierra con un ejercicio sobre un contacto de prueba
  (`PRUEBA - <nombre>` + tag `pruebas`). El módulo 6 explica cómo crearlo y
  cómo limpiar al terminar.
- El checklist de certificación (módulo 6) se responde como **post en el feed**
  por cada persona ("Completé el checklist: …") y Fabrizio lo valida viendo las
  tarjetas de prueba en GHL.
- Cuando TODO el equipo esté certificado → se desbloquea la **Fase 5** de la
  migración (borrado de campos viejos) y el **contrato v2**.

## Notas

- La UI de Communities cambia seguido; si un paso no coincide, el concepto se
  mantiene: grupo privado → curso → módulos → lecciones.
- Si la subcuenta no tiene Communities habilitado, activarlo desde la agencia
  (labs/feature flags) o usar Memberships → Courses como plan B (misma
  estructura de contenido).
