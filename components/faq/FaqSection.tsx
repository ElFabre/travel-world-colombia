import { ChevronDown } from 'lucide-react'
import { getFaqs } from '@/lib/faqs'
import { SectionTag } from '@/components/ui/SectionTag'

/**
 * Sección de preguntas frecuentes — acordeón visible + JSON-LD (FAQPage).
 * Server Component: lee las FAQ activas desde la BD (panel admin) y renderiza
 * ambos a la vez, de modo que lo que se ve y lo que indexa Google siempre
 * están sincronizados. Usa <details> nativo (sin JS de cliente).
 */
export async function FaqSection() {
  const faqs = await getFaqs()
  if (faqs.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.pregunta,
      acceptedAnswer: { '@type': 'Answer', text: f.respuesta },
    })),
  }

  return (
    <section aria-labelledby="faq-title" className="px-6 py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <SectionTag className="mb-3">Preguntas frecuentes</SectionTag>
          <h2
            id="faq-title"
            className="font-plus-jakarta text-3xl font-bold sm:text-4xl"
            style={{ color: 'var(--text-primary)' }}
          >
            Resolvemos tus dudas
          </h2>
        </div>

        <ul className="flex flex-col gap-3">
          {faqs.map(f => (
            <li key={f.id}>
              <details
                className="group rounded-xl"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)' }}
              >
                <summary
                  className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-plus-jakarta text-sm font-bold [&::-webkit-details-marker]:hidden"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {f.pregunta}
                  <ChevronDown
                    size={18}
                    className="shrink-0 transition-transform duration-200 group-open:rotate-180"
                    style={{ color: 'var(--orange)' }}
                  />
                </summary>
                <p
                  className="px-5 pb-5 font-inter text-sm leading-relaxed"
                  style={{ color: 'var(--text-dim)', lineHeight: '1.8' }}
                >
                  {f.respuesta}
                </p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
