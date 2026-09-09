import type { Metadata } from 'next'
import { Landmark, CreditCard, DollarSign, ShieldCheck, MessageCircle, ExternalLink, Building2 } from 'lucide-react'
import { SectionTag } from '@/components/ui/SectionTag'
import { BotonCopiar } from '@/components/ui/BotonCopiar'
import { WHATSAPP } from '@/lib/site'

/**
 * Página de pagos, rescatada del WordPress viejo (snapshot Wayback 2026-06-14):
 * botón PSE (portal de pagos Davivienda del comercio Vamos Por Más SAS), pago
 * con tarjeta (checkout Wompi, +5% datáfono virtual), consignación nacional
 * (Bancolombia / Davivienda) y pagos desde EE. UU. (Zelle / Chase).
 */

export const metadata: Metadata = {
  title: 'Pagos',
  description:
    'Paga tu viaje de forma segura: PSE sin costo, tarjeta de crédito, consignación en Bancolombia o Davivienda, y Zelle o Chase desde Estados Unidos.',
  alternates: { canonical: '/pagos' },
}

const PSE_URL = 'https://portalpagos.davivienda.com/#/comercio/9012/VAMOS%20POR%20MAS%20SAS'
const WOMPI_URL = 'https://checkout.wompi.co/l/VPOS_Gkcr2Y'

const CUENTAS_COLOMBIA = [
  { banco: 'Bancolombia', tipo: 'Cuenta de ahorros', numero: '264-133178-51' },
  { banco: 'Davivienda', tipo: 'Cuenta corriente', numero: '406-169997292' },
]

const CUENTAS_USA = [
  { banco: 'Zelle', tipo: 'Referencia de pago', numero: 'vamospormasusa@gmail.com' },
  { banco: 'Chase Bank', tipo: 'Cuenta corriente', numero: '53-18-59-687' },
]

const whatsappComprobante = `https://wa.me/${WHATSAPP.principal}?text=${encodeURIComponent(
  'Hola! Acabo de realizar un pago y quiero enviar mi comprobante 🧾'
)}`

function TarjetaCuenta({ banco, tipo, numero }: { banco: string; tipo: string; numero: string }) {
  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5"
      style={{ background: '#fff', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center gap-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
        >
          <Landmark size={20} />
        </span>
        <div>
          <p className="font-plus-jakarta text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            {banco}
          </p>
          <p className="font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
            {tipo}
          </p>
          <p className="mt-0.5 font-plus-jakarta text-lg font-extrabold tracking-wide" style={{ color: 'var(--text-primary)' }}>
            {numero}
          </p>
        </div>
      </div>
      <BotonCopiar texto={numero} />
    </div>
  )
}

export default function PagosPage() {
  return (
    <div className="tema-claro">
      {/* ── Hero strip ── */}
      <section
        className="tema-oscuro relative overflow-hidden pt-32 pb-16 px-6"
        style={{ background: 'linear-gradient(to bottom, rgba(13, 30, 60,0.98), var(--navy))' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, var(--orange) 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-6xl">
          <SectionTag className="mb-4">Paga seguro</SectionTag>
          <h1 className="font-plus-jakarta text-4xl font-extrabold leading-tight sm:text-6xl" style={{ color: 'var(--text-primary)' }}>
            Pagos
          </h1>
          <p className="mt-5 max-w-lg font-inter text-sm leading-relaxed sm:text-base" style={{ color: 'var(--text-primary)', opacity: 0.9 }}>
            Elige el medio que prefieras: pago en línea con PSE o tarjeta, consignación en
            Colombia, o Zelle y Chase desde Estados Unidos.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-14">
        {/* ── Pagos en línea ── */}
        <section className="mb-14">
          <h2 className="mb-6 font-plus-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Paga en línea
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {/* PSE */}
            <div className="flex flex-col gap-4 rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
              >
                <Building2 size={22} />
              </span>
              <div className="flex-1">
                <h3 className="font-plus-jakarta text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Pagos con PSE
                </h3>
                <p className="mt-1.5 font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Paga desde cualquier banco en Colombia <strong>sin costo</strong> con el botón de
                  PSE, a través del portal de pagos de Davivienda.
                </p>
              </div>
              <a
                href={PSE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-plus-jakarta text-sm font-bold transition-transform duration-150 active:scale-[0.99]"
                style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
              >
                Haz tu pago aquí <ExternalLink size={15} />
              </a>
            </div>

            {/* Tarjeta de crédito */}
            <div className="flex flex-col gap-4 rounded-2xl p-6 sm:p-8" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
              <span
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: 'color-mix(in srgb, var(--orange) 12%, transparent)', color: 'var(--orange)' }}
              >
                <CreditCard size={22} />
              </span>
              <div className="flex-1">
                <h3 className="font-plus-jakarta text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  Tarjeta de crédito
                </h3>
                <p className="mt-1.5 font-inter text-sm leading-relaxed" style={{ color: 'var(--text-dim)' }}>
                  Paga con tu tarjeta a través de nuestro datáfono virtual. Este medio genera un
                  suplemento del <strong>5%</strong>, que se adiciona al momento de realizar la
                  transacción.
                </p>
              </div>
              <a
                href={WOMPI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-plus-jakarta text-sm font-bold transition-transform duration-150 active:scale-[0.99]"
                style={{ background: 'var(--orange)', color: 'var(--orange-contrast)' }}
              >
                Haz tu pago aquí <ExternalLink size={15} />
              </a>
            </div>
          </div>
        </section>

        {/* ── Consignación en Colombia ── */}
        <section className="mb-14">
          <h2 className="mb-2 font-plus-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            Consignación en Colombia
          </h2>
          <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
            Consigna o transfiere a nuestras cuentas nacionales.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CUENTAS_COLOMBIA.map(c => (
              <TarjetaCuenta key={c.numero} {...c} />
            ))}
          </div>
        </section>

        {/* ── Pagos desde Estados Unidos ── */}
        <section className="mb-14">
          <h2 className="mb-2 flex items-center gap-2.5 font-plus-jakarta text-2xl font-extrabold tracking-tight sm:text-3xl" style={{ color: 'var(--text-primary)' }}>
            <DollarSign size={26} style={{ color: 'var(--orange)' }} />
            Pagos en dólares (Estados Unidos)
          </h2>
          <p className="mb-6 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
            Si estás en Estados Unidos, puedes pagar por Zelle o consignar en nuestra cuenta de
            Chase Bank.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {CUENTAS_USA.map(c => (
              <TarjetaCuenta key={c.numero} {...c} />
            ))}
          </div>
        </section>

        {/* ── Aviso de seguridad + comprobante ── */}
        <section
          className="flex flex-col gap-5 rounded-2xl p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
          style={{ background: 'var(--navy)' }}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--gold)' }}>
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="font-plus-jakarta text-base font-bold text-white">
                Paga solo a las cuentas publicadas en esta página
              </p>
              <p className="mt-1 max-w-xl font-inter text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Nuestros únicos números autorizados para información, ventas y reservas son{' '}
                <strong className="text-white">320 489 1930</strong> y{' '}
                <strong className="text-white">300 569 3381</strong>. Después de pagar, envíanos tu
                comprobante por WhatsApp para confirmar tu reserva.
              </p>
            </div>
          </div>
          <a
            href={whatsappComprobante}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-plus-jakarta text-sm font-bold transition-transform duration-150 active:scale-[0.99]"
            style={{ background: 'var(--gold)', color: 'var(--navy)' }}
          >
            <MessageCircle size={17} />
            Enviar comprobante
          </a>
        </section>
      </div>
    </div>
  )
}
