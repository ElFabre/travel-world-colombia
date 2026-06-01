import { getDestinos } from '@/lib/destinos'

export default async function Home() {
  const destinos = await getDestinos()

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'var(--navy)' }}
    >
      {/* Glow decorativo */}
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(244,130,31,0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="relative text-center space-y-6 max-w-2xl">
        {/* Etiqueta de sección */}
        <p
          className="text-[9px] tracking-[0.4em] uppercase"
          style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--orange)' }}
        >
          Agencia de Viajes · Fusagasugá · RNT 27287
        </p>

        {/* Título principal */}
        <h1
          className="text-5xl md:text-7xl leading-tight"
          style={{
            fontFamily: 'var(--font-plus-jakarta)',
            fontWeight: 800,
            color: 'var(--text-primary)',
          }}
        >
          Travel World
          <span style={{ color: 'var(--orange)' }}> Colombia</span>
        </h1>

        {/* Subtítulo */}
        <p
          className="text-base font-light"
          style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-dim)' }}
        >
          Sitio en construcción · Paso 2: Supabase conectado ✓
        </p>

        {/* Prueba de conexión Supabase — destinos leídos desde la DB */}
        <div
          className="text-left mx-auto inline-block rounded-sm px-5 py-4"
          style={{ background: 'var(--card-bg)', border: '1px solid var(--border-orange)' }}
        >
          <p
            className="text-[9px] tracking-[0.3em] uppercase mb-2"
            style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--orange)' }}
          >
            {destinos.length} destinos desde Supabase
          </p>
          <ul className="space-y-1">
            {destinos.map(d => (
              <li
                key={d.id}
                className="text-[13px] flex justify-between gap-6"
                style={{ fontFamily: 'var(--font-inter)', color: 'var(--text-primary)' }}
              >
                <span>{d.nombre}</span>
                <span style={{ color: 'var(--text-dim)' }}>{d.precio_desde}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Divider */}
        <div
          className="h-px w-48 mx-auto"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(244,130,31,0.4), transparent)',
          }}
        />

        {/* Stats setup */}
        <div className="grid grid-cols-3 gap-6 pt-4">
          {[
            { num: '126', label: 'Reseñas Google' },
            { num: '5★', label: 'Calificación' },
            { num: String(destinos.length), label: 'Destinos' },
          ].map(stat => (
            <div key={stat.label}>
              <p
                className="text-3xl"
                style={{ fontFamily: 'var(--font-plus-jakarta)', fontWeight: 700, color: 'var(--orange)' }}
              >
                {stat.num}
              </p>
              <p
                className="text-[11px] mt-1"
                style={{ fontFamily: 'var(--font-cinzel)', color: 'var(--text-muted)' }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
