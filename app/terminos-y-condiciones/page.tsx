import type { Metadata } from 'next'
import { LegalShell, LegalH2, LegalP, LegalList } from '@/components/legal/LegalShell'
import { SITE } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: `Cláusula de responsabilidad, políticas de reserva, cancelación y penalidades de ${SITE.nombre} — agencia de viajes y turismo con RNT ${SITE.rnt}.`,
  alternates: { canonical: '/terminos-y-condiciones' },
}

export default function TerminosPage() {
  return (
    <LegalShell
      tag="Condiciones del servicio"
      titulo={
        <>
          Términos y <span style={{ color: 'var(--orange)' }}>condiciones</span>
        </>
      }
      intro={`Cláusula de responsabilidad y condiciones generales de los planes turísticos de ${SITE.nombre}, agencia de viajes y turismo con RNT ${SITE.rnt}.`}
    >
      <LegalH2>Cláusula de responsabilidad</LegalH2>
      <LegalP>
        {SITE.nombre} — Agencia de Viajes y Turismo, con Registro Nacional de Turismo{' '}
        {SITE.rnt} — se hace responsable ante los usuarios por la totalidad de la prestación
        de los servicios descritos en sus programas ofrecidos. Actúa como intermediario
        entre los agentes, operadores y prestadores de servicios turísticos, declinando por
        lo tanto toda responsabilidad por situaciones de fuerza de la naturaleza tales como
        huracanes, maremotos, terremotos, accidentes, huelgas, asonadas, fenómenos
        climáticos o naturales, pandemias, condiciones de seguridad, factores políticos,
        negación de permisos de ingreso o asuntos de salubridad, y cualquier otro evento de
        fuerza mayor o caso fortuito, pues los riesgos y peligros del viaje pertenecen
        exclusivamente al usuario durante el tiempo del viaje. Nos sujetamos al régimen de
        responsabilidad que establece la Ley 300 de 1996 y los Decretos 1075 de 1997 y 053
        de 2002.
      </LegalP>
      <LegalP>
        Como organizador, {SITE.nombre} pone el precio a los viajes, y los mismos pueden ser
        aceptados o rechazados por el cliente. En caso de confirmación con depósito se
        entienden aceptadas todas las condiciones, restricciones y penalidades.
      </LegalP>

      <LegalH2>Reservas y pagos</LegalH2>
      <LegalList
        items={[
          'Para confirmar la reserva de paquetes turísticos se requiere siempre un depósito mínimo del 30% sobre el valor total del viaje, o el porcentaje informado por su asesor.',
          'Para tiquetes aéreos es necesario el pago del 100%, excepto cuando hacen parte de un bloqueo de grupo.',
          'Los tiquetes aéreos están sujetos a su clase tarifaria y a las condiciones de la misma.',
        ]}
      />

      <LegalH2>Cambios, cancelaciones y penalidades</LegalH2>
      <LegalP>
        Aplican restricciones y penalidades por cambios o incumplimiento, conforme a las
        normas legales y a la costumbre comercial en turismo. {SITE.nombre} cancela en su
        totalidad y con anterioridad todos los servicios ofrecidos en cada uno de sus
        programas; en ningún caso podrá hacer devolución de dinero. No obstante, si el
        pasajero, por enfermedad o por razones de fuerza mayor comprobada, se ve obligado a
        retractarse del viaje y se encuentra dentro de los términos legales, o las
        condiciones del plan lo permiten, se tramitará su respectiva cancelación, teniendo
        en cuenta que esto acarreará un descuento por concepto de gastos administrativos.
      </LegalP>
      <LegalP>
        Si el cliente desiste del viaje por motivos personales o por la no obtención de
        algún requisito o permiso para el viaje, se aplicarán los siguientes porcentajes
        indemnizatorios sobre el total de la porción terrestre, siempre que la tarifa
        tomada lo permita y dependiendo del destino y del operador final:
      </LegalP>
      <LegalList
        items={[
          'Más de 30 días antes del viaje: 20%.',
          'De 29 a 20 días antes del viaje: 40%.',
          'De 19 a 8 días antes del viaje: 60%.',
          'Menos de 8 días antes del viaje: 100% del valor depositado.',
          'Una vez iniciado el viaje no habrá devolución de dinero.',
        ]}
      />

      <LegalH2>Reembolsos</LegalH2>
      <LegalP>
        El trámite de reembolso tomará un máximo de seis (6) meses, o menos según el caso.
        Se efectuará reembolso solo en casos de fuerza mayor, con soportes debidamente
        diligenciados y si los operadores finales lo aprueban, ya que el manejo del dinero
        pagado a los operadores finales no depende de la agencia. Se descontará el
        porcentaje que por expedición de tiquetes o penalidad cobre la aerolínea, de acuerdo
        con la tarifa negociada, y adicionalmente un 20% por gastos administrativos.
      </LegalP>

      <LegalP>
        Cualquier inquietud o aclaración, no dudes en comunicarte con nosotros — estaremos
        atentos.
      </LegalP>
    </LegalShell>
  )
}
