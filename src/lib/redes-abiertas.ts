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
