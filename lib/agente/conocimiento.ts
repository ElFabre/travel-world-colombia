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
/**
 * Recorta un texto largo. El catálogo entero viaja en CADA mensaje, así que
 * cada carácter se paga muchas veces: los muros de texto de "incluye" (que en
 * algunos programas pasan de 1.000 caracteres) se resumen. Si un cliente pide
 * el detalle exacto, Sol escala — que es lo correcto de todos modos.
 */
function recortar(texto: string, max: number): string {
  const limpio = texto.replace(/\s+/g, ' ').trim()
  return limpio.length <= max ? limpio : `${limpio.slice(0, max).trimEnd()}…`
}

export async function construirConocimiento(): Promise<string> {
  const [destinos, faqs] = await Promise.all([getDestinos(), getFaqs()])

  const catalogo = destinos
    .map(d => {
      const partes = [
        `### ${d.nombre}${d.nombre_local ? ` (${d.nombre_local})` : ''}`,
        `- slug: ${d.slug} · país: ${d.pais}${d.region ? ` · región: ${d.region}` : ''}`,
        d.precio_desde ? `- precio desde: ${d.precio_desde}` : '- precio: no publicado (lo confirma una asesora)',
        d.duracion ? `- duración: ${d.duracion}` : null,
        d.descripcion ? `- descripción: ${recortar(d.descripcion, 320)}` : null,
        d.incluye?.length ? `- incluye: ${recortar(d.incluye.join(' · '), 400)}` : null,
        d.no_incluye?.length ? `- NO incluye: ${recortar(d.no_incluye.join(' · '), 200)}` : null,
        d.itinerario?.length
          ? `- itinerario: ${d.itinerario.map((x, i) => `D${i + 1} ${x.titulo}`).join(' | ')}`
          : null,
        d.highlights?.length
          ? `- experiencias: ${d.highlights.map(h => h.titulo.trim() + (h.precio ? ` (${h.precio})` : '')).join(' · ')}`
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
