import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { conMensaje, mensajeDeLaUrl } from './mensaje-firmado'

/** Lo que una página recibiría en `searchParams` al abrir la ruta. */
function params(ruta: string): Record<string, string> {
  return Object.fromEntries(new URL(ruta, 'https://ejemplo.cl').searchParams)
}

describe('mensajes firmados en la URL', () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = 'secreto-de-prueba'
  })
  afterEach(() => {
    delete process.env.AUTH_SECRET
  })

  it('lo que firmó el servidor vuelve tal cual, también con comillas, acentos y espacios', () => {
    const texto = '«@vicente · Instagram» quitada de Tu Parrilla.'
    expect(mensajeDeLaUrl(params(conMensaje('/admin/accounts', texto)), 200)).toBe(texto)
  })

  it('se corta al largo que pide la página', () => {
    expect(mensajeDeLaUrl(params(conMensaje('/admin/accounts', 'x'.repeat(500))), 200)).toHaveLength(200)
  })

  it('un mensaje sin firma, o con la firma de otro texto, no se muestra', () => {
    expect(mensajeDeLaUrl({ mensaje: 'Tu cuenta fue suspendida: escribe a ...' }, 200)).toBeNull()
    const firmado = params(conMensaje('/admin/accounts', 'Elige al menos una cuenta.'))
    expect(mensajeDeLaUrl({ ...firmado, mensaje: 'Otra cosa.' }, 200)).toBeNull()
  })

  it('una firma hecha con otro secreto tampoco', () => {
    const firmado = params(conMensaje('/admin/accounts', 'Elige al menos una cuenta.'))
    process.env.AUTH_SECRET = 'otro-secreto'
    expect(mensajeDeLaUrl(firmado, 200)).toBeNull()
  })

  it('una ruta que ya trae parámetros suma los suyos con &', () => {
    expect(conMensaje('/admin/accounts?vista=x', 'hola')).toMatch(/^\/admin\/accounts\?vista=x&mensaje=hola&firma=/)
  })
})
