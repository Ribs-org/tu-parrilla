import { NextResponse } from 'next/server'
import { and, eq, isNotNull } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { usuarioActual } from '@/lib/auth'
import { env } from '@/lib/env'
import { conMensaje } from '@/lib/mensaje-firmado'
import { tiktokBusinessAbiertoPara } from '@/lib/redes-abiertas'
import { signOAuthStateDeCuenta } from '@/lib/social/oauth-state'
import {
  COMENTARIOS_CERRADOS,
  COMENTARIOS_FALLO,
  RED_DEL_STATE,
  urlDeAutorizacion,
} from '@/lib/social/tiktok-business'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

/**
 * «Activar TikTok for Business (comentarios y números) →», en el detalle de una cuenta de TikTok conectada: manda al
 * dueño a autorizar esa cuenta en la app de TikTok for Business (`social/tiktok-business.ts`). La
 * cuenta viaja firmada en el state, así la vuelta sabe a qué fila pegarle la credencial.
 */
export async function GET(request: Request) {
  const usuario = await usuarioActual()
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const origen = new URL(request.url).origin
  const volver = (texto: string) => NextResponse.redirect(`${origen}${conMensaje('/admin/accounts', texto)}`)

  if (!tiktokBusinessAbiertoPara(usuario.id)) return volver(COMENTARIOS_CERRADOS)

  const cuenta = new URL(request.url).searchParams.get('cuenta')
  if (!esUuid(cuenta)) return volver(COMENTARIOS_FALLO)
  // Solo una cuenta de TikTok de este dueño, y conectada: los comentarios se responden en su nombre.
  const [fila] = await getDb()
    .select({ id: socialAccounts.id })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.id, cuenta),
        eq(socialAccounts.ownerId, usuario.id),
        eq(socialAccounts.network, 'tiktok'),
        isNotNull(socialAccounts.accessToken),
      ),
    )
    .limit(1)
  if (!fila) return volver(COMENTARIOS_FALLO)

  const base = env('TIKTOK_BUSINESS_AUTORIZACION')
  if (!base) return volver(COMENTARIOS_CERRADOS)
  const state = await signOAuthStateDeCuenta(RED_DEL_STATE, usuario.id, fila.id)
  return NextResponse.redirect(urlDeAutorizacion(base, state))
}
