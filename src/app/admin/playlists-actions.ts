'use server'

import { requireUser } from '@/lib/auth'
import { playlistsDeLaCuenta } from '@/lib/playlists-youtube'
import type { PlaylistYoutube } from '@/lib/social/playlists-youtube'

// «Agregar a una playlist» en el compositor: las playlists del canal. Ata la cuenta al dueño de la
// sesión (`playlistsDeLaCuenta`): una cuenta ajena contesta igual que una que no existe. No escribe
// nada; la playlist elegida viaja con el formulario al programar.

/** Las playlists del canal; `fresca` se salta la memoria de unos minutos («Volver a cargar»). */
export async function playlistsAccion(
  cuentaId: string,
  fresca = false,
): Promise<{ playlists: PlaylistYoutube[] } | { error: string }> {
  const usuario = await requireUser()
  return playlistsDeLaCuenta(usuario.id, cuentaId, { fresca: fresca === true })
}
