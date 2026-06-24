'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/admin/guard'
import { createAdminClient } from '@/lib/supabase/admin'

/** Marca/desmarca una solicitud como atendida. */
export async function toggleAtendido(id: string, valor: boolean): Promise<void> {
  await requireAdmin()
  const admin = createAdminClient()
  const { error } = await admin.from('leads').update({ atendido: valor }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/solicitudes')
  revalidatePath('/admin')
}
