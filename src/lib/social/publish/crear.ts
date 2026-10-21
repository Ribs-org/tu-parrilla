import { and, eq } from 'drizzle-orm'
import { borradores, getDb, reglasClave, scheduledPostMedia, scheduledPosts, scheduledPostTargets } from '@/db'
import type { CuentaDestino } from '../cuentas'
import type { ReglaLimpia } from '../comentarios/reglas'
import type { OpcionesDestino } from './opciones'

export type MediaSubida = { url: string; mediaType: 'image' | 'video' }

/**
 * El borrador del que salía el post ya no estaba: otro envío lo programó —el teléfono que
 * repite un envío cuya respuesta se perdió, otra pestaña— o se descartó. No se creó nada.
 */
export class BorradorConsumido extends Error {
  constructor() {
    super('El borrador ya no existe.')
    this.name = 'BorradorConsumido'
  }
}

/**
 * Las inserciones de un post programado, en el orden que el resto del sistema espera: el
 * post, su media en posición de carrusel, un target por cuenta elegida con lo que esa cuenta
 * exigió elegir, y su regla. Compartido por el compositor web y la ruta móvil para que ambos
 * escriban exactamente lo mismo. La media ya vive en el almacén: subirla es problema de quien
 * llama. Las opciones llegan ya validadas por `validarOpcionesPorCuenta`.
 *
 * Todo va en una transacción: un post a medio escribir —sin destinos, que no aparece en
 * ninguna pantalla y no se puede ni abrir ni borrar, o sin su media— no puede quedar. Si sale
 * de un borrador (`borradorId`), el borrador se borra primero y en la misma transacción: si
 * ya no estaba, no se crea nada (`BorradorConsumido`), y si crear falla, el borrador vuelve.
 * Así un borrador se programa una sola vez aunque lleguen dos envíos a la vez.
 *
 * Las cuentas ya vienen verificadas por quien llama: esta función no habla con el
 * navegador y no tiene con qué comprobar pertenencia. Ver `verificarCuentas`.
 */
export async function crearPostProgramado(
  ownerId: string,
  input: {
    caption: string
    scheduledAt: Date
    media: MediaSubida[]
    cuentas: CuentaDestino[]
    opciones?: Record<string, OpcionesDestino>
    regla?: ReglaLimpia | null
    borradorId?: string | null
  },
): Promise<string> {
  return getDb().transaction(async (tx) => {
    if (input.borradorId) {
      const consumidos = await tx
        .delete(borradores)
        .where(and(eq(borradores.id, input.borradorId), eq(borradores.ownerId, ownerId)))
        .returning({ id: borradores.id })
      if (consumidos.length === 0) throw new BorradorConsumido()
    }

    const [post] = await tx
      .insert(scheduledPosts)
      .values({ ownerId, caption: input.caption, scheduledAt: input.scheduledAt })
      .returning()
    if (input.media.length > 0) {
      await tx.insert(scheduledPostMedia).values(
        input.media.map((m, position) => ({
          postId: post!.id,
          blobUrl: m.url,
          mediaType: m.mediaType,
          position,
        })),
      )
    }
    await tx.insert(scheduledPostTargets).values(
      input.cuentas.map((cuenta) => ({
        postId: post!.id,
        network: cuenta.network,
        accountId: cuenta.id,
        opciones: input.opciones?.[cuenta.id] ?? null,
      })),
    )
    // Ojo si alguna vez le llega una regla con `documentoUrl`: acá se inserta tal cual, sin
    // copiar el archivo. El lote (`batch.ts`) sí lo copia a R2 con `documentoToBlob` antes de
    // escribir la regla, porque `reglas_clave.documento_url` tiene que ser una URL nuestra —una
    // ajena muere cuando el tercero borre su archivo, y el barrido no protege lo que no es
    // nuestro—. Hoy ningún llamador de esta función arma ese campo; ver `docs/deuda-tecnica.md`.
    if (input.regla) {
      await tx.insert(reglasClave).values({ postId: post!.id, ...input.regla })
    }
    return post!.id
  })
}
