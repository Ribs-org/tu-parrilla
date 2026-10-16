// La parte pura del ingreso: las frases y cómo se lee una respuesta del servidor. Quien
// habla con la red y con el llavero está en `session.ts`.

/** La misma frase que la web: no dice si el correo está invitado. */
export const CODIGO_ENVIADO = 'Si tu correo está invitado, te llegará un código en un minuto. Vale diez minutos.'
export const SIN_SENAL = 'No se pudo conectar. Revisa tu señal.'
export const SERVIDOR_FALLO = 'El servidor no respondió bien. Prueba de nuevo en un rato.'
export const CORREO_INVALIDO = 'Ese correo no se ve bien.'

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/**
 * La misma forma que acepta el servidor (`normalizarCorreo` en `src/lib/ingreso.ts`). Se
 * revisa acá porque el servidor responde igual a un correo mal escrito que a uno no
 * invitado —para no revelar la lista—, y sin esto un error de tipeo se ve como un código
 * que nunca llega.
 */
export function normalizarCorreo(bruto: string): string | null {
  const limpio = bruto.trim().toLowerCase()
  if (limpio.length === 0 || limpio.length > 254) return null
  return CORREO.test(limpio) ? limpio : null
}

/** Solo dígitos y a lo más seis: lo que se pega de un correo trae espacios o guiones. */
export function limpiarCodigo(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, 6)
}

/**
 * La frase del servidor tal cual cuando la trae —«Ese código no es válido o ya venció.» y las
 * de los topes—, y una genérica cuando no: un 500 o una página de error del proveedor no son
 * culpa de lo que escribió la persona, y decirle que se equivocó la manda a buscar al revés.
 */
export function fraseDeRechazo(cuerpo: unknown): string {
  if (cuerpo && typeof cuerpo === 'object' && 'error' in cuerpo && typeof cuerpo.error === 'string' && cuerpo.error) {
    return cuerpo.error
  }
  return SERVIDOR_FALLO
}
