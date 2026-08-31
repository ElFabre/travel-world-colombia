import type { Metadata } from 'next'
import { LegalShell, LegalP, LegalList, LegalAviso } from '@/components/legal/LegalShell'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Código de Conducta del Turista Responsable',
  description: `Código de conducta del turista responsable de ${SITE.nombre} — recomendaciones para viajar con respeto por las comunidades, la cultura y el medio ambiente.`,
  alternates: { canonical: '/codigo-de-conducta' },
}

export default function CodigoDeConductaPage() {
  return (
    <LegalShell
      tag="Turismo responsable"
      titulo={
        <>
          Código de conducta del{' '}
          <span style={{ color: 'var(--orange)' }}>turista responsable</span>
        </>
      }
      intro="Viajar es un privilegio que trae consigo una responsabilidad: cuidar los lugares y las personas que nos reciben. Estas son nuestras recomendaciones para cada viajero."
    >
      <LegalList
        items={[
          'Infórmese de las tradiciones y prácticas socioculturales del lugar a visitar y demuestre respeto por sus leyes y costumbres. Esto beneficiará su experiencia y le ayudará a obtener un mejor acogimiento de las comunidades locales.',
          'Su viaje puede contribuir al desarrollo económico y social: compre artesanía y productos locales para apoyar la economía del lugar, y aténgase a los principios del comercio justo.',
          'Respete las manifestaciones y costumbres de la localidad. Demuestre solidaridad y tolerancia hacia la comunidad y tenga un trato amable y respetuoso hacia residentes, guías, prestadores de servicios y la población en general.',
          'Evite cualquier acto considerado criminal o delictivo por las leyes del sitio turístico, así como comportamientos que puedan resultar chocantes o hirientes para la población local o dañar el entorno.',
          'Respete los derechos humanos. Cualquier forma de explotación vulnera los objetivos fundamentales del turismo.',
          'Ayude a conservar el entorno natural: proteja la flora y la fauna silvestre y su hábitat.',
          'Compre productos que no requieran para su elaboración el uso de plantas o animales en peligro de extinción.',
          'Reduzca el consumo de agua y electricidad en el sitio de alojamiento: apague las luces y cierre las llaves del agua cuando no las necesite.',
          'Reduzca, reutilice y recicle los residuos sólidos durante su viaje: lleve su propia botella de agua para rellenar, evite productos con envoltorios innecesarios y no acepte bolsas plásticas para compras que pueda transportar de otro modo.',
        ]}
      />

      <LegalAviso>
        La explotación sexual de niños, niñas y adolescentes es un delito punible, tanto en
        el lugar donde se cometa como en el país de residencia de quien lo cometa. En
        cumplimiento de las Leyes 679 de 2001 y 1336 de 2009, {SITE.nombre} rechaza la
        ESCNNA y colabora con las autoridades para su prevención y denuncia.
      </LegalAviso>

      <LegalP>
        Gracias por viajar con conciencia. Un turista responsable regresa a casa con más que
        fotos: deja comunidades más fuertes y paisajes intactos para quienes vienen detrás.
      </LegalP>
    </LegalShell>
  )
}
