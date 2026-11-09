import { NextResponse } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { usuarioActual } from '@/lib/auth'
import { env } from '@/lib/env'
import { fraseProximamente } from '@/lib/networks'
import { analiticaDeYoutubeAbiertaPara, loginDeInstagramAbiertoPara, proximamentePara } from '@/lib/redes-abiertas'
import { PERMISO_ANALITICA } from '@/lib/social/analitica-youtube'
import {
  AUTORIZAR_LOGIN_DE_INSTAGRAM,
  LOGIN_DE_INSTAGRAM_CERRADO,
  SCOPES_LOGIN_DE_INSTAGRAM,
} from '@/lib/social/instagram-login'
import { SCOPES_THREADS_EXTRA } from '@/lib/social/threads'
import { COOKIE_AGREGAR } from '@/lib/social/vuelta'
import { signOAuthState } from '@/lib/social/oauth-state'
import { conMensaje } from '@/lib/mensaje-firmado'

export const dynamic = 'force-dynamic'

// Instagram goes through Facebook Login, so the Pages scopes are not optional extras:
// the Instagram user id only exists as a field on the Page that owns it, and without
// `pages_show_list` and `pages_read_engagement` the callback has nothing to read it from.
// `instagram_content_publish` is what the publisher uses (`social/publish/instagram.ts`);
// it is requested together with the rest because scopes are granted once, at
// authorization, and adding one later means sending the owner back through consent.
const SCOPES: Record<string, string> = {
  instagram:
    // `business_management` is what lets `me/accounts` enumerate Pages owned by a business
    // portfolio rather than by the person. Without it the call returns an empty list and the
    // Instagram account is undiscoverable, even when Page and account are correctly linked.
    // `instagram_manage_comments` is the one that opens listing and replying to comments on
    // the account's own posts; with the Meta app in development mode it needs no review.
    'instagram_basic,instagram_manage_insights,pages_show_list,pages_read_engagement,instagram_content_publish,business_management,instagram_manage_comments',
  // Facebook rides the same Meta app as Instagram; the pages scopes repeat because each
  // network's authorization is its own consent screen. The dialog only accepts scopes
  // the app's Meta use cases activate: pages_read_user_content and pages_manage_posts
  // need the «Administrar páginas» use case (without it the dialog rejects the whole
  // request as "Invalid Scopes"). read_insights stays out for the same reason: the dialog
  // rejected it in August 2026 because the app's use case does not carry it, not because
  // Meta retired it (its reference still documents it, and the post and reel insights
  // require it — see `social/facebook.ts`, issue #338). Adding it is the third Meta
  // review, behind a flag like the others. publish_video waits until the dialog is
  // confirmed to accept it: one rejected scope voids the entire request, breaking the
  // connect flow for the others. `pages_manage_engagement` is the one that opens listing and replying to
  // comments on the Page's own posts; with the app in development mode it needs no review.
  facebook:
    'pages_show_list,pages_read_engagement,pages_read_user_content,pages_manage_posts,business_management,pages_manage_engagement',
  // upload alone is write-only: it cannot read channels.list (the callback's channel
  // discovery) nor videos.list (the publisher's processing poll) — both 403 without a
  // reading scope. force-ssl covers everything readonly did and also allows commenting,
  // which is what it is here for. Space-separated: that is Google's delimiter, unlike
  // Meta's commas. These two are the ones Google verified on 2026-10-14; the analytics one
  // rides behind its own gate (`PermisosExtra.analiticaYoutube`).
  youtube:
    'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
  threads: 'threads_basic,threads_content_publish',
  x: 'tweet.read tweet.write users.read offline.access',
  // video.upload viene pegado a Content Posting API en el portal y video.publish exige
  // Direct Post activado; los cuatro se piden juntos porque TikTok no deja sumar scopes
  // a un token existente: las cuentas conectadas antes deben reconectarse una vez.
  tiktok: 'user.info.basic,video.list,video.upload,video.publish',
}

/**
 * Los permisos del privado (`privado.ts`), solo con `META_PERMISOS_PRIVADO=1`: Meta rechaza
 * la ventana entera si pide uno que la app no tiene activado en sus casos de uso, así que se
 * enciende después de activarlos en el panel de Meta, no antes. Una cuenta conectada antes
 * tiene que reconectarse para concederlos.
 */
const SCOPES_PRIVADO: Record<string, string> = {
  instagram: 'instagram_manage_messages,pages_messaging',
  facebook: 'pages_messaging',
}

