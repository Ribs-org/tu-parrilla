'use server'

import { requireUser } from '@/lib/auth'
import {
  cancionDeLaCuenta,
  leerPedidoDeSugerencia,
  musicaDeLaCuenta,
  sugerenciaParaLaCuenta,
} from '@/lib/musica-instagram'
import type { CancionInstagram } from '@/lib/social/instagram-audio'
import type { Sugerencia } from '@/lib/social/musica-sugerencia'

// «Música de Instagram» en el compositor: buscar, escuchar y «Sugiéreme una». Cada una ata la
// cuenta al dueño de la sesión (`cuentaDeMusica`): una cuenta ajena contesta igual que una que no
// existe. Ninguna escribe nada; la canción elegida viaja con el formulario al programar.

/** Lo que está sonando (sin `busqueda`) o lo que encuentra una búsqueda. */
export async function buscarMusicaAccion(
  cuentaId: string,
  busqueda: string | null,
): Promise<{ canciones: CancionInstagram[] } | { error: string }> {
  const usuario = await requireUser()
  return musicaDeLaCuenta(usuario.id, cuentaId, typeof busqueda === 'string' ? busqueda : null)
}

/** Una canción por su id, con su muestra al día: para escuchar la de un borrador. */
export async function cancionAccion(
  cuentaId: string,
  audioId: string,
): Promise<{ cancion: CancionInstagram | null } | { error: string }> {
  const usuario = await requireUser()
  return cancionDeLaCuenta(usuario.id, cuentaId, typeof audioId === 'string' ? audioId : '')
}

/** «Sugiéreme una» y «Otra»: `vistas` son las ya mostradas, que no se repiten. */
export async function sugerirMusicaAccion(
  cuentaId: string,
  pedido: { texto: string; vistas: string[]; busquedas: string[] | null },
): Promise<{ sugerencia: Sugerencia; busquedas: string[] } | { agotadas: true; busquedas: string[] } | { error: string }> {
  const usuario = await requireUser()
  return sugerenciaParaLaCuenta(usuario.id, cuentaId, leerPedidoDeSugerencia(pedido))
}
