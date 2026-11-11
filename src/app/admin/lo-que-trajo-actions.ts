'use server'

import { requireUser } from '@/lib/auth'
import { celebrar } from '@/lib/hitos'
import { dejarLaMarca } from '@/lib/lo-que-trajo'
import { esUuid } from '@/lib/uuid'

// «Lo que trajo», en La Parrilla del panel: lo que se anota al mirar. Las mismas marcas que deja la
// app del teléfono (`/api/mobile/cortes/{id}/visto` y `/api/mobile/hitos/{id}/celebrado`), así que
// lo que se mira en un lado ya no aparece como nuevo en el otro. El dueño sale siempre de la sesión,
// y un id ajeno contesta igual que uno que no existe: no se anota nada.
//
// Ninguna revalida: el detalle y la celebración ya muestran lo que había, y volver a dibujar la
// página borraría lo nuevo antes de que se alcance a leer. La fila se pone al día al cerrar el
// panel, que es navegar.

/** El dueño abrió el detalle de un corte: su circulito vuelve a cero (`cortes_vistos`). */
export async function mirarCortePropio(id: unknown): Promise<void> {
  const usuario = await requireUser()
  if (typeof id !== 'string' || !esUuid(id)) return
  await dejarLaMarca(usuario.id, id, new Date())
}

/** El panel mostró la celebración de un hito: queda celebrado, aquí y en el teléfono. */
export async function celebrarHitoPropio(id: unknown): Promise<void> {
  const usuario = await requireUser()
  if (typeof id !== 'string' || !esUuid(id)) return
  await celebrar(usuario.id, id, new Date())
}