/**
 * Leer los resultados de los anuncios (`social/anuncios.ts`), solo con `META_PERMISOS_ANUNCIOS=1`,
 * por la misma razón que el privado: `ads_read` tiene que estar activado en los casos de uso de
 * la app de Meta antes de pedirlo. Va en las dos porque cada red es su propio consentimiento; el
 * que se usa es el token de usuario que guarda Instagram.
 */
const SCOPES_ANUNCIOS: Record<string, string> = {
  instagram: 'ads_read',
  facebook: 'ads_read',
}

/**
 * Promocionar una publicación desde Tu Parrilla (`social/promocionar.ts`): `ads_management`, con
 * su propia bandera, `META_PERMISOS_PROMOCIONAR=1`, y solo junto a la de leer: promocionar sin ver
 * después cómo le fue no tiene sentido, y cada permiso se activa aparte en el caso de uso.
 */
const SCOPES_PROMOCIONAR: Record<string, string> = {
  instagram: 'ads_management',
  facebook: 'ads_management',
}

/**
 * Las banderas que suman permisos: `META_PERMISOS_PRIVADO` (los del privado, arriba),
 * `THREADS_PERMISOS_EXTRA` (los números y las respuestas de Threads, `SCOPES_THREADS_EXTRA`),
 * `META_PERMISOS_ANUNCIOS` (leer los anuncios) y `META_PERMISOS_PROMOCIONAR` (promocionar, solo
 * junto con la de leer). Todas por la misma razón: un permiso que el caso de uso de la app no
 * tiene activado hace que la ventana rechace el pedido entero.
 *
 * `analiticaYoutube` es otra cosa: el permiso de YouTube Analytics (`PERMISO_ANALITICA`), que
 * Google no rechaza, pero que mientras no esté verificado le muestra a quien conecta el cartel de
 * «app no verificada». Lo decide `analiticaDeYoutubeAbiertaPara` por dueño: la bandera
 * `YOUTUBE_PERMISOS_ANALITICA` y la lista `YOUTUBE_ANALITICA_ABIERTO_PARA`.
 */
export type PermisosExtra = {
  privado: boolean
  threads: boolean
  anuncios: boolean
  promocionar: boolean
  analiticaYoutube?: boolean
}

