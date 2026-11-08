import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { soloEnElPanel, telefonoDesdeCampos, textoDe, type ReglaDeBorrador, type TikTokInicial } from './borrador'
import type { BorradorCargado, BorradorResumido, MediaDeBorrador } from './borradores'
import { isoInZone } from './metrics-api'
import { redesDelTelefono } from './mobile-api'
import { networkLabel } from './networks'
import type { MusicaInstagram } from './social/publish/opciones'

// Los borradores vistos desde la app del teléfono. La base es la misma del compositor
// (`borradores.ts`): un borrador empezado en un lado se sigue en el otro. Lo que cambia es
// la forma —el teléfono no habla en campos de formulario— y que el teléfono no ve todo:
// ver `soloEnElPanel`.

/** Un borrador en La Parrilla del teléfono: la lista y, si tiene fecha, su día. */
export type BorradorResumidoMovil = {
  id: string
  texto: string
  /** El instante con la zona del dueño, como `cuando` de un post; null sin fecha. */
  cuando: string | null
  guardado: string
  archivos: number
}

/** Un borrador abierto en Publicar. */
export type BorradorMovilAbierto = {
  id: string
  texto: string
  cuentas: string[]
  cuando: string | null
  trial: string[]
  /** La canción de «Música de Instagram» de cada cuenta que la lleva. */
  musica: Record<string, MusicaInstagram>
  /** Si es una historia: Publicar abre en «Historia», con los archivos en el orden en que salen. */
  historia: boolean
  media: MediaDeBorrador[]
  /** Lo que el bloque de TikTok de cada cuenta tenía elegido (`tiktokInicial`). */
  tiktok: Record<string, TikTokInicial>
  /** La regla de palabra clave, o null si no tiene. */
  regla: ReglaDeBorrador | null
  /** Por qué no se programa desde el teléfono, o null si se puede. */
  soloEnElPanel: string | null
}

/**
 * Las cuentas del dueño partidas en dos: las que la app publica, y las que no con el nombre de su
 * red. Las primeras son las únicas que un borrador guardado desde el teléfono puede elegir; las
 * segundas se conservan sin que el teléfono las toque. Las de TikTok son de las primeras solo si
 * la app trae su bloque (`conTikTok`); `tiktok` las nombra, para leer sus opciones al guardar.
 */
export async function cuentasParaElTelefono(
  ownerId: string,
  conTikTok = false,
): Promise<{ propias: Set<string>; ajenas: Map<string, string>; tiktok: Set<string> }> {
  const filas = await getDb()
    .select({ id: socialAccounts.id, network: socialAccounts.network })
    .from(socialAccounts)
    .where(eq(socialAccounts.ownerId, ownerId))
  const redes = redesDelTelefono(conTikTok)
  const propias = new Set<string>()
  const ajenas = new Map<string, string>()
  const tiktok = new Set<string>()
  for (const f of filas) {
    if (redes.has(f.network)) propias.add(f.id)
    else ajenas.set(f.id, networkLabel(f.network))
    if (f.network === 'tiktok' && redes.has('tiktok')) tiktok.add(f.id)
  }
  return { propias, ajenas, tiktok }
}

export function resumirParaElTelefono(b: BorradorResumido, zona: string): BorradorResumidoMovil {
  return {
    id: b.id,
    texto: textoDe(b.campos),
    cuando: b.fecha ? isoInZone(b.fecha, zona) : null,
    guardado: isoInZone(b.actualizadoEn, zona),
    archivos: b.archivos,
  }
}

/**
 * Las cuentas que la app no publica no se mandan: no tiene cómo mostrarlas, y al guardar se
 * conservan solas (`camposDesdeTelefono`). Que están, lo dice `soloEnElPanel`, que también avisa
 * de la palabra clave si la app no la muestra (`conRegla`).
 */
export function abrirEnElTelefono(
  b: BorradorCargado,
  zona: string,
  ajenas: ReadonlyMap<string, string>,
  { conRegla = false }: { conRegla?: boolean } = {},
): BorradorMovilAbierto {
  const { texto, cuentas, trial, musica = {}, historia = false, tiktok = {}, regla = null } = telefonoDesdeCampos(b.campos)
  const visibles = cuentas.filter((id) => !ajenas.has(id))
  return {
    id: b.id,
    texto,
    cuentas: visibles,
    trial,
    historia,
    musica,
    cuando: b.fecha ? isoInZone(b.fecha, zona) : null,
    media: b.media,
    tiktok: Object.fromEntries(Object.entries(tiktok).filter(([id]) => visibles.includes(id))),
    regla,
    soloEnElPanel: soloEnElPanel(b.campos, ajenas, { conRegla }),
  }
}
