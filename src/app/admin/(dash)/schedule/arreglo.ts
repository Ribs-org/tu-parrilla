// Qué arreglo se ofrece al lado de un destino quemado. Puro: «Se quemó» y el editor lo
// preguntan igual, y acá se lo puede pinchar con un test sin pintar nada.

import { MOTIVOS_DE_CONEXION } from '@/lib/social/publish/conexion'
import { FACEBOOK_MIXED_MEDIA } from '@/lib/social/publish/facebook'
import { TRIAL_REEL_MEDIA } from '@/lib/social/publish/opciones'
import { THREADS_SINGLE_FILE } from '@/lib/social/publish/threads'
import { TIKTOK_ARCHIVO } from '@/lib/social/publish/tiktok'
import { TIKTOK_MEDIA } from '@/lib/social/publish/validate'
import { X_NO_VIDEO, X_TOO_MANY_IMAGES } from '@/lib/social/publish/x'
import { YOUTUBE_ONLY_VIDEO } from '@/lib/social/publish/youtube'

/** Donde se reconecta una cuenta: Los Fierros. */
export const RECONECTAR_EN = '/admin/accounts'

export type Arreglo = { texto: string; href: string }

/** Lo que se arregla cambiando los archivos del post: la red no los acepta como vienen. */
const DE_ARCHIVO: ReadonlySet<string> = new Set([
  TIKTOK_ARCHIVO,
  TIKTOK_MEDIA,
  FACEBOOK_MIXED_MEDIA,
  THREADS_SINGLE_FILE,
  X_NO_VIDEO,
  X_TOO_MANY_IMAGES,
  YOUTUBE_ONLY_VIDEO,
  TRIAL_REEL_MEDIA,
])

/**
 * El arreglo exacto de un destino quemado, cuando su motivo lo dice: «Reconectar» si la cuenta
 * perdió la conexión, «Cambiar el archivo» si la red no acepta los archivos. Lo demás —un
 * rechazo sin explicación, una red que no respondió— no tiene más arreglo que «Reprogramar»,
 * que va siempre aparte, y esto devuelve `null`.
 *
 * Se compara contra las constantes que escriben `lastError`, no contra texto libre. Casi todas
 * son frases fijas; las de un rechazo de Instagram nombran la cuenta y citan a Meta
 * (`rechazoDeInstagram` y compañía, en `social/publish/publisher.ts`), y como no están en
 * estas listas caen en `null`, igual que una frase nueva: es lo seguro, no ofrece un arreglo
 * que no sabe si sirve.
 *
 * `archivoHref` es adónde lleva «Cambiar el archivo»: los archivos del editor de ese post
 * (`#media`). Guardar el editor vuelve a poner en la parrilla el destino quemado
 * (`rearmIds`, en `social/publish/edit.ts`).
 */
export function arregloDe(motivo: string | null, archivoHref: string): Arreglo | null {
  if (!motivo) return null
  // Lo que se arregla en Los Fierros: la cuenta perdió la conexión o el permiso.
  if (MOTIVOS_DE_CONEXION.has(motivo)) return { texto: 'Reconectar', href: RECONECTAR_EN }
  if (DE_ARCHIVO.has(motivo)) return { texto: 'Cambiar el archivo', href: archivoHref }
  return null
}
