import type { PostProgramado } from './tipos'

/**
 * Lo que se le explica a quien mandó un video a la bandeja de TikTok: la API de la bandeja recibe
 * solo el archivo (`cuerpoInit`, en `src/lib/social/publish/tiktok.ts` del sitio), así que el
 * texto hay que pegarlo al terminarlo en TikTok. Las fotos sí lo llevan y no se les dice. Es la
 * misma frase que el panel (`BANDEJA_SIN_TEXTO`, en `copiar-texto.tsx`), más corta: va en la
 * tarjeta.
 */
export const BANDEJA_SIN_TEXTO = 'TikTok no recibe el texto de un video en la bandeja: pégalo al terminarlo allá.'

/**
 * Qué copia «Copiar el texto» en la tarjeta de un post: su texto, si alguno de sus destinos espera
 * en la bandeja de TikTok (el sello `bandeja`, que decide el servidor). `video` dice si hay que
 * explicar por qué: solo la entraña es un video; un servidor de antes no manda el formato, y ahí
 * no se explica lo que no se sabe. Null si no hay nada en la bandeja o nada que copiar.
 */
export function copiaDeLaBandeja(post: PostProgramado): { texto: string; video: boolean } | null {
  if (!post.redes.some((r) => r.sello === 'bandeja')) return null
  if (!post.texto.trim()) return null
  return { texto: post.texto, video: post.formato === 'entrana' }
}
