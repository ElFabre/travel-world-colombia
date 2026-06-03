import { getDestinos } from '@/lib/destinos'
import { HeroSection } from '@/components/hero/HeroSection'
import { ComoFunciona } from '@/components/home/ComoFunciona'
import { TrustBar } from '@/components/home/TrustBar'
import { DestinosGrid } from '@/components/home/DestinosGrid'
import { PorQueElegirnos } from '@/components/home/PorQueElegirnos'
import { AlianzasPremium } from '@/components/home/AlianzasPremium'
import { ResenasSection } from '@/components/home/ResenasSection'
import { CTABanner } from '@/components/home/CTABanner'
import { MapaContacto } from '@/components/home/MapaContacto'

export const revalidate = 1800 // home: revalidar cada 30 min

export default async function Home() {
  const destinos = await getDestinos()

  return (
    <>
      <HeroSection destinos={destinos} />
      <ComoFunciona />
      <TrustBar />
      <DestinosGrid destinos={destinos} />
      <PorQueElegirnos />
      <AlianzasPremium />
      <ResenasSection />
      <CTABanner />
      <MapaContacto />
    </>
  )
}
