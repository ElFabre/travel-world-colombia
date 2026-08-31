import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP, LegalList, LegalAviso } from '@/components/legal/LegalShell'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Política de Sostenibilidad',
  description: `Política de sostenibilidad de ${SITE.nombre} — compromisos socioculturales, económicos y ambientales de nuestra agencia de viajes en ${SITE.ciudad}. RNT ${SITE.rnt}.`,
  alternates: { canonical: '/sostenibilidad' },
}

export default function SostenibilidadPage() {
  return (
    <LegalShell
      tag="Sostenibilidad"
      titulo={
        <>
          Política de <span style={{ color: 'var(--orange)' }}>sostenibilidad</span>
        </>
      }
      intro={`En ${SITE.nombre} creemos que viajar debe dejar huellas buenas. Estos son los compromisos socioculturales, económicos y ambientales que guían nuestra operación.`}
    >
      <LegalH2>Compromisos socioculturales</LegalH2>
      <LegalList
        items={[
          'Capacitar periódicamente al personal de la agencia de viajes.',
          'Gestionar y prevenir los riesgos sociales asociados a la ESCNNA (explotación sexual comercial de niños, niñas y adolescentes).',
          'Demostrar que nuestros colaboradores declaran su rechazo a la ESCNNA.',
          'Prevenir la explotación laboral infantil.',
          'Informar a clientes y proveedores, a través de medios visibles, acerca de la legislación vigente aplicable relacionada con la ESCNNA.',
        ]}
      />

      <LegalAviso>
        En cumplimiento de las Leyes 679 de 2001 y 1336 de 2009, {SITE.nombre} rechaza y
        advierte que la explotación y el abuso sexual de menores de edad son sancionados
        penal y administrativamente conforme a las leyes colombianas.
      </LegalAviso>

      <LegalH2>Compromisos económicos</LegalH2>
      <LegalList
        items={[
          'Contratar personal directo e indirecto para los servicios prestados por el establecimiento, priorizando proveedores locales.',
          'Promover entre los viajeros las compras de productos nacionales en el destino.',
          'Facilitar medios para que los emprendedores locales desarrollen su actividad y vendan productos basados en los valores naturales, culturales e históricos de la zona.',
          'Incentivar entre los proveedores locales los productos de comercio justo.',
        ]}
      />

      <LegalH2>Compromisos ambientales</LegalH2>
      <LegalList
        items={[
          'Identificar las fuentes de consumo de agua (grifería, aparatos sanitarios y otras) y controlar permanentemente su uso y ahorro.',
          'Controlar permanentemente el uso y ahorro de la energía eléctrica, manteniendo desconectados los aparatos que no estén en uso.',
          'Controlar anualmente el uso de papel en la oficina.',
          'Realizar revisión y mantenimiento a las griferías y aparatos sanitarios.',
          'Realizar campañas de sensibilización con el equipo de colaboradores para el ahorro de agua y energía, verificando mes a mes los consumos.',
          'Aplicar diariamente las 5R (Reusar, Reciclar, Reducir, Rechazar, Recuperar) en todas las actividades de la agencia, revisando anualmente los beneficios obtenidos.',
        ]}
      />

      <LegalH2>Nuestras metas</LegalH2>
      <LegalP>
        Contribuir al fortalecimiento de los aspectos ambientales, culturales y económicos
        de nuestra actividad, divulgando esta política de sostenibilidad de forma permanente
        a clientes, proveedores y prestadores de servicios a través de correo electrónico,
        confirmaciones de compra y redes sociales. Cada seis meses verificamos y aplicamos
        las actualizaciones correspondientes.
      </LegalP>
    </LegalShell>
  )
}
