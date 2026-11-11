import type { ScheduledPost, ScheduledPostTarget } from '@/db'
import { isoInZone } from '@/lib/metrics-api'
import { formatoDe, selloDe, type Formato, type Sello } from '@/lib/parrilla'
import { esHistoria } from '@/lib/social/publish/opciones'

// Un corte de La Parrilla como lo lee el teléfono. Vivía en `api/mobile/schedule/route.ts`; salió
// acá cuando «Lo que trajo» y el detalle de un corte necesitaron dibujar el mismo corte.

/**
 * La app avisa qué cortes nuevos sabe dibujar en `X-Parrilla-Cortes` (`mobile/src/lib/api.ts`).
 * Las instalaciones que todavía no reciben la actualización por aire no lo mandan.
 */
export function aceptaChoripan(request: Request): boolean {
  return (request.headers.get('x-parrilla-cortes') ?? '').split(',').some((c) => c.trim() === 'choripan')
}

/** Una fila del `leftJoin`: un post con uno de sus destinos y el handle de su cuenta. */
export type FilaDestinoMovil = { post: ScheduledPost; target: ScheduledPostTarget; handle: string | null }

export type PostMovil = {
  id: string
  texto: string
  cuando: string
  portada: string | null
  miniatura: string | null
  /** Qué corte dibuja el teléfono: la misma silueta que el panel (`formatoDe`). */
  formato: Formato
  huesos: number
  /**
   * `sello` es la marca de ese destino en el corte (`selloDe`): la decide el servidor, que
   * es el que sabe si la cuenta se enfrió y si TikTok recibió un borrador, para que el
   * teléfono no repita la regla.
   */
  redes: Array<{
    id: string
    red: string
    handle: string | null
    estado: string
    error: string | null
    sello: Sello
    /** Un destino quemado que alguien archivó: «Se quemó» no lo muestra (`seQuemo`, en la app). */
    archivado: boolean
  }>
}

/**
 * Agrupa las filas del join en un post por id, con sus destinos juntos. Extraída para
 * poder probarla sin base —ver `api/mobile/schedule/route.test.ts`— y para que la usen también
 * «Lo que trajo» (`api/mobile/lo-que-trajo`) y el detalle de un corte (`api/mobile/cortes/[id]`).
 *
 * Cada destino lleva su propio `id` (`scheduled_post_targets.id`), no solo `red`: con
 * dos cuentas de la misma red, dos destinos del mismo post comparten `red` y solo el
 * `id` los distingue — es la clave que el Resumen y el Calendario del teléfono usan
 * para no repetir la de React entre ellos (repaso final de la rama).
 *
 * `mediaPorPost` son los archivos de cada post en su orden: la miniatura es la primera foto
 * y el formato sale de todos. `frias`, las cuentas con el fierro frío (`cuentasFrias`).
 *
 * `conChoripan`: si la app que pregunta sabe dibujar una historia (`aceptaChoripan`). A una
 * que no, la historia le llega con el corte de su archivo, como antes de que existiera: una
 * app sin actualizar que recibiera un formato desconocido se caía al dibujarlo.
 */
export function agruparPostsMovil(
  filas: FilaDestinoMovil[],
  mediaPorPost: Map<string, Array<{ blobUrl: string; mediaType: string }>>,
  zone: string,
  frias: ReadonlySet<string> = new Set(),
  conChoripan = true,
): PostMovil[] {
  const mapa = new Map<string, PostMovil>()
  for (const { post, target, handle } of filas) {
    const media = mediaPorPost.get(post.id) ?? []
    const entrada = mapa.get(post.id) ?? {
      id: post.id,
      texto: post.caption,
      cuando: isoInZone(post.scheduledAt, zone),
      portada: post.coverUrl,
      miniatura: media.find((m) => m.mediaType === 'image')?.blobUrl ?? null,
      // Una historia lo es en todos sus destinos: el primero basta para decir el corte.
      ...formatoDe(media, post.videosLiberados, conChoripan && esHistoria(target.opciones)),
      redes: [],
    }
    entrada.redes.push({
      id: target.id,
      red: target.network,
      handle,
      estado: target.status,
      error: target.lastError,
      sello: selloDe(target, frias.has(target.accountId) ? 'frio' : 'al-rojo'),
      archivado: Boolean(target.archivadoEn),
    })
    mapa.set(post.id, entrada)
  }
  return [...mapa.values()]
}

/**
 * Un corte ya leído (`CorteCargado`, de `social/publish/cortes.ts`) como lo dibuja el teléfono.
 * Sin las cuentas frías: es para lo que ya salió, y un destino servido lleva su marca igual.
 */
export function corteParaElTelefono(
  corte: { post: ScheduledPost; targets: Array<ScheduledPostTarget & { handle: string | null }>; media: Array<{ blobUrl: string; mediaType: string }> },
  zone: string,
  conChoripan: boolean,
): PostMovil {
  const filas = corte.targets.map(({ handle, ...target }) => ({ post: corte.post, target, handle }))
  return agruparPostsMovil(filas, new Map([[corte.post.id, corte.media]]), zone, new Set(), conChoripan)[0]!
}
