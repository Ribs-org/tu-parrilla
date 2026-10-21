import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from './env'

// Las frases que una acción o una vuelta de login le deja a la página siguiente por la URL
// (`?mensaje=…`): «quitada de Tu Parrilla», el porqué de un login que no terminó. Van con su
// firma, y la página solo muestra la que firmó el servidor: sin firma, cualquiera armaba un
// enlace al panel que mostraba lo que quisiera, con la cara del panel, a quien lo abriera.

function firma(texto: string): string {
  return createHmac('sha256', `mensaje:${env('AUTH_SECRET') ?? ''}`).update(texto).digest('base64url').slice(0, 22)
}

/** `ruta` con su mensaje firmado: `…?mensaje=…&firma=…`. */
export function conMensaje(ruta: string, texto: string): string {
  const params = new URLSearchParams({ mensaje: texto, firma: firma(texto) })
  return `${ruta}${ruta.includes('?') ? '&' : '?'}${params.toString()}`
}

/** El mensaje que trae la URL, cortado a `largo`, si lo firmó el servidor; si no, nada. */
export function mensajeDeLaUrl(params: Record<string, string | string[] | undefined>, largo: number): string | null {
  const texto = typeof params.mensaje === 'string' ? params.mensaje : null
  const recibida = typeof params.firma === 'string' ? params.firma : null
  if (!texto || !recibida) return null
  const a = Buffer.from(recibida)
  const b = Buffer.from(firma(texto))
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null
  return texto.slice(0, largo)
}
