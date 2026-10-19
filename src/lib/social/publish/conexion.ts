import { NO_PUBLISH_TOKEN } from './publisher'
import { TIKTOK_RECONECTAR, TIKTOK_SIN_CUENTA } from './tiktok-creador'

/**
 * Los motivos con que un destino falla porque la cuenta perdió la conexión o el permiso, no
 * por el post: se arreglan reconectando en Los Fierros. Los leen dos sitios que no pueden
 * desacordarse: «Se quemó», que por ellos ofrece «Reconectar» (`schedule/arreglo.ts`), y la
 * corrida de publicación, que por ellos no manda un correo por post sino uno por cuenta
 * (`marcarCaida`, en `lib/avisos/run.ts`).
 */
export const MOTIVOS_DE_CONEXION: ReadonlySet<string> = new Set([NO_PUBLISH_TOKEN, TIKTOK_RECONECTAR, TIKTOK_SIN_CUENTA])
