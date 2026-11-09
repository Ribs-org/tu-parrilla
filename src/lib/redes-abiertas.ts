import { env } from './env'
import { REDES_PROXIMAMENTE } from './networks'

/**
 * Las redes en «Próximamente» para un dueño: las de `REDES_PROXIMAMENTE`, salvo Threads si su
 * id está en `THREADS_ABIERTO_PARA` (ids de usuario separados por comas). Sirve para grabar la
 * revisión de Meta de Threads con la cuenta del revisor sin abrirla para nadie más: con la app
 * en Live y sin esa aprobación, solo autoriza Threads quien tiene un rol en la app. Aprobada,
 * Threads sale de `REDES_PROXIMAMENTE` y esta variable sobra.
 *
 * Lo leen las rejas que saben de quién es la petición —conectar, programar, publicar, Los
 * Fierros, el compositor y el editor—; la portada, que no tiene dueño, sigue con la lista fija.
 */
export function proximamentePara(ownerId: string | null | undefined): ReadonlySet<string> {
  const abierto = (env('THREADS_ABIERTO_PARA') ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
  if (!ownerId || !abierto.includes(ownerId)) return REDES_PROXIMAMENTE
  return new Set([...REDES_PROXIMAMENTE].filter((red) => red !== 'threads'))
}

/**
 * Si este dueño ve «Conectar con Instagram», el login de Instagram sin página de Facebook
 * (`social/instagram-login.ts`). `INSTAGRAM_LOGIN_ABIERTO_PARA` es una lista de ids de usuario
 * separados por comas, o `1` para todos. Existe para grabar la revisión de Meta de los permisos
 * `instagram_business_*` con la cuenta del revisor sin ofrecerlo a nadie más: sin esa aprobación,
 * solo autoriza quien tiene un rol en la app. Aprobado, se pone en `1` y la reja sobra.
 *
 * Cerrado, no se ofrece en Los Fierros, y la conexión ni arranca ni termina aunque alguien
 * escriba la dirección a mano. Una cuenta que ya se conectó así sigue publicando y leyendo; su
 * «Reconectar» va por el login de Facebook.
 */
export function loginDeInstagramAbiertoPara(ownerId: string | null | undefined): boolean {
  const valor = env('INSTAGRAM_LOGIN_ABIERTO_PARA')
  if (!valor) return false
  if (valor === '1') return true
  if (!ownerId) return false
  return valor.split(',').some((id) => id.trim() === ownerId)
}

/**
 * Si el dueño ve «Lo pagado» en Los Números y la sincronización lee sus anuncios de Meta.
 * `ANUNCIOS_ABIERTO_PARA=1` lo abre para todos; una lista de ids de usuario separados por comas,
 * solo para esos —así se graba la revisión de `ads_read` con la cuenta del revisor sin
 * mostrárselo a nadie más—; vacía, para nadie. Mientras `ads_read` no esté aprobado, solo quien
 * tiene un rol en la app de Meta puede concederlo: a los demás la lectura les fallaría cada noche
 * y verían una sección siempre vacía.
 */
export function anunciosAbiertosPara(ownerId: string | null | undefined): boolean {
  const bandera = env('ANUNCIOS_ABIERTO_PARA')
  if (!bandera) return false
  if (bandera === '1') return true
  if (!ownerId) return false
  return bandera.split(',').some((id) => id.trim() === ownerId)
}

/**
 * Si el dueño puede promocionar desde Tu Parrilla: a quien ve «Lo pagado», y solo con las dos
 * banderas del conectar puestas (`META_PERMISOS_ANUNCIOS` y `META_PERMISOS_PROMOCIONAR`), que son
 * las que piden `ads_management`. Sin ellas el botón llevaría a un formulario que Meta rechaza.
 */
export function promocionarAbiertoPara(ownerId: string | null | undefined): boolean {
  return anunciosAbiertosPara(ownerId) && env('META_PERMISOS_ANUNCIOS') === '1' && env('META_PERMISOS_PROMOCIONAR') === '1'
}

/**
 * Si el dueño puede activar TikTok for Business (`social/tiktok-business.ts`): ver «Activar TikTok
 * for Business (comentarios y números) →» en el detalle de sus cuentas de TikTok, que La Mesa
 * traiga y responda los comentarios de las que activó, que la sincronización lea sus números
 * (`social/tiktok-numeros.ts`) —la cuenta y su audiencia, cada video más a fondo y la comparación
 * con cuentas parecidas, en Los Números— y que el compositor ofrezca «Lo que se busca en TikTok».
 *
 * La variable se sigue llamando `TIKTOK_COMENTARIOS_ABIERTO_PARA` porque nació para los
 * comentarios y ya está puesta en el despliegue; hoy es la reja de toda la app de TikTok for
 * Business. `1` la abre para todos; una lista de ids de usuario separados por comas, solo para
 * esos —así se graba la revisión de la app con la cuenta del revisor—; vacía, para nadie, que es
 * como nace. Hacen falta además la app (`TIKTOK_BUSINESS_APP_ID`, `TIKTOK_BUSINESS_SECRET`) y su
 * enlace de autorización (`TIKTOK_BUSINESS_AUTORIZACION`): sin ellos, cerrado igual.
 */
export function tiktokBusinessAbiertoPara(ownerId: string | null | undefined): boolean {
  if (!env('TIKTOK_BUSINESS_APP_ID') || !env('TIKTOK_BUSINESS_SECRET') || !env('TIKTOK_BUSINESS_AUTORIZACION')) {
    return false
  }
  const bandera = env('TIKTOK_COMENTARIOS_ABIERTO_PARA')
  if (!bandera) return false
  if (bandera === '1') return true
  if (!ownerId) return false
  return bandera.split(',').some((id) => id.trim() === ownerId)
}

/**
 * Si el dueño ve los números de YouTube Analytics en Los Números y la sincronización los lee de
 * sus canales (`social/analitica-youtube.ts`). Hacen falta las dos variables:
 * `YOUTUBE_PERMISOS_ANALITICA=1`, que dice que el permiso `yt-analytics.readonly` ya está agregado
 * en la consola de Google, y `YOUTUBE_ANALITICA_ABIERTO_PARA`, con `1` para todos o una lista de
 * ids de usuario separados por comas —la cuenta del revisor de Google mientras revisa—; vacía,
 * para nadie, que es como nace.
 *
 * Lo mismo decide si el conectar pide el permiso (`connect/route.ts`): la pantalla de Google se
 * verificó el 2026-10-14 sin él, y pedir un permiso sin verificar le muestra a quien conecta el
 * cartel de «app no verificada». Así, mientras Google revisa, solo lo ve quien está en la lista.
 */
export function analiticaDeYoutubeAbiertaPara(ownerId: string | null | undefined): boolean {
  if (env('YOUTUBE_PERMISOS_ANALITICA') !== '1') return false
  const bandera = env('YOUTUBE_ANALITICA_ABIERTO_PARA')
  if (!bandera) return false
  if (bandera === '1') return true
  if (!ownerId) return false
  return bandera.split(',').some((id) => id.trim() === ownerId)
}

/**
 * Si el dueño ve «Pasar a Maestro Parrillero» en Tu Cuenta, el cobro del plan pagado con Mercado Pago
 * (`src/lib/pagos/`). `PAGOS_ABIERTO_PARA=1` lo abre para todos; una lista de ids de usuario separados
 * por comas, solo para esos —para probarlo con una cuenta de prueba de Mercado Pago sin ofrecérselo a
 * nadie más—; vacía, para nadie. Se abre a todos después de que `/terminos` y `/privacidad` cuenten
 * el cobro (`docs/pendientes.md`). Una suscripción ya tomada sigue cobrándose aunque se cierre.
 */
export function pagosAbiertosPara(ownerId: string | null | undefined): boolean {
  const bandera = env('PAGOS_ABIERTO_PARA')
  if (!bandera) return false
  if (bandera === '1') return true
  if (!ownerId) return false
  return bandera.split(',').some((id) => id.trim() === ownerId)
}
