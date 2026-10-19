import 'server-only'
import { cookies } from 'next/headers'
import { TEMA_COOKIE, temaDe, type Tema } from './tema'

/**
 * El modo que eligió quien mira, de su cookie. Lo leen los layouts y las páginas que pintan el
 * fondo del panel (`.acerado`), para que el primer cuadro salga en el modo elegido.
 */
export async function temaPedido(): Promise<Tema> {
  return temaDe((await cookies()).get(TEMA_COOKIE)?.value)
}
