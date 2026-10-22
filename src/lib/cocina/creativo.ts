// Lo que el chef anuncia de un creativo antes de subirlo: sus archivos, sus textos, su pieza y
// su estilo. Puro, para probar la validación sin base; la escritura vive en `cocina.ts`.

import { validateAtributos, type Atributos } from '@/lib/social/publish/atributos'
import { MAX_REF, typeFromContentType } from '@/lib/social/publish/batch'
import { ARCHIVO_MUY_GRANDE, MAX_BYTES_ARCHIVO } from '@/lib/social/publish/limites'

/** Cuántos archivos puede traer un creativo: un carrusel de Instagram llega a veinte. */
export const MAX_ARCHIVOS_CREATIVO = 20
export const MAX_TEXTO = 2200
/** En YouTube la primera línea es el título, y no pasa de 100 caracteres. */
export const MAX_TITULO_YOUTUBE = 100
const MAX_ETIQUETA = 200

export const CREATIVO_ILEGIBLE = 'El creativo no se entendió.'
export const CREATIVO_SIN_MEDIA = 'Un creativo trae al menos un archivo que publicar.'
export const PORTADA_NO_ES_IMAGEN = 'La portada tiene que ser una imagen.'

export type ArchivoAnunciado = { nombre: string; tipo: string; mediaType: 'image' | 'video'; bytes: number; rol: 'media' | 'portada' }

export type CreativoAnunciado = {
  ref: string
  pieza: string | null
  tanda: string | null
  tipo: 'video' | 'carrusel' | 'imagen'
  texto: string
  tituloYoutube: string | null
  estilo: string | null
  atributos: Atributos | null
  duracionS: number | null
  archivos: ArchivoAnunciado[]
}

function textoOpcional(valor: unknown, max: number): string | null | undefined {
  if (valor === undefined || valor === null) return null
  if (typeof valor !== 'string' || valor.length > max) return undefined
  return valor.trim() || null
}

/**
 * Lo que trae el cuerpo de `POST /api/cocina/comandas/{id}/creativos`, ya validado, o la frase
 * de por qué no. El tipo del creativo no se pide: sale de sus archivos —un video es un video,
 * varios son un carrusel, una sola imagen es una imagen—, para que nunca diga otra cosa que lo que
 * trae.
 */
export function leerCreativo(crudo: unknown): CreativoAnunciado | { error: string } {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: CREATIVO_ILEGIBLE }
  const c = crudo as Record<string, unknown>

  const ref = typeof c.ref === 'string' ? c.ref.trim() : ''
  if (!ref || ref.length > MAX_REF) return { error: CREATIVO_ILEGIBLE }

  const texto = c.texto === undefined || c.texto === null ? '' : c.texto
  if (typeof texto !== 'string' || texto.length > MAX_TEXTO) return { error: CREATIVO_ILEGIBLE }
  const tituloYoutube = textoOpcional(c.tituloYoutube, MAX_TITULO_YOUTUBE)
  const pieza = textoOpcional(c.pieza, MAX_ETIQUETA)
  const tanda = textoOpcional(c.tanda, MAX_ETIQUETA)
  const estilo = textoOpcional(c.estilo, MAX_ETIQUETA)
  if (tituloYoutube === undefined || pieza === undefined || tanda === undefined || estilo === undefined) {
    return { error: CREATIVO_ILEGIBLE }
  }

  const validos = validateAtributos(c.atributos)
  if ('error' in validos) return { error: validos.error }
  const atributos: Atributos | null = validos.atributos

  const duracionS = c.duracionS === undefined || c.duracionS === null ? null : c.duracionS
  if (duracionS !== null && (typeof duracionS !== 'number' || !Number.isFinite(duracionS) || duracionS < 0)) {
    return { error: CREATIVO_ILEGIBLE }
  }

  if (!Array.isArray(c.archivos) || c.archivos.length === 0 || c.archivos.length > MAX_ARCHIVOS_CREATIVO) {
    return { error: Array.isArray(c.archivos) && c.archivos.length === 0 ? CREATIVO_SIN_MEDIA : CREATIVO_ILEGIBLE }
  }
  const archivos: ArchivoAnunciado[] = []
  for (const a of c.archivos as unknown[]) {
    if (typeof a !== 'object' || a === null) return { error: CREATIVO_ILEGIBLE }
    const { nombre, tipo, bytes, rol } = a as Record<string, unknown>
    if (typeof nombre !== 'string' || !nombre.trim() || nombre.length > MAX_ETIQUETA) return { error: CREATIVO_ILEGIBLE }
    if (rol !== 'media' && rol !== 'portada') return { error: CREATIVO_ILEGIBLE }
    if (typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes <= 0) return { error: CREATIVO_ILEGIBLE }
    if (bytes > MAX_BYTES_ARCHIVO) return { error: `${nombre}: ${ARCHIVO_MUY_GRANDE}` }
    const publicable = typeof tipo === 'string' ? typeFromContentType(tipo) : null
    if (!publicable) return { error: `${nombre}: ese tipo de archivo no se puede publicar.` }
    if (rol === 'portada' && publicable.mediaType !== 'image') return { error: PORTADA_NO_ES_IMAGEN }
    archivos.push({ nombre: nombre.trim(), tipo: publicable.tipo, mediaType: publicable.mediaType, bytes, rol })
  }
  const media = archivos.filter((a) => a.rol === 'media')
  if (media.length === 0) return { error: CREATIVO_SIN_MEDIA }
  if (archivos.filter((a) => a.rol === 'portada').length > 1) return { error: CREATIVO_ILEGIBLE }

  const tipo = media.length > 1 ? 'carrusel' : media[0]!.mediaType === 'video' ? 'video' : 'imagen'
  return { ref, pieza, tanda, tipo, texto, tituloYoutube, estilo, atributos, duracionS, archivos }
}
