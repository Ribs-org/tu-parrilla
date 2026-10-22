import { and, eq } from 'drizzle-orm'
import {
  borradores,
  creativos,
  getDb,
  reglasClave,
  scheduledPostMedia,
  scheduledPosts,
  scheduledPostTargets,
  type Creativo,
} from '@/db'
import { servirSiTermino } from '@/lib/cocina/meson'
import type { CuentaDestino } from '../cuentas'
import type { ReglaLimpia } from '../comentarios/reglas'
import { validateAtributos, type Atributos } from './atributos'
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
 * El borrador salía de un creativo del mesón que ya no está en un borrador: no se creó nada.
 */
export class CreativoNoEsta extends Error {
  constructor() {
    super('El creativo ya no está.')
    this.name = 'CreativoNoEsta'
  }
}

/** Los atributos de un creativo con su pieza y su estilo, para que Los Números compare versiones y estilos. */
function atributosDelCreativo(c: Creativo): Atributos | null {
  const juntos = { ...(c.atributos ?? {}), ...(c.pieza ? { pieza: c.pieza } : {}), ...(c.estilo ? { estilo: c.estilo } : {}) }
  const r = validateAtributos(juntos)
  if (!('error' in r)) return r.atributos
  // Si con la pieza y el estilo pasan del tope, van los del chef tal cual.
  const solos = validateAtributos(c.atributos)
  return 'error' in solos ? null : solos.atributos
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
 * Un borrador que salió del mesón (`borradores.creativo_id`) le pone al post lo del creativo: su
 * portada, si el post lleva video; sus atributos, con su pieza y su estilo, y en cada destino de
 * YouTube su título como primera línea del texto (`captionOverride`), que es de donde YouTube saca
 * el título. El título es el del compositor (`tituloYoutube`) si llegó, aunque venga vacío, y si no
 * el del chef. El creativo queda programado en la misma transacción, y si ya no estaba en un
 * borrador, no se crea nada (`CreativoNoEsta`).
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
    /** El título de YouTube del compositor, para un borrador del mesón. Sin él, el del chef. */
    tituloYoutube?: string | null
  },
): Promise<string> {
  const { id, comandaId } = await getDb().transaction(async (tx) => {
    let creativo: Creativo | null = null
    if (input.borradorId) {
      const consumidos = await tx
        .delete(borradores)
        .where(and(eq(borradores.id, input.borradorId), eq(borradores.ownerId, ownerId)))
        .returning({ id: borradores.id, creativoId: borradores.creativoId })
      if (consumidos.length === 0) throw new BorradorConsumido()
      const creativoId = consumidos[0]!.creativoId
      if (creativoId) {
        const [c] = await tx
          .select()
          .from(creativos)
          .where(and(eq(creativos.id, creativoId), eq(creativos.ownerId, ownerId), eq(creativos.estado, 'borrador')))
        if (!c) throw new CreativoNoEsta()
        creativo = c
      }
    }

    const conVideo = input.media.some((m) => m.mediaType === 'video')
    const [post] = await tx
      .insert(scheduledPosts)
      .values({
        ownerId,
        caption: input.caption,
        scheduledAt: input.scheduledAt,
        ...(creativo ? { coverUrl: conVideo ? creativo.portadaUrl : null, atributos: atributosDelCreativo(creativo) } : {}),
      })
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
    const titulo = creativo ? (input.tituloYoutube ?? creativo.tituloYoutube ?? '').trim() : ''
    await tx.insert(scheduledPostTargets).values(
      input.cuentas.map((cuenta) => ({
        postId: post!.id,
        network: cuenta.network,
        accountId: cuenta.id,
        opciones: input.opciones?.[cuenta.id] ?? null,
        captionOverride: titulo && cuenta.network === 'youtube' ? `${titulo}\n${input.caption}` : null,
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
    if (creativo) {
      await tx.update(creativos).set({ estado: 'programado', postId: post!.id }).where(eq(creativos.id, creativo.id))
    }
    return { id: post!.id, comandaId: creativo?.comandaId ?? null }
  })
  // Fuera de la transacción y sin poder tumbar lo programado: si era lo último que esperaba en el
  // mesón, la comanda queda servida.
  if (comandaId) {
    await servirSiTermino(comandaId, new Date()).catch((e) => console.error('crear: servir la comanda', String(e).slice(0, 200)))
  }
  return id
}
