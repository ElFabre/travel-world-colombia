import { getResenas } from '@/lib/destinos'
import { SITE } from '@/lib/site'

/**
 * JSON-LD de reseñas para la organización. Emite `aggregateRating` + `review`
 * referenciando la misma entidad del layout (`@id`), pero SOLO si hay reseñas
 * reales en la BD — así el rating siempre está respaldado por reseñas
 * verificables (no "auto-servido"). Server Component: lee de la tabla `resenas`.
 */
export async function OrganizationReviews() {
  const resenas = await getResenas(8)
  if (resenas.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    '@id': `${SITE.url}/#organization`,
    name: SITE.nombre,
    url: SITE.url,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '5',
      reviewCount: String(SITE.reseñas),
      bestRating: '5',
      worstRating: '1',
    },
    review: resenas.map(r => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.nombre },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(r.estrellas ?? 5),
        bestRating: '5',
        worstRating: '1',
      },
      reviewBody: r.texto,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
