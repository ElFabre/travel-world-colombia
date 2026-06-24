import { getDestinos } from '@/lib/destinos'
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

export const revalidate = 1800 // home: revalidar cada 30 min

export default async function Home() {
  const destinos = await getDestinos()

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
      <CTABanner />
      <MapaContacto />
    </div>
  )
}
