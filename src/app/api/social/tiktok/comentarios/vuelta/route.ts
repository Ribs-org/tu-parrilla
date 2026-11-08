import { NextResponse } from 'next/server'
import { and, eq, isNotNull } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { usuarioActual } from '@/lib/auth'
import { env } from '@/lib/env'
import { conMensaje } from '@/lib/mensaje-firmado'
import { tiktokComentariosAbiertoPara } from '@/lib/redes-abiertas'
import { leerCuentaDeOAuthState } from '@/lib/social/oauth-state'
import {
  COMENTARIOS_ACTIVADOS,
  COMENTARIOS_CERRADOS,
  COMENTARIOS_FALLO,
  COMENTARIOS_OTRA_CUENTA,
  COMENTARIOS_SIN_PERMISO,
  RED_DEL_STATE,
  canjearCodigo,
  guardarCredencialDeComentarios,
  nombreVisible,
  permisosQueFaltan,
  vueltaDe,
} from '@/lib/social/tiktok-business'

export const dynamic = 'force-dynamic'

/**
 * La vuelta de la app de TikTok for Business. En el portal se registra con la barra final
 * (`https://tu-parrilla.cl/api/social/tiktok/comentarios/vuelta/`), que TikTok exige; Next la
 * redirige aquí sin la barra y con el código intacto.
 *
 * Canjea el código, comprueba que se concedieron los dos permisos de comentarios y que la cuenta
 * que autorizó es la de la fila, y guarda la credencial junto a la cuenta. Nunca crea una fila.
 */
export async function GET(request: Request) {
  const usuario = await usuarioActual()
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const url = new URL(request.url)
  const volver = (texto: string) => NextResponse.redirect(`${url.origin}${conMensaje('/admin/accounts', texto)}`)

  if (!tiktokComentariosAbiertoPara(usuario.id)) return volver(COMENTARIOS_CERRADOS)
  const base = env('TIKTOK_BUSINESS_AUTORIZACION')
  if (!base) return volver(COMENTARIOS_CERRADOS)

  // El portal lo llama `auth_code`; la ventana de tiktok.com lo devuelve como `code`.
  const codigo = url.searchParams.get('code') ?? url.searchParams.get('auth_code')
  const state = url.searchParams.get('state')
  if (!codigo || !state) {
    const dijo = ['error', 'error_description'].map((c) => url.searchParams.get(c)).filter(Boolean).join(' · ')
    if (dijo) console.error('[tiktok-business] vuelta sin código:', dijo.slice(0, 300))
    return volver(COMENTARIOS_FALLO)
  }

  const cuentaId = await leerCuentaDeOAuthState(state, RED_DEL_STATE, usuario.id)
  if (!cuentaId) return volver(COMENTARIOS_FALLO)
  const [cuenta] = await getDb()
    .select({ id: socialAccounts.id, handle: socialAccounts.handle })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.id, cuentaId),
        eq(socialAccounts.ownerId, usuario.id),
        eq(socialAccounts.network, 'tiktok'),
        isNotNull(socialAccounts.accessToken),
      ),
    )
    .limit(1)
  if (!cuenta) return volver(COMENTARIOS_FALLO)

  try {
    const credencial = await canjearCodigo(codigo, vueltaDe(base, url.origin))
    if (permisosQueFaltan(credencial.scope).length > 0) return volver(COMENTARIOS_SIN_PERMISO)
    // TikTok da un id distinto por app, así que la cuenta se reconoce por su nombre visible, el
    // mismo que la fila guarda como handle al conectar.
    const nombre = await nombreVisible(credencial)
    if (nombre && cuenta.handle && nombre !== cuenta.handle.trim()) return volver(COMENTARIOS_OTRA_CUENTA)
    await guardarCredencialDeComentarios(usuario.id, cuenta.id, credencial)
    return volver(COMENTARIOS_ACTIVADOS)
  } catch (error) {
    console.error('[tiktok-business] canje:', String(error).slice(0, 300))
    return volver(COMENTARIOS_FALLO)
  }
}
