import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'reputationhub.site' },
    ],
    formats: ['image/avif', 'image/webp'],
    // Cachea las imágenes ya optimizadas 30 días (menos recomputación en Vercel).
    minimumCacheTTL: 2_592_000,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            // Nota: 'unsafe-inline' en script-src se queda a propósito — los
            // nonces exigen render por request y matarían el ISR de todo el
            // sitio público (además GTM los necesita en la práctica).
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' *.googletagmanager.com *.facebook.net reputationhub.site",
              "frame-src 'self' reputationhub.site *.google.com www.googletagmanager.com",
              "img-src * data: blob:",
              // Solo los backends que el navegador realmente contacta:
              // Supabase (lecturas públicas + subida de imágenes del panel),
              // GA4/GTM, beacons del Pixel de Meta y el widget de reseñas
              // de GHL (reputationhub/leadconnector).
              [
                "connect-src 'self'",
                '*.supabase.co',
                '*.google-analytics.com',
                '*.analytics.google.com',
                '*.googletagmanager.com',
                '*.facebook.com',
                '*.facebook.net',
                'reputationhub.site',
                '*.leadconnectorhq.com',
              ].join(' '),
              // next/font sirve las fuentes desde el propio dominio; los hosts
              // de Google Fonts ya no hacen falta.
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // 'self' (no 'none') para no contradecir X-Frame-Options: SAMEORIGIN.
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
      {
        source: '/admin/(.*)',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
  async redirects() {
    // Mapa 301 del WordPress viejo (travelworldcolombia.com) → sitio nuevo.
    // Fuente: page-sitemap.xml + product-sitemap.xml del sitio viejo (ago 2026).
    // /cruceros existe en ambos sitios, no necesita redirección.
    const aDestinos = [
      '/caribe',
      '/europa',
      '/norte-america',
      '/sur-america',
      '/mexico',
      '/peru',
      '/otros-destinos',
      '/otros-destinos-internacionales',
      '/nuestros-destinos',
      '/viajes-nacionales-2',
      '/viajes-nacionales-2-2',
      '/viajes-nacionales-en-bus',
    ]
    const aServicios = ['/seguros-de-viaje', '/renta-autos']
    const aContacto = ['/contactanos', '/pagos']
    const aNosotros = [
      '/somos',
      '/politicas-de-sostenibilidad',
      '/codigo-de-conducta-del-turista-responsable',
      '/rnt-agencia-de-viajes-2025',
      '/politica-de-privaciadad',
      '/politicas-y-condiciones',
    ]
    const aInicio = ['/tienda', '/carrito', '/mi-cuenta', '/finalizar-compra']

    return [
      ...aDestinos.map(source => ({ source, destination: '/destinos', permanent: true })),
      ...aServicios.map(source => ({ source, destination: '/servicios', permanent: true })),
      ...aContacto.map(source => ({ source, destination: '/contacto', permanent: true })),
      ...aNosotros.map(source => ({ source, destination: '/nosotros', permanent: true })),
      ...aInicio.map(source => ({ source, destination: '/', permanent: true })),
      { source: '/producto/:path*', destination: '/', permanent: true },
      {
        source: '/wp-admin/:path*',
        destination: '/',
        permanent: false,
      },
      {
        source: '/wp-login.php',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

export default nextConfig
