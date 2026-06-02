import { getDestinos } from '@/lib/destinos'
import { HeroSection } from '@/components/hero/HeroSection'

export const revalidate = 1800 // home: revalidar cada 30 min

export default async function Home() {
  const destinos = await getDestinos()

  return (
    <>
      <HeroSection destinos={destinos} />
    </>
  )
}
