import 'server-only'
import { cookies } from 'next/headers'
import { TEMA_COOKIE, temaDe, type Tema } from './tema'

/**
 * El modo de este equipo, de su cookie. Lo leen la puerta (`ingresar`), que se dibuja antes de
 * saber de quién es, y el color de la barra del navegador del panel. Adentro del panel manda el
 * de la cuenta (`usuario.tema`), y el botón del modo pone la cookie al día si cambió en otro
 * lado.
 */
export async function temaPedido(): Promise<Tema> {
  return temaDe((await cookies()).get(TEMA_COOKIE)?.value)
}
