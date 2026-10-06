// Qué dice el chip de un destino. Puro: la fila que lo dibuja no es la que decide.

import { networkLabel } from '@/lib/networks'

const ESTADO: Record<string, string> = {
  scheduled: 'Programado',
  publishing: 'Publicando…',
  published: 'Publicado',
  failed: 'Falló',
}

/**
 * Quién es el destino: su red y su handle. Las dos cosas: el calendario y la cola ya
 * dibujan un icono de la red (`Redes`, en `redes.tsx`), pero este nombre sigue haciendo
 * falta para el `title` de cada icono, el `sr-only` y el editor, donde no hay icono. Y la
 * red sola no distingue dos cuentas de la misma red en el mismo corte, que es la lectura
 * que importa.
 *
 * Sin handle queda el nombre de la red, que ahí no es ambiguo: una cuenta sin handle es
 * una que todavía no sincronizó.
 */
export function nombreDestino(destino: { network: string; handle: string | null }): string {
  const red = networkLabel(destino.network)
  return destino.handle ? `${red} · ${destino.handle}` : red
}

/**
 * Cómo va ese destino: programado, publicando, en la bandeja de TikTok. «Publicado» en
 * TikTok tiene dos formas: el post en el perfil, o el borrador que llegó a la bandeja
 * del dueño para terminarlo desde el teléfono. El segundo no tiene id de video —no
 * existe hasta que el dueño lo publique— y el chip lo dice.
 *
 * Un destino que falló y todavía tiene intentos vuelve a `scheduled` con su `lastError`
 * puesto (`resolveOutcome`, en `social/publish/publisher.ts`); nada más deja un motivo en
 * un destino programado, porque reprogramar y editar lo borran. Por eso «programado con
 * motivo» se lee como «reintentando», y no como uno que nunca se intentó.
 */
export function etiquetaDestino(target: {
  network: string
  status: string
  externalId: string | null
  opciones: unknown
  lastError?: string | null
}): string {
  if (target.network === 'tiktok' && target.status === 'published' && esBorrador(target.opciones)) {
    return 'En tu bandeja de TikTok'
  }
  if (target.status === 'scheduled' && target.lastError) return 'Reintentando'
  return ESTADO[target.status] ?? target.status
}

/**
 * Por qué un destino no salió, si hay algo que contar: el motivo del último intento
 * mientras espera el siguiente, o el que lo dejó quemado. Antes solo se mostraba el
 * segundo, y un reintento escondía el error real hasta que se agotaban los intentos.
 *
 * En publicado y publicando no hay motivo: esos estados ya lo limpian al escribirse, y
 * filtrarlos aquí también evita que un dato viejo diga que algo falló cuando no.
 */
export function motivoDestino(target: { status: string; lastError: string | null }): string | null {
  if (target.status !== 'scheduled' && target.status !== 'failed') return null
  return target.lastError || null
}

function esBorrador(opciones: unknown): boolean {
  return typeof opciones === 'object' && opciones !== null && (opciones as { modo?: unknown }).modo === 'borrador'
}

/**
 * Qué tiñe el icono de un destino. Solo dos cosas: que se quemó (rojo) o que ya salió
 * (verde). Programado y publicando quedan sin teñir a propósito —el color del corte lo
 * pone la cocción, y un icono de colores encima competiría con ella—, y siguen devolviendo
 * `'gris'` como nombre del caso aunque el icono no pinte gris: sobre la carne cruda el
 * atenuado no llega al mínimo de contraste, así que ese caso pinta con el color del texto
 * a opacidad plena (`redes.tsx` decide la clase).
 */
export function colorDeDestino(status: string): 'gris' | 'positivo' | 'negativo' {
  if (status === 'failed') return 'negativo'
  if (status === 'published') return 'positivo'
  return 'gris'
}
