import type { Comentarista } from './comentarista'
import { facebookComentarista } from './facebook'
import { instagramComentarista } from './instagram'
import { threadsComentarista } from './threads'
import { tiktokComentarista } from './tiktok'
import { youtubeComentarista } from './youtube'

/**
 * Agregar X es un archivo y una línea acá, igual que CONNECTORS y PUBLISHERS. TikTok está siempre
 * en la lista, pero su credencial es null mientras `TIKTOK_COMENTARIOS_ABIERTO_PARA` no abra los
 * comentarios para el dueño (`social/tiktok-business.ts`), y entonces sus cuentas no se sondean.
 */
export const COMENTARISTAS: Comentarista[] = [
  instagramComentarista,
  facebookComentarista,
  youtubeComentarista,
  threadsComentarista,
  tiktokComentarista,
]

export function comentaristaFor(network: string): Comentarista | undefined {
  return COMENTARISTAS.find((c) => c.network === network)
}

export * from './comentarista'
