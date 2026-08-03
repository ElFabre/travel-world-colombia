import { getDestinos } from '@/lib/destinos'
import { getFaqs } from '@/lib/faqs'
import { SITE } from '@/lib/site'

/**
 * Base de conocimiento de Sol: el catálogo real de viajes y las FAQ, leídos en
 * vivo de Supabase. No hay sincronización ni copias: si el cliente edita un
 * programa en el panel, Sol lo sabe en la siguiente conversación.
 *
 * Con ~11 destinos el catálogo entero cabe en el prompt, así que no hace falta
 * RAG. El texto que genera esta función es la parte estable del prompt y se
 * cachea (ver `lib/agente/claude.ts`).
 */
export async function construirConocimiento(): Promise<string> {
  const [destinos, faqs] = await Promise.all([getDestinos(), getFaqs()])

  const catalogo = destinos
    .map(d => {
      const partes = [
        `### ${d.nombre}${d.nombre_local ? ` (${d.nombre_local})` : ''}`,
        `- slug: ${d.slug} · país: ${d.pais}${d.region ? ` · región: ${d.region}` : ''}`,
        d.precio_desde ? `- precio desde: ${d.precio_desde}` : null,
        d.duracion ? `- duración: ${d.duracion}` : null,
        d.descripcion ? `- descripción: ${d.descripcion}` : null,
        d.incluye?.length ? `- incluye: ${d.incluye.join(' · ')}` : null,
        d.no_incluye?.length ? `- NO incluye: ${d.no_incluye.join(' · ')}` : null,
        d.itinerario?.length
          ? `- itinerario: ${d.itinerario.map((x, i) => `Día ${i + 1}: ${x.titulo}`).join(' | ')}`
          : null,
        d.highlights?.length
          ? `- experiencias: ${d.highlights.map(h => h.titulo + (h.precio ? ` (${h.precio})` : '')).join(' · ')}`
          : null,
        `- página: ${SITE.url}/destinos/${d.slug}`,
      ]
      return partes.filter(Boolean).join('\n')
    })
    .join('\n\n')

  const preguntas = faqs.length
    ? faqs.map(f => `**${f.pregunta}**\n${f.respuesta}`).join('\n\n')
    : '(sin preguntas frecuentes publicadas)'

  return `## Catálogo de viajes (${destinos.length} programas activos)

Estos son los ÚNICOS programas que la agencia vende. Si preguntan por un
destino que no está aquí, NO lo inventes: se puede armar a medida, y eso lo
cotiza una asesora.

${catalogo}

## Preguntas frecuentes

${preguntas}

## Datos de la agencia

- Nombre: ${SITE.nombre} (RNT ${SITE.rnt})
- Web: ${SITE.url} · Correo: ${SITE.email}
- Dirección: ${SITE.direccion}, ${SITE.ciudad}, ${SITE.region}
- Horario de atención (hora de Colombia): ${SITE.horario}
`
}
