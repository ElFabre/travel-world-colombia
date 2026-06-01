import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Cinzel, Inter } from 'next/font/google'
import './globals.css'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
})

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cinzel',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://travelworldcolombia.com'),
  title: {
    default: 'Agencia de Viajes Fusagasugá | Travel World Colombia',
    template: '%s | Travel World Colombia',
  },
  description:
    'Agencia de viajes en Fusagasugá con más de 126 reseñas ⭐⭐⭐⭐⭐ Paquetes a todo el mundo. Cotiza gratis ✈️ RNT 27287.',
  keywords: [
    'agencia de viajes fusagasugá',
    'paquetes de viaje colombia',
    'viajes internacionales colombia',
    'travel world colombia',
  ],
  openGraph: {
    siteName: 'Travel World Colombia',
    locale: 'es_CO',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${plusJakarta.variable} ${cinzel.variable} ${inter.variable}`}
    >
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
