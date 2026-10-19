import 'server-only'
import { cookies } from 'next/headers'
import { TEMA_COOKIE, temaDe, temaDelEnlace, type Tema } from './tema'

/**
 * El modo de este equipo, de su cookie. Lo leen la puerta (`ingresar`) y la portada, que se
 * dibujan antes de saber de quién es, y el color de la barra del navegador del panel. Adentro
 * del panel manda el de la cuenta (`usuario.tema`), y el botón del modo pone la cookie al día si
 * cambió en otro lado.
 */
export async function temaPedido(): Promise<Tema> {
  return temaDe((await cookies()).get(TEMA_COOKIE)?.value)
}

/**
 * El modo de la portada: el que pide su dirección (`?modo=dia`) o, sin eso, el de este equipo.
 * `delEnlace` dice si vino de la dirección, para que el botón del modo lo anote en el equipo.
 */
export async function temaDeLaPortada(modo: string | string[] | undefined): Promise<{ tema: Tema; delEnlace: boolean }> {
  const pedido = temaDelEnlace(modo)
  return pedido ? { tema: pedido, delEnlace: true } : { tema: await temaPedido(), delEnlace: false }
}
