'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireUser } from '@/lib/auth'
import { enlaceDeLaPaginaPrincipal, tienePagina } from '@/lib/enlace-de-la-pagina'
import { promocionarAbiertoPara } from '@/lib/redes-abiertas'
import { leerFormulario, type Accion } from '@/lib/social/promocionar'
import { cambiarPromocion, crearPromocion, promocionable } from '@/lib/social/promocionar-meta'
import { esUuid } from '@/lib/uuid'

export type EstadoPromocionar = { error?: string }

const CERRADO = 'Promocionar desde Tu Parrilla todavía no está abierto para tu cuenta.'

/**
 * El último paso del formulario: crea la promoción en la cuenta publicitaria del dueño. Llega
 * solo desde «Confirmar», con el gasto máximo que el dueño vio; todo se revisa otra vez acá.
 */
export async function promocionarAccion(_previo: EstadoPromocionar, formData: FormData): Promise<EstadoPromocionar> {
  const usuario = await requireUser()
  if (!promocionarAbiertoPara(usuario.id)) return { error: CERRADO }
  const postId = formData.get('postId')
  if (!esUuid(postId)) return { error: 'Esa publicación no existe.' }

  const p = await promocionable(usuario.id, postId)
  if (!p) return { error: 'Esa publicación no está entre las tuyas de Instagram o Facebook.' }
  const enlace =
    p.post.network === 'instagram' && (await tienePagina(usuario.id))
      ? `${await enlaceDeLaPaginaPrincipal(usuario.id)}?s=${encodeURIComponent(p.post.campaign)}`
      : null

  const r = await crearPromocion({ ownerId: usuario.id, postId, entrada: leerFormulario(formData), zona: usuario.zona, enlace })
  if ('error' in r) return r
  revalidatePath('/admin/analytics')
  redirect(`/admin/analytics/publicaciones/${postId}#promociones`)
}

/** Pausar, reanudar o detener una promoción, desde la pieza o desde «Lo pagado». */
export async function cambiarPromocionAccion(id: string, accion: Accion): Promise<{ error?: string }> {
  const usuario = await requireUser()
  if (!promocionarAbiertoPara(usuario.id)) return { error: CERRADO }
  if (!esUuid(id) || !['pausar', 'reanudar', 'detener'].includes(accion)) return { error: 'Esa promoción no existe.' }
  const r = await cambiarPromocion(usuario.id, id, accion)
  if (!r.error) revalidatePath('/admin/analytics', 'layout')
  return r
}
