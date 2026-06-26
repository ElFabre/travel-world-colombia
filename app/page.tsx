import type { Metadata } from 'next'
import { preload } from 'react-dom'
import { getDestinos } from '@/lib/destinos'
import { heroBg } from '@/lib/hero'
import { HeroSection } from '@/components/hero/HeroSection'
import { TrustBar } from '@/components/home/TrustBar'
import { DestinosGrid } from '@/components/home/DestinosGrid'
import { ComoFunciona } from '@/components/home/ComoFunciona'
import { EquipoSection } from '@/components/equipo/EquipoSection'
import { PorQueElegirnos } from '@/components/home/PorQueElegirnos'
import { AlianzasPremium } from '@/components/home/AlianzasPremium'
import { ResenasSection } from '@/components/home/ResenasSection'
import { CTABanner } from '@/components/home/CTABanner'
import { MapaContacto } from '@/components/home/MapaContacto'
import { OrganizationReviews } from '@/components/seo/OrganizationReviews'

export const revalidate = 1800 // home: revalidar cada 30 min

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

export default async function Home() {
  const destinos = await getDestinos()

  // Precarga la imagen LCP del hero (mismo destino que elige HeroSection por
  // defecto: primer destacado, o el primero). El hero es un background-image de
  // CSS, que el navegador descubre tarde; el preload adelanta su descarga.
  const heroPrincipal = destinos.find(d => d.destacado) ?? destinos[0]
  if (heroPrincipal) {
    preload(heroBg(heroPrincipal), { as: 'image', fetchPriority: 'high' })
  }

  return (
    <div className="tema-claro">
      <HeroSection destinos={destinos} />
      <TrustBar />
      <DestinosGrid destinos={destinos} />
      <ComoFunciona />
      <EquipoSection />
      <PorQueElegirnos />
      <AlianzasPremium />
      <ResenasSection />
      <OrganizationReviews />
      <CTABanner />
      <MapaContacto />
    </div>
  )
}
