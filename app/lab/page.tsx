import type { Metadata } from 'next'
import { MotionLab } from './_components/MotionLab'

// Página de pruebas — NO indexada y NO enlazada desde el menú.
// Para eliminarla por completo: borra la carpeta app/lab/.
export const metadata: Metadata = {
  title: 'Laboratorio de Motion',
  robots: { index: false, follow: false },
  alternates: { canonical: '/lab' },
}

export default function LabPage() {
  return <MotionLab />
}
