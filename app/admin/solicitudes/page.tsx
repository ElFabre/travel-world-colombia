import { redirect } from 'next/navigation'
import { Mail, Phone, MessageCircle, MapPin, Users, Calendar, Wallet } from 'lucide-react'
import { getAdminSession } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'
import { AtendidoBtn } from './LeadActions'

export const dynamic = 'force-dynamic'

interface Lead {
  id: string
  nombre: string
  email: string
  telefono: string
  destino_interes: string | null
  num_personas: number | null
  fecha_viaje: string | null
  presupuesto: string | null
  mensaje: string | null
  origen: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  atendido?: boolean | null
  created_at: string
}

const fmtFecha = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})

export default async function SolicitudesPage() {
  const session = await getAdminSession()
  if (!session) redirect('/admin/login')
  const { rol } = session

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  const leads = (data ?? []) as Lead[]
  const nuevas = leads.filter(l => !l.atendido).length

  return (
    <>
      <div className="mb-8">
        <h1 className="font-plus-jakarta text-2xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
          Solicitudes
        </h1>
        <p className="mt-1 font-inter text-sm" style={{ color: 'var(--text-dim)' }}>
          {leads.length} en total · {nuevas} sin atender · contactos de los formularios del sitio
        </p>
      </div>

      {error && (
        <p className="rounded-md p-4 font-inter text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}>
          Error cargando solicitudes: {error.message}
        </p>
      )}

      {!error && leads.length === 0 && (
        <p className="rounded-md p-8 text-center font-inter text-sm" style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-dim)' }}>
          Aún no hay solicitudes. Aquí llegarán los contactos de los formularios.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {leads.map(l => {
          const tel = (l.telefono ?? '').replace(/\D/g, '')
          const atendido = Boolean(l.atendido)
          return (
            <li
              key={l.id}
              className="rounded-xl p-4"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', opacity: atendido ? 0.7 : 1 }}
            >
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-full px-2 py-0.5 font-inter text-xs font-bold"
                  style={atendido
                    ? { background: 'rgba(148,163,184,0.15)', color: 'var(--text-dim)' }
                    : { background: 'var(--orange)', color: '#fff' }}
                >
                  {atendido ? 'Atendido' : 'Nuevo'}
                </span>
                <p className="font-plus-jakarta text-base font-bold" style={{ color: 'var(--text-primary)' }}>{l.nombre}</p>
                {l.origen ? <span className="font-inter text-xs" style={{ color: 'var(--text-muted)' }}>· {l.origen}</span> : null}
                <time className="ml-auto font-inter text-xs" style={{ color: 'var(--text-dim)' }}>
                  {fmtFecha.format(new Date(l.created_at))}
                </time>
              </div>

              <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 font-inter text-xs">
                <a href={`mailto:${l.email}`} className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                  <Mail size={13} /> {l.email}
                </a>
                <a href={`tel:${l.telefono}`} className="flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
                  <Phone size={13} /> {l.telefono}
                </a>
                {tel && (
                  <a href={`https://wa.me/${tel}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5" style={{ color: '#22c55e' }}>
                    <MessageCircle size={13} /> WhatsApp
                  </a>
                )}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1.5 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
                {l.destino_interes && <span className="flex items-center gap-1"><MapPin size={12} /> {l.destino_interes}</span>}
                {l.num_personas != null && <span className="flex items-center gap-1"><Users size={12} /> {l.num_personas} pers.</span>}
                {l.fecha_viaje && <span className="flex items-center gap-1"><Calendar size={12} /> {l.fecha_viaje}</span>}
                {l.presupuesto && <span className="flex items-center gap-1"><Wallet size={12} /> {l.presupuesto}</span>}
              </div>

              {l.mensaje && (
                <p className="mt-3 rounded-md p-3 font-inter text-sm" style={{ background: 'var(--bg-alt)', color: 'var(--text-dim)' }}>
                  {l.mensaje}
                </p>
              )}

              {(l.utm_source || l.utm_campaign) && (
                <p className="mt-2 font-inter text-xs" style={{ color: 'var(--text-muted)' }}>
                  {[l.utm_source, l.utm_medium, l.utm_campaign].filter(Boolean).join(' · ')}
                </p>
              )}

              {rol !== 'lector' && (
                <div className="mt-3 flex justify-end">
                  <AtendidoBtn id={l.id} atendido={atendido} />
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
