import 'server-only'
import { and, eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { ensureYoutubeCredential } from './social/publish/youtube'
import { MemoriaDePlaylists, PLAYLISTS_SIN_PERMISO, listarPlaylists, type PlaylistYoutube } from './social/playlists-youtube'
import { esUuid } from './uuid'

// «Agregar a una playlist» para el panel y el teléfono: la cuenta del dueño, su token y la memoria
// corta de sus playlists. La acción del compositor (`admin/playlists-actions.ts`) y la ruta del
// teléfono (`api/mobile/youtube/playlists`) solo traducen esto.

export const CUENTA_SIN_PLAYLISTS = 'Esa cuenta no es un canal de YouTube tuyo conectado.'

const memoria = new MemoriaDePlaylists()

/**
 * Las playlists del canal, solo si la cuenta es del dueño, de YouTube y está conectada. Una ajena y
 * una que no existe dan la misma frase. `fresca` se salta la memoria: es «Volver a cargar», para
 * cuando se acaba de crear una playlist en YouTube.
 */
export async function playlistsDeLaCuenta(
  ownerId: string,
  cuentaId: unknown,
  { fresca = false }: { fresca?: boolean } = {},
): Promise<{ playlists: PlaylistYoutube[] } | { error: string }> {
  if (!esUuid(cuentaId)) return { error: CUENTA_SIN_PLAYLISTS }
  const [cuenta] = await getDb()
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.id, cuentaId), eq(socialAccounts.ownerId, ownerId)))
  if (!cuenta || cuenta.network !== 'youtube' || !cuenta.accessToken) return { error: CUENTA_SIN_PLAYLISTS }

  if (fresca) memoria.olvidar(cuenta.id)
  const guardadas = memoria.leer(cuenta.id)
  if (guardadas) return { playlists: guardadas }

  // El mismo token con que se publica: si venció, se renueva y queda guardado en la cuenta.
  const token = await ensureYoutubeCredential(cuenta).catch(() => null)
  if (!token) return { error: PLAYLISTS_SIN_PERMISO }
  const r = await listarPlaylists(token)
  if ('playlists' in r) memoria.guardar(cuenta.id, r.playlists)
  return r
}
