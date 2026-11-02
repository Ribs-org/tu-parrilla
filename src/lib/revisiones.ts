// Lo que los formularios del panel revisan antes de enviar, con las mismas frases que el
// servidor. Antes lo revisaba el navegador (`required`, `type="email"`, `pattern`), con un globito
// en su idioma y su letra. El servidor sigue revisando igual: esto es para no ir a preguntarle lo
// que ya se sabe, y porque React vacía un formulario con `action` cuando vuelve, y un correo mal
// escrito se iba con todo lo demás que se había llenado. Sin nada de servidor: corre en el navegador.

import { normalizarCorreo } from './forma-del-correo'
import { CODIGO_INCORRECTO, CORREO_INVALIDO } from './ingreso-frases'

/** Qué campo falla y por qué: el mensaje va en línea, y el foco, a ese campo. */
export type Problema = { campo: string; mensaje: string }

export const LINK_SIN_NOMBRE = 'Ponle un nombre al link.'
export const LINK_SIN_URL = 'Falta la URL.'
export const NOMBRE_VACIO = 'Ponle un nombre: el del agente que la va a usar.'
export const FALTA_FECHA = 'Elige la fecha y la hora.'

function texto(datos: FormData, campo: string): string {
  return String(datos.get(campo) ?? '').trim()
}

export function revisarCorreo(datos: FormData): Problema | null {
  return normalizarCorreo(texto(datos, 'correo')) ? null : { campo: 'correo', mensaje: CORREO_INVALIDO }
}

/** Seis dígitos, contados como los cuenta `canjearCodigo`: lo demás que se pegó no cuenta. */
export function revisarCodigo(datos: FormData): Problema | null {
  return texto(datos, 'codigo').replace(/\D/g, '').length === 6 ? null : { campo: 'codigo', mensaje: CODIGO_INCORRECTO }
}

export function revisarLinkNuevo(datos: FormData): Problema | null {
  if (!texto(datos, 'label')) return { campo: 'label', mensaje: LINK_SIN_NOMBRE }
  if (!texto(datos, 'url')) return { campo: 'url', mensaje: LINK_SIN_URL }
  return null
}

export function revisarNombreDeLlave(datos: FormData): Problema | null {
  return texto(datos, 'nombre') ? null : { campo: 'nombre', mensaje: NOMBRE_VACIO }
}
