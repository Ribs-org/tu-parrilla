import type { TipoInsumo } from '@/db/schema'
import type { ClaseMaterial } from './bodega'
import { SUBTIPOS_PRINCIPAL, type SubtipoPrincipal } from './insumos'

// Lo que se pide en una comanda, sin base: lo lee la acción que la cuelga y lo muestra el
// formulario («La comanda nueva», en `docs/superpowers/specs/2026-10-22-la-cocina-design.md`). Desde
// la cámara de frío, una comanda elige materiales de ahí: uno es el plato principal, y cada uno de
// los demás dice qué es (`docs/superpowers/specs/2026-11-02-la-bodega-design.md`). En la fase 0 no
// hay catálogo todavía, así que los estilos los elige el chef; el formulario no los ofrece.

/** Qué puede salir: lo que el chef ofrece hoy. */
export const FORMATOS = ['clips', 'carruseles'] as const
export type FormatoPedido = (typeof FORMATOS)[number]
export const NOMBRE_FORMATO: Record<FormatoPedido, string> = { clips: 'Clips verticales', carruseles: 'Carruseles' }

/** Cuántos, más o menos. */
export const CANTIDADES = ['lo-que-de', 'unos-10', 'unos-20'] as const
export type CantidadPedida = (typeof CANTIDADES)[number]
export const NOMBRE_CANTIDAD: Record<CantidadPedida, string> = {
  'lo-que-de': 'Lo que dé el material',
  'unos-10': 'Unos 10',
  'unos-20': 'Unos 20',
}

/** Qué es el plato principal, en palabras, con lo que lo explica. */
export const NOMBRE_SUBTIPO: Record<SubtipoPrincipal, string> = {
  largo: 'Un video largo',
  podcast: 'Un podcast en videollamada',
  tomas: 'Tomas sueltas',
}
export const AYUDA_SUBTIPO: Record<SubtipoPrincipal, string> = {
  largo: 'Una persona a cámara: una charla, una clase, un video editado o crudo.',
  podcast: 'Una videollamada con varias caras en mosaico.',
  tomas: 'Varias respuestas cortas de una persona.',
}

/**
 * Qué es cada video que acompaña al principal: otra cámara o la pantalla, que el chef sincroniza
 * por el audio, o algo para intercalar (un intro, un outro, b-roll). Una foto siempre es para
 * intercalar, y lo que no es video ni foto va como extra: eso no se elige.
 */
export const ROLES_DE_VIDEO = ['imagen', 'camara', 'pantalla'] as const
export type RolDeVideo = (typeof ROLES_DE_VIDEO)[number]
export const NOMBRE_ROL: Record<RolDeVideo, string> = {
  imagen: 'Para intercalar',
  camara: 'Otra cámara',
  pantalla: 'La pantalla',
}
export const AYUDA_ROL: Record<RolDeVideo, string> = {
  imagen: 'Un intro, un outro o b-roll: el chef lo pone donde va.',
  camara: 'Otro ángulo del mismo momento: el chef lo sincroniza con el principal por el audio.',
  pantalla: 'La pantalla grabada mientras hablas: también se sincroniza por el audio.',
}

/** El rol de un material en la comanda: el que se eligió si es video; si no, el que le toca por lo que es. */
export function rolEnLaComanda(clase: ClaseMaterial, elegido: RolDeVideo): Exclude<TipoInsumo, 'principal'> {
  if (clase === 'video') return elegido
  return clase === 'imagen' ? 'imagen' : 'extra'
}

/** Cuántos materiales acompañan al principal: dos de cuatro videos y cuatro fotos caben de sobra. */
export const MAX_ACOMPANAMIENTOS = 20
/** Lo que cabe en «Tu instrucción al chef». */
export const MAX_INSTRUCCION = 1000
const MAX_NOMBRE_MARCA = 80
const MAX_HANDLE = 60
const MAX_CTA = 120

export const PEDIDO_ILEGIBLE = 'No entendimos la comanda: recarga la página y vuelve a intentarlo.'
export const PRINCIPAL_FALTA = 'Elige el plato principal: el video que el chef va a cocinar.'
export const SUBTIPO_FALTA = 'Di qué es el plato principal: un video largo, un podcast en videollamada o tomas sueltas.'
export const FORMATO_FALTA = 'Elige qué quieres que salga: clips, carruseles o los dos.'
export const CANTIDAD_FALTA = 'Elige cuántos, más o menos.'
export const INSTRUCCION_LARGA = `Tu instrucción al chef cabe en ${MAX_INSTRUCCION} caracteres: acórtala.`
export const FECHA_ILEGIBLE = '«Para cuándo» tiene que ser una fecha.'
export const MARCA_SIN_NOMBRE = 'Ponle nombre a tu marca: es el que el chef usa en los videos.'
export const MARCA_LARGA = 'El nombre de la marca, el @ y el llamado final son textos cortos: acórtalos.'
export const ACENTO_ILEGIBLE = 'El color de acento tiene que ser un color, como #3D7BFF.'
export const DEMASIADOS = `Una comanda lleva hasta ${MAX_ACOMPANAMIENTOS} materiales además del plato principal.`

export type MarcaBasica = { nombre: string; handle: string | null; acento: string | null; ctaTexto: string | null }

