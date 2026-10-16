// Qué video de TikTok es cada publicación que salió por Tu Parrilla sin su id. Puro: la
// sincronización trae las filas y esto decide los pares, para poder probarlo sin base.
//
// Por qué hace falta: el id del video solo llega en `status/fetch` como
// `publicaly_available_post_id`, y TikTok no lo manda en tres casos que se dan seguido —un
// post en «Solo yo», un borrador mandado a la bandeja que el dueño termina después en su app,
// y un PUBLISH_COMPLETE que llega antes que la moderación—. Sin el id, el destino no cruza con
// las métricas del video (`attributesFor`, `src/lib/post-attributes.ts`) y el post sale sin
// sus atributos: no se sabe qué idea ni qué versión fue. La sincronización sí trae cada
// video con su id, su texto y su hora, y con eso se recupera.

/** Un destino de TikTok publicado sin id. `caption` es el texto con que salió. */
export type DestinoSinId = { id: string; caption: string; scheduledAt: Date; borrador: boolean }

/** Un video que trajo la sincronización y que ningún destino tiene todavía. */
export type VideoSinDueno = { externalId: string; caption: string | null; publishedAt: Date }

const HORA = 3_600_000
const DIA = 24 * HORA

/**
 * Cuánto antes y cuánto después de la hora programada puede aparecer el video. Un poco antes
 * porque «Subir ahora» y el reloj de TikTok no coinciden al minuto; hasta dos días después en
 * directo, por los reintentos y las 24 h que puede quedarse procesando; y un mes con un
 * borrador, que sale cuando el dueño lo termina en su app.
 */
export const ANTES_MS = HORA
export const DESPUES_DIRECTO_MS = 2 * DIA
export const DESPUES_BORRADOR_MS = 30 * DIA

/** Un post sin texto solo se cruza por la hora, y entonces con un margen corto. */
export const SIN_TEXTO_MS = 2 * HORA

/** Lo que se compara del texto: minúsculas, sin tildes y solo letras y números. */
export function normalizarTexto(texto: string | null | undefined): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/**
 * Si dos textos son el mismo post. TikTok puede devolver el texto recortado, o con algo que el
 * dueño agregó al terminar un borrador, así que basta con que el más corto sea el comienzo del
 * otro —con al menos doce caracteres, para que «hola» no cruce con todo—.
 */
export function mismoTexto(a: string, b: string): boolean {
  if (!a || !b) return false
  const [corto, largo] = a.length <= b.length ? [a, b] : [b, a]
  return corto.length >= 12 && largo.startsWith(corto)
}

/**
 * Los pares destino → id de video. Se arman de a uno, del par más cercano en el tiempo al más
 * lejano, y cada destino y cada video entran en un solo par: dos versiones de una misma idea
 * con el mismo texto, publicadas a horas distintas, quedan cada una con su video.
 */
export function emparejarVideos(destinos: readonly DestinoSinId[], videos: readonly VideoSinDueno[]): Map<string, string> {
  const candidatos: Array<{ destino: string; video: string; distancia: number }> = []
  for (const destino of destinos) {
    const texto = normalizarTexto(destino.caption)
    const desde = destino.scheduledAt.getTime() - ANTES_MS
    const hasta = destino.scheduledAt.getTime() + (texto ? (destino.borrador ? DESPUES_BORRADOR_MS : DESPUES_DIRECTO_MS) : SIN_TEXTO_MS)
    for (const video of videos) {
      const cuando = video.publishedAt.getTime()
      if (cuando < desde || cuando > hasta) continue
      // Con texto, el texto tiene que coincidir; sin texto, el video tampoco puede traerlo.
      const coincide = texto ? mismoTexto(texto, normalizarTexto(video.caption)) : !normalizarTexto(video.caption)
      if (coincide) candidatos.push({ destino: destino.id, video: video.externalId, distancia: Math.abs(cuando - destino.scheduledAt.getTime()) })
    }
  }

  candidatos.sort((a, b) => a.distancia - b.distancia)
  const pares = new Map<string, string>()
  const usados = new Set<string>()
  for (const c of candidatos) {
    if (pares.has(c.destino) || usados.has(c.video)) continue
    pares.set(c.destino, c.video)
    usados.add(c.video)
  }
  return pares
}
