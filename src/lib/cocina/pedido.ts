// Lo que se pide en una comanda, sin base: lo lee la acción que la cuelga y lo muestra el
// formulario («La comanda nueva», en `docs/superpowers/specs/2026-10-22-la-cocina-design.md`). En la
// fase 0 no hay catálogo todavía, así que los estilos los elige el chef; el formulario no los ofrece.

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

export const MAX_ACOMPANAMIENTOS = 10
export const MAX_NOTAS = 1000
const MAX_NOMBRE_MARCA = 80
const MAX_HANDLE = 60
const MAX_CTA = 120

export const PEDIDO_ILEGIBLE = 'No entendimos la comanda: recarga la página y vuelve a intentarlo.'
export const PRINCIPAL_FALTA = 'Sube el plato principal: el video que el chef va a cocinar.'
export const FORMATO_FALTA = 'Elige qué quieres que salga: clips, carruseles o los dos.'
export const CANTIDAD_FALTA = 'Elige cuántos, más o menos.'
export const NOTAS_LARGAS = `Lo que hay que destacar o evitar cabe en ${MAX_NOTAS} caracteres.`
export const FECHA_ILEGIBLE = '«Para cuándo» tiene que ser una fecha.'
export const MARCA_SIN_NOMBRE = 'Ponle nombre a tu marca: es el que el chef usa en los videos.'
export const MARCA_LARGA = 'El nombre de la marca, el @ y el llamado final son textos cortos: acórtalos.'
export const ACENTO_ILEGIBLE = 'El color de acento tiene que ser un color, como #3D7BFF.'
export const DEMASIADOS = `Una comanda lleva hasta ${MAX_ACOMPANAMIENTOS} acompañamientos.`

export type MarcaBasica = { nombre: string; handle: string | null; acento: string | null; ctaTexto: string | null }

export type PedidoDeComanda = {
  /** El que puso el formulario al abrirse: mandarla dos veces no la duplica. */
  ref: string
  principal: string
  acompanamientos: string[]
  formatos: FormatoPedido[]
  cantidad: CantidadPedida
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
  const acompanamientos = Array.isArray(c.acompanamientos) ? c.acompanamientos : []
  if (!acompanamientos.every((a) => typeof a === 'string' && UUID.test(a))) return { error: PEDIDO_ILEGIBLE }
  if (acompanamientos.length > MAX_ACOMPANAMIENTOS) return { error: DEMASIADOS }
  const unicos = [...new Set(acompanamientos as string[])].filter((a) => a !== principal)

  const formatos = Array.isArray(c.formatos) ? c.formatos : []
  const conocidos = FORMATOS.filter((f) => formatos.includes(f))
  if (conocidos.length === 0) return { error: FORMATO_FALTA }
  if (typeof c.cantidad !== 'string' || !(CANTIDADES as readonly string[]).includes(c.cantidad)) return { error: CANTIDAD_FALTA }

  const notas = texto(c.notas)
  if (notas.length > MAX_NOTAS) return { error: NOTAS_LARGAS }
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
    acompanamientos: unicos,
    formatos: conocidos,
    cantidad: c.cantidad as CantidadPedida,
    notas,
    paraCuando,
    marca: { nombre, handle, acento: acento?.toUpperCase() ?? null, ctaTexto },
  }
}

/** Los minutos que consume del cupo: los del plato principal, redondeados hacia arriba. Sin duración, cero. */
export function minutosDe(duracionS: number | null): number {
  return duracionS && duracionS > 0 ? Math.ceil(duracionS / 60) : 0
}
