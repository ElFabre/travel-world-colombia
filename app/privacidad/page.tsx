import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP, LegalList } from '@/components/legal/LegalShell'
import { SITE, WHATSAPP } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: `Política de tratamiento de datos personales de ${SITE.nombre} conforme a la Ley 1581 de 2012 — qué datos recogemos, para qué los usamos y cómo ejercer tus derechos.`,
  alternates: { canonical: '/privacidad' },
}

export default function PrivacidadPage() {
  return (
    <LegalShell
      tag="Privacidad"
      titulo={
        <>
          Política de <span style={{ color: 'var(--orange)' }}>privacidad</span>
        </>
      }
      intro="Tratamos tus datos personales conforme a la Ley 1581 de 2012 y sus decretos reglamentarios (régimen de habeas data en Colombia). Aquí te contamos qué recogemos, para qué y cómo ejercer tus derechos."
    >
      <LegalH2>Responsable del tratamiento</LegalH2>
      <LegalP>
        {SITE.nombre} — Agencia de Viajes y Turismo, RNT {SITE.rnt}. {SITE.direccion},{' '}
        {SITE.ciudad}, {SITE.region}, {SITE.pais}. Correo electrónico:{' '}
        <a
          href={`mailto:${SITE.email}`}
          className="underline transition-colors hover:text-orange"
          style={{ color: 'var(--text-primary)' }}
        >
          {SITE.email}
        </a>{' '}
        · WhatsApp: {WHATSAPP.telefonoDisplay}.
      </LegalP>

      <LegalH2>Datos que recogemos</LegalH2>
      <LegalList
        items={[
          'Datos de identificación y contacto que nos entregas en el formulario de cotización o por WhatsApp: nombre, teléfono, correo electrónico y destino de interés.',
          'Datos necesarios para gestionar una reserva: documento de identidad, fechas de viaje, acompañantes y demás información requerida por aerolíneas, hoteles y operadores.',
          'Datos de navegación recogidos por herramientas de analítica y publicidad (como Google Analytics y el píxel de Meta) cuando visitas nuestro sitio web.',
        ]}
      />

      <LegalH2>Para qué los usamos</LegalH2>
      <LegalList
        items={[
          'Responder tus solicitudes de información y enviarte cotizaciones de nuestros planes.',
          'Gestionar reservas, pagos, cambios y toda la operación de tu viaje con los prestadores de servicios turísticos involucrados.',
          'Enviarte información comercial sobre promociones y nuevos destinos, siempre con la posibilidad de dejar de recibirla cuando lo pidas.',
          'Cumplir obligaciones legales y contables de la agencia.',
        ]}
      />
      <LegalP>
        Compartimos tus datos únicamente con los prestadores necesarios para operar tu viaje
        (aerolíneas, hoteles, operadores, aseguradoras) y con nuestras herramientas de
        gestión de clientes. No vendemos tus datos a terceros.
      </LegalP>

      <LegalH2>Tus derechos como titular</LegalH2>
      <LegalList
        items={[
          'Conocer, actualizar y rectificar tus datos personales.',
          'Solicitar prueba de la autorización otorgada para su tratamiento.',
          'Ser informado sobre el uso que se les ha dado.',
          'Revocar la autorización y/o solicitar la supresión de tus datos cuando no exista un deber legal o contractual que lo impida.',
          'Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones al régimen de protección de datos.',
        ]}
      />
      <LegalP>
        Para ejercer cualquiera de estos derechos escríbenos a{' '}
        <a
          href={`mailto:${SITE.email}`}
          className="underline transition-colors hover:text-orange"
          style={{ color: 'var(--text-primary)' }}
        >
          {SITE.email}
        </a>{' '}
        indicando tu nombre, tu solicitud y un medio de contacto. Responderemos dentro de
        los términos que establece la ley.
      </LegalP>

      <LegalH2>Vigencia</LegalH2>
      <LegalP>
        Esta política rige desde su publicación y permanecerá vigente mientras la agencia
        realice tratamiento de datos personales. Cualquier cambio sustancial será publicado
        en esta misma página.
      </LegalP>
    </LegalShell>
  )
}
