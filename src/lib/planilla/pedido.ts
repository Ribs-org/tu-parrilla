import 'server-only'
import type { Usuario } from '@/db'
import { parseFilters } from '@/lib/filters'
import { getCuentas } from '@/lib/posts'
import { getAllProfiles } from '@/lib/profiles'
import { cuentaElegida, type Params } from '@/lib/tablero'
import type { PedidoDePlanilla } from './armar'

/**
 * Lo que pide la planilla, leído de la URL igual que Los Números lee la suya: el período
 * (`range`, o `desde` y `hasta`), la cuenta, la página y los bots. Así la planilla es la de la
 * pantalla que se está mirando. La cuenta y la página solo valen si son del dueño, como allá.
 */
export async function pedidoDesde(url: URL, usuario: Pick<Usuario, 'id' | 'zona'>): Promise<Omit<PedidoDePlanilla, 'terminarAntesDe'>> {
  const params: Params = {}
  for (const [clave, valor] of url.searchParams) {
    const antes = params[clave]
    params[clave] = antes === undefined ? valor : [...(Array.isArray(antes) ? antes : [antes]), valor]
  }
  const filters = parseFilters(params, usuario.id, usuario.zona)
  const cuentas = await getCuentas(usuario.id)
  const cuenta = cuentaElegida(params, cuentas)
  let pagina: string | null = null
  if (filters.profileId) {
    const propia = (await getAllProfiles(usuario.id)).find((p) => p.id === filters.profileId)
    // Una página ajena o borrada no muestra nada en Los Números, y aquí tampoco: el filtro queda,
    // y «Léeme» lo dice.
    pagina = propia ? `${propia.displayName} · /${propia.slug}` : 'Una página que ya no está entre las tuyas'
  }
  return { filters, cuentas, cuenta, pagina, ahora: new Date() }
}