export type PedidoDeComanda = {
  /** El que puso el formulario al abrirse: mandarla dos veces no la duplica. */
  ref: string
  /** El material de la cámara que el chef cocina: un video. */
  principal: string
  subtipo: SubtipoPrincipal
  /** Los demás materiales elegidos, en orden, con el rol que se eligió si son video. */
  acompanamientos: Array<{ id: string; rol: RolDeVideo }>
  formatos: FormatoPedido[]
  cantidad: CantidadPedida
  /**
   * «Tu instrucción al chef», en texto libre: la duración, el tono, qué destacar o qué evitar.
   * Se guarda en `pedido.notas`, el nombre que ya tenía cuando el campo era «Qué destacar o qué
   * evitar», y el chef la recibe además como `instruccion` (`docs/cocina-api.md`).
   */
  notas: string
  /** `AAAA-MM-DD`, informativo: la hora real la estima el chef. */
  paraCuando: string | null
  marca: MarcaBasica
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

/** El @ como se escribe: con su arroba, sin espacios. Vacío es ninguno. */
function arroba(valor: string): string | null {
  const limpio = valor.replace(/\s+/g, '')
  if (!limpio) return null
  return limpio.startsWith('@') ? limpio : `@${limpio}`
}

/** La comanda tal como la manda el formulario, validada, o la frase de por qué no. */
export function leerPedido(crudo: unknown): PedidoDeComanda | { error: string } {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: PEDIDO_ILEGIBLE }
  const c = crudo as Record<string, unknown>

  const ref = texto(c.ref)
  if (!UUID.test(ref)) return { error: PEDIDO_ILEGIBLE }
  const principal = texto(c.principal)
  if (!UUID.test(principal)) return { error: PRINCIPAL_FALTA }
  if (typeof c.subtipo !== 'string' || !(SUBTIPOS_PRINCIPAL as readonly string[]).includes(c.subtipo)) return { error: SUBTIPO_FALTA }
  const crudos = Array.isArray(c.acompanamientos) ? c.acompanamientos : []
  const acompanamientos: Array<{ id: string; rol: RolDeVideo }> = []
  for (const a of crudos) {
    const fila = (typeof a === 'object' && a !== null ? a : {}) as Record<string, unknown>
    const id = texto(fila.id)
    if (!UUID.test(id)) return { error: PEDIDO_ILEGIBLE }
    // Un rol que no se entiende es para intercalar: es lo que el chef hace con lo que no sincroniza.
    const rol = (ROLES_DE_VIDEO as readonly string[]).includes(fila.rol as string) ? (fila.rol as RolDeVideo) : 'imagen'
    if (id !== principal && !acompanamientos.some((x) => x.id === id)) acompanamientos.push({ id, rol })
  }
  if (acompanamientos.length > MAX_ACOMPANAMIENTOS) return { error: DEMASIADOS }

  const formatos = Array.isArray(c.formatos) ? c.formatos : []
  const conocidos = FORMATOS.filter((f) => formatos.includes(f))
  if (conocidos.length === 0) return { error: FORMATO_FALTA }
  if (typeof c.cantidad !== 'string' || !(CANTIDADES as readonly string[]).includes(c.cantidad)) return { error: CANTIDAD_FALTA }

  const notas = texto(c.notas)
  if (notas.length > MAX_INSTRUCCION) return { error: INSTRUCCION_LARGA }
  const paraCuando = texto(c.paraCuando) || null
  if (paraCuando && (!/^\d{4}-\d{2}-\d{2}$/.test(paraCuando) || Number.isNaN(new Date(`${paraCuando}T12:00:00Z`).getTime()))) {
    return { error: FECHA_ILEGIBLE }
  }

  const m = (typeof c.marca === 'object' && c.marca !== null ? c.marca : {}) as Record<string, unknown>
  const nombre = texto(m.nombre)
  if (!nombre) return { error: MARCA_SIN_NOMBRE }
  const handle = arroba(texto(m.handle))
  const ctaTexto = texto(m.ctaTexto) || null
  if (nombre.length > MAX_NOMBRE_MARCA || (handle?.length ?? 0) > MAX_HANDLE || (ctaTexto?.length ?? 0) > MAX_CTA) {
    return { error: MARCA_LARGA }
  }
  const acento = texto(m.acento) || null
  if (acento && !/^#[0-9a-f]{6}$/i.test(acento)) return { error: ACENTO_ILEGIBLE }

  return {
    ref,
    principal,
    subtipo: c.subtipo as SubtipoPrincipal,
    acompanamientos,
    formatos: conocidos,
    cantidad: c.cantidad as CantidadPedida,
    notas,
    paraCuando,
    marca: { nombre, handle, acento: acento?.toUpperCase() ?? null, ctaTexto },
  }
}

/**
 * Lo que trae el formulario para ayudar a escribir la instrucción: un toque los suma al texto. Son
 * ejemplos, no opciones: el chef lee lo que quede escrito.
 */
export const EJEMPLOS_DE_INSTRUCCION = [
  'Clips de menos de 30 segundos.',
  'Destaca la parte de ventas.',
  'No uses la anécdota del final.',
  'Empieza cada clip con la pregunta, no con la respuesta.',
  'Tono cercano, como una conversación.',
] as const

/**
 * La instrucción de una comanda ya guardada, o null si no dejó ninguna: la lee la API del chef
 * (`instruccion`) y la tarjeta del panel. Sale de `pedido.notas`, que es donde vive.
 */
export function instruccionDe(pedido: Record<string, unknown> | null | undefined): string | null {
  const notas = pedido?.notas
  return typeof notas === 'string' && notas.trim() ? notas.trim() : null
}

/** Cuántos caracteres cuenta el tope: los del texto sin los espacios de las puntas, como al guardarlo. */
export function largoDeInstruccion(texto: string): number {
  return texto.trim().length
}

/** Los minutos que consume del cupo: los del plato principal, redondeados hacia arriba. Sin duración, cero. */
export function minutosDe(duracionS: number | null): number {
  return duracionS && duracionS > 0 ? Math.ceil(duracionS / 60) : 0
}
