import 'server-only'
import { eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { soloEnElPanel, telefonoDesdeCampos, textoDe } from './borrador'
import type { BorradorCargado, BorradorResumido, MediaDeBorrador } from './borradores'
import { isoInZone } from './metrics-api'
import { REDES_MOVIL } from './mobile-api'
import { networkLabel } from './networks'

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
  media: MediaDeBorrador[]
  /** Por qué no se programa desde el teléfono, o null si se puede. */
  soloEnElPanel: string | null
}

/**
 * Las cuentas del dueño partidas en dos: las que el teléfono publica, y las que no (hoy,
 * TikTok) con el nombre de su red. Las primeras son las únicas que un borrador guardado
 * desde el teléfono puede elegir; las segundas se conservan sin que el teléfono las toque.
 */
export async function cuentasParaElTelefono(
  ownerId: string,
): Promise<{ propias: Set<string>; ajenas: Map<string, string> }> {
  const filas = await getDb()
    .select({ id: socialAccounts.id, network: socialAccounts.network })
    .from(socialAccounts)
    .where(eq(socialAccounts.ownerId, ownerId))
  const propias = new Set<string>()
  const ajenas = new Map<string, string>()
  for (const f of filas) {
    if (REDES_MOVIL.has(f.network)) propias.add(f.id)
    else ajenas.set(f.id, networkLabel(f.network))
  }
  return { propias, ajenas }
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
 * Las cuentas que el teléfono no publica no se mandan: no tiene cómo mostrarlas, y al
 * guardar se conservan solas (`camposDesdeTelefono`). Que están, lo dice `soloEnElPanel`.
 */
export function abrirEnElTelefono(b: BorradorCargado, zona: string, ajenas: ReadonlyMap<string, string>): BorradorMovilAbierto {
  const { texto, cuentas, trial } = telefonoDesdeCampos(b.campos)
  return {
    id: b.id,
    texto,
    cuentas: cuentas.filter((id) => !ajenas.has(id)),
    trial,
    cuando: b.fecha ? isoInZone(b.fecha, zona) : null,
    media: b.media,
    soloEnElPanel: soloEnElPanel(b.campos, ajenas),
  }
}
