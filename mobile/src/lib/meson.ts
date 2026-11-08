import type { Tema } from './tema'

/*
 * El mesón (de día, la bandeja) en el teléfono: lo que el chef entregó, para verlo, programarlo o
 * descartarlo. Lo que manda `GET /api/mobile/cocina/meson` (`src/lib/cocina/meson-telefono.ts` en la
 * raíz) y las frases de la pantalla, que copian las de la página del panel
 * (`src/app/admin/(dash)/ia/meson/`).
 */

export type MediaDelCreativo = { url: string; mediaType: 'image' | 'video' }

export type CreativoDelMeson = {
  id: string
  tipo: 'video' | 'carrusel' | 'imagen'
  texto: string
  tituloYoutube: string | null
  estilo: string | null
  duracionS: number | null
  portadaUrl: string | null
  media: MediaDelCreativo[]
  /** Lo que rotó el chef, ya como «clave: valor». */
  atributos: string[]
  /** «Se borra el 09-11-2026 si no lo programas.», en su última semana. */
  seBorra: string | null
}

export type ComandaEnElMeson = {
  id: string
  principal: string | null
  creadaEn: string
  piezas: { pieza: string | null; creativos: CreativoDelMeson[] }[]
}

export type MotivoDeDescarte = { valor: string; nombre: string }

export type ElMeson = {
  comandas: ComandaEnElMeson[]
  enBorradores: number
  motivos: MotivoDeDescarte[]
  maxNota: number
}

/** Contra un servidor de antes, que no tiene la ruta: en vez de «No se pudo actualizar.». */
export const MESON_SIN_SERVIDOR: Record<Tema, string> = {
  noche: 'Tu Parrilla todavía no muestra el mesón en el teléfono. Mientras, míralo en La Cocina del panel web.',
  dia: 'Tu Parrilla todavía no muestra la bandeja en el teléfono. Mientras, mírala en La Cocina del panel web.',
}

export const QUE_ES_EL_MESON =
  'Lo que el chef te entregó, listo para programar. Las versiones de una misma pieza —la misma idea en estilos distintos— van juntas. Programa las que te gusten y descarta las que no, diciendo por qué: el chef aprende de eso. Lo que nadie programa en 30 días se borra solo.'

export const COMO_SE_PROGRAMA =
  '«Programar» lo deja en tus borradores y lo abre en Publicar, donde eliges las cuentas y la hora. La portada, los atributos y el título de YouTube los pone Tu Parrilla al programarlo. Para TikTok, prográmalo desde el panel web.'

export const MESON_VACIO: Record<Tema, string> = {
  noche: 'Todavía no hay nada en el mesón.',
  dia: 'Todavía no hay nada en la bandeja.',
}

export const VER_TODO: Record<Tema, string> = { noche: 'Ver todo el mesón', dia: 'Ver toda la bandeja' }

/** El botón de la tarjeta de una comanda que tiene algo esperando. */
export const VER_EL_MESON: Record<Tema, string> = { noche: 'Ver el mesón', dia: 'Ver la bandeja' }

/** La ruta del mesón, entero o solo de una comanda. */
export function rutaDelMeson(comandaId: string | null): string {
  return comandaId ? `/api/mobile/cocina/meson?comanda=${encodeURIComponent(comandaId)}` : '/api/mobile/cocina/meson'
}

/** «Estilo: golpes · 42 s», como la tarjeta del panel. */
export function datosDelCreativo(c: Pick<CreativoDelMeson, 'estilo' | 'duracionS'>): string {
  return `${c.estilo ? `Estilo: ${c.estilo}` : 'Sin estilo'}${c.duracionS ? ` · ${Math.round(c.duracionS)} s` : ''}`
}

/** La línea de la pieza: «Pieza «video9/08» · 3 estilos»; sin pieza, nada. */
export function rotuloDePieza(pieza: string | null, cuantos: number): string | null {
  if (!pieza) return null
  return `Pieza «${pieza}»${cuantos > 1 ? ` · ${cuantos} estilos` : ''}`
}

/** «1 espera en tus borradores de La Parrilla, con sus cuentas y su hora por elegir.» */
export function fraseEnBorradores(n: number, parrilla: string): string | null {
  if (n <= 0) return null
  return `${n === 1 ? '1 espera' : `${n} esperan`} en tus borradores de ${parrilla}, con sus cuentas y su hora por elegir.`
}

/** «Te espera 1 creativo en el mesón.», en la tarjeta de la comanda. */
export function fraseQueEspera(n: number, meson: string): string {
  return `${n === 1 ? 'Te espera 1 creativo' : `Te esperan ${n} creativos`} en ${meson.toLowerCase()}.`
}

/** Lo que apaga «Descartar»: elegir el motivo, y una nota que quepa. */
export function sePuedeDescartar(motivo: string | null, nota: string, maxNota: number): boolean {
  return motivo !== null && nota.trim().length <= maxNota
}

/** El video que se reproduce: el primero de su media, si es un video. */
export function videoDe(c: Pick<CreativoDelMeson, 'media'>): string | null {
  const primera = c.media[0]
  return primera?.mediaType === 'video' ? primera.url : null
}

/** Las imágenes del creativo: las láminas de un carrusel o la foto. */
export function imagenesDe(c: Pick<CreativoDelMeson, 'media'>): string[] {
  return c.media.filter((m) => m.mediaType === 'image').map((m) => m.url)
}
