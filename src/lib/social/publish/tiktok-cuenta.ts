import 'server-only'
import { and, eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { tiktokConnector } from '@/lib/social/tiktok'
import { esUuid } from '@/lib/uuid'
import { musicaParaRecordar, type OpcionesDestino } from './opciones'
import { TIKTOK_SIN_CUENTA, consultarCreador, type CreadorTikTok } from './tiktok-creador'

// Lo de TikTok que el compositor del panel y Publicar del teléfono hacen igual, con la base: leer
// `creator_info` de una cuenta del dueño antes de mostrar el bloque, y recordar «Música de TikTok»
// después de programar. Una sola copia, para que los dos lados no se separen.

/**
 * Lo que el bloque de TikTok necesita al abrirse: nombre, avatar, qué privacidades puede elegir
 * el dueño hoy y qué interacciones tiene bloqueadas. Por la cuenta que se pide, no por «la»
 * cuenta de TikTok: con dos conectadas, las privacidades permitidas pueden diferir.
 *
 * La cuenta tiene que ser del dueño y de TikTok: sin lo segundo, el id de una cuenta propia de
 * otra red pasa el filtro del dueño y `ensureCredential` manda su token a la API de TikTok igual.
 * Un id sin forma de uuid ni se consulta: Postgres lo rechazaría con un error, no con cero filas.
 */
export async function creadorDeCuenta(
  ownerId: string,
  accountId: unknown,
): Promise<{ creador: CreadorTikTok } | { error: string }> {
  if (!esUuid(accountId)) return { error: TIKTOK_SIN_CUENTA }
  const [account] = await getDb()
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.id, accountId), eq(socialAccounts.ownerId, ownerId)))
  if (!account || account.network !== 'tiktok') return { error: TIKTOK_SIN_CUENTA }
  const token = await tiktokConnector.ensureCredential(account)
  if (!token) return { error: TIKTOK_SIN_CUENTA }
  return consultarCreador(token)
}

/**
 * «Música de TikTok» queda recordada por cuenta: el interruptor nace así la próxima vez que se
 * programen fotos ahí (`musicaParaRecordar` dice cuándo vale). Se llama después de crear el post y
 * fuera de su transacción a propósito: si esto falla, el post ya quedó programado y solo se pierde
 * el recuerdo, así que no se le dice a la persona que algo salió mal.
 */
export async function recordarMusicaTikTok(
  ownerId: string,
  opciones: Record<string, OpcionesDestino>,
  conteos: { videos: number; fotos: number },
): Promise<void> {
  try {
    for (const { cuentaId, musica } of musicaParaRecordar(opciones, conteos)) {
      await getDb()
        .update(socialAccounts)
        .set({ tiktokMusica: musica })
        .where(and(eq(socialAccounts.id, cuentaId), eq(socialAccounts.ownerId, ownerId)))
    }
  } catch (error) {
    console.error('Recordar la música de TikTok:', String(error).slice(0, 300))
  }
}
