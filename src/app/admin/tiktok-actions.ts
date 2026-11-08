'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth'
import { busquedasDeLaCuenta, cambiarRubro } from '@/lib/social/tiktok-numeros-guardar'

// Lo de TikTok for Business que se pide desde el panel: «Lo que se busca en TikTok» en el
// compositor y el rubro de la comparación en Los Números. Cada una ata la cuenta al dueño de la
// sesión (`cuentaTiktokDelDueno`): una cuenta ajena contesta igual que una que no existe. Con la
// reja cerrada (`tiktokBusinessAbiertoPara`) ninguna pide nada a TikTok.

/** «Lo que se busca en TikTok»: sin `consulta`, las tendencias; con una, lo recomendado para ella. */
export async function busquedasTiktokAccion(
  cuentaId: string,
  consulta: string | null,
): Promise<{ palabras: string[] } | { error: string }> {
  const usuario = await requireUser()
  return busquedasDeLaCuenta(usuario.id, cuentaId, typeof consulta === 'string' ? consulta : null)
}

/** «Tu rubro», en la comparación de Los Números: guarda el rubro y pide la comparación nueva. */
export async function cambiarRubroTiktokAccion(cuentaId: string, rubro: string): Promise<{ ok: boolean; texto: string }> {
  const usuario = await requireUser()
  const resultado = await cambiarRubro(usuario.id, cuentaId, rubro)
  if (resultado.ok) revalidatePath('/admin/analytics')
  return resultado
}