export function scopesDe(network: string, extra: PermisosExtra): string | undefined {
  const base = SCOPES[network]
  if (!base) return undefined
  // Google separa sus permisos con espacios; Meta, con comas.
  if (network === 'youtube') return extra.analiticaYoutube ? `${base} ${PERMISO_ANALITICA}` : base
  const sumados = [
    extra.privado ? SCOPES_PRIVADO[network] : undefined,
    extra.threads && network === 'threads' ? SCOPES_THREADS_EXTRA : undefined,
    extra.anuncios ? SCOPES_ANUNCIOS[network] : undefined,
    extra.anuncios && extra.promocionar ? SCOPES_PROMOCIONAR[network] : undefined,
  ].filter(Boolean)
  return [base, ...sumados].join(',')
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ network: string }> },
) {
  const usuario = await usuarioActual()
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const { network } = await params
  const scope = scopesDe(network, {
    privado: env('META_PERMISOS_PRIVADO') === '1',
    threads: env('THREADS_PERMISOS_EXTRA') === '1',
    anuncios: env('META_PERMISOS_ANUNCIOS') === '1',
    promocionar: env('META_PERMISOS_PROMOCIONAR') === '1',
    analiticaYoutube: analiticaDeYoutubeAbiertaPara(usuario.id),
  })
  if (!scope) return new NextResponse('Esa red no usa OAuth', { status: 400 })

  const origin = new URL(request.url).origin

  // Una red en «Próximamente» no abre la ventana de la red aunque alguien escriba esta
  // dirección a mano: vuelve a Los Fierros con la frase, como cualquier otra vuelta.
  if (proximamentePara(usuario.id).has(network)) {
    return NextResponse.redirect(`${origin}${conMensaje('/admin/accounts', fraseProximamente(network))}`)
  }
  const redirectUri = `${origin}/api/social/${network}/callback`

  // `?login=instagram`: Instagram con el login de Instagram, sin página de Facebook
  // (`social/instagram-login.ts`). Vuelve al mismo callback que el de Facebook, y el state
  // firmado es lo que le dice cuál fue. Mientras Meta no apruebe sus permisos, solo para quien
  // lo tiene abierto (`loginDeInstagramAbiertoPara`).
  const loginDeInstagram = network === 'instagram' && new URL(request.url).searchParams.get('login') === 'instagram'
  if (loginDeInstagram && !loginDeInstagramAbiertoPara(usuario.id)) {
    return NextResponse.redirect(`${origin}${conMensaje('/admin/accounts', LOGIN_DE_INSTAGRAM_CERRADO)}`)
  }

  // A signed, short-lived state is what stops a stranger's callback from writing
  // their tokens into this dashboard.
  const state = await signOAuthState(network, usuario.id, loginDeInstagram ? 'instagram' : undefined)

  // «Agregar cuenta →» llega con `?agregar=1`: la vuelta tiene que saber que se quería una
  // cuenta más, para no decir «conectado» si la red solo renovó la de antes. Va en una cookie
  // corta en la ruta de esta red; sin la marca, se borra la de un intento anterior.
  const agregar = new URL(request.url).searchParams.get('agregar') === '1'
  const ir = (destino: URL) => {
    const response = NextResponse.redirect(destino)
    const ruta = `/api/social/${network}`
    if (agregar) {
      response.cookies.set(COOKIE_AGREGAR, network, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: ruta })
    } else {
      response.cookies.delete({ name: COOKIE_AGREGAR, path: ruta })
    }
    return response
  }

  if (loginDeInstagram) {
    // El «Instagram app ID» del caso de uso de Instagram, que no es el id de la app de Meta.
    const appId = env('INSTAGRAM_LOGIN_APP_ID')
    if (!appId) return new NextResponse('Falta INSTAGRAM_LOGIN_APP_ID', { status: 400 })

    const url = new URL(AUTORIZAR_LOGIN_DE_INSTAGRAM)
    url.searchParams.set('client_id', appId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', SCOPES_LOGIN_DE_INSTAGRAM)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    // Con una sesión de Instagram abierta en el navegador, la ventana autorizaría con esa cuenta
    // sin preguntar, y «Agregar con Instagram →» volvería con la de antes: así pide entrar
    // siempre, como TikTok con `disable_auto_auth`.
    url.searchParams.set('force_reauth', 'true')
    return ir(url)
  }

  if (network === 'instagram' || network === 'facebook') {
    const appId = env('INSTAGRAM_APP_ID')
    if (!appId) return new NextResponse('Falta INSTAGRAM_APP_ID', { status: 400 })

    const url = new URL('https://www.facebook.com/v23.0/dialog/oauth')
    url.searchParams.set('client_id', appId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', scope)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    return ir(url)
  }

  if (network === 'youtube') {
    const clientId = env('GOOGLE_CLIENT_ID')
    if (!clientId) return new NextResponse('Falta GOOGLE_CLIENT_ID', { status: 400 })

    // access_type=offline + prompt=consent is the pair that makes Google hand over a
    // refresh token even on re-consent; without it the second connect gets none and
    // the hourly access token dies with no way back. select_account, además, hace que
    // Google pregunte siempre con qué cuenta entrar: sin eso, con una sola sesión abierta,
    // «Agregar cuenta →» volvía con el mismo canal.
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', scope)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('access_type', 'offline')
    url.searchParams.set('prompt', 'select_account consent')
    url.searchParams.set('state', state)
    return ir(url)
  }

  if (network === 'threads') {
    const appId = env('THREADS_APP_ID')
    if (!appId) return new NextResponse('Falta THREADS_APP_ID', { status: 400 })

    const url = new URL('https://threads.net/oauth/authorize')
    url.searchParams.set('client_id', appId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', scope)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    return ir(url)
  }

  if (network === 'x') {
    const clientId = env('X_CLIENT_ID')
    if (!clientId) return new NextResponse('Falta X_CLIENT_ID', { status: 400 })

    // PKCE: the verifier must come back at the callback but never travel through X's
    // servers — a short-lived httpOnly cookie is the only channel that satisfies both.
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')

    const url = new URL('https://x.com/i/oauth2/authorize')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', scope)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')

    const response = ir(url)
    response.cookies.set('x_pkce_verifier', verifier, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 600,
      path: '/api/social/x',
    })
    return response
  }

  const clientKey = env('TIKTOK_CLIENT_KEY')
  if (!clientKey) return new NextResponse('Falta TIKTOK_CLIENT_KEY', { status: 400 })

  const url = new URL('https://www.tiktok.com/v2/auth/authorize/')
  url.searchParams.set('client_key', clientKey)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('scope', scope)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('state', state)
  // Con una sesión de TikTok abierta en el navegador, TikTok autoriza solo y vuelve en
  // segundos, sin mostrar nada: «Agregar cuenta →» parecía no hacer nada y renovaba la de
  // antes. Con esto muestra siempre su pantalla, con la cuenta que va a autorizar.
  url.searchParams.set('disable_auto_auth', '1')
  return ir(url)
}
