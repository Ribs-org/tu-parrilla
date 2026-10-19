import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ayudaDeConexion } from '@/lib/social/ayuda-conexion'
import { NO_INSTAGRAM_ACCOUNT } from '@/lib/social/instagram'
import { AvisoDeConexion } from './aviso-de-conexion'

function dibujar(mensaje: string) {
  return renderToStaticMarkup(createElement(AvisoDeConexion, { mensaje, ayuda: ayudaDeConexion(mensaje) }))
}

describe('AvisoDeConexion', () => {
  it('con un arreglo conocido: la franja ofrece «Cómo arreglarlo» y la ventana trae los pasos y la vuelta', () => {
    const html = dibujar(NO_INSTAGRAM_ACCOUNT)
    expect(html).toContain(NO_INSTAGRAM_ACCOUNT)
    expect(html).toContain('Cómo arreglarlo')
    expect(html).toMatch(/<dialog[^>]*aria-labelledby=/)
    expect(html).toContain('Instagram no se conectó')
    expect(html.match(/<li>/g)).toHaveLength(3)
    // La vuelta es un enlace de verdad: la conexión sale del sitio hacia Meta.
    expect(html).toContain('href="/api/social/instagram/connect"')
    expect(html).toContain('Volver a conectar Instagram')
    expect(html).toContain('Cerrar')
  })

  it('con cualquier otra frase: solo la franja, como siempre', () => {
    const html = dibujar('Instagram conectado.')
    expect(html).toContain('Instagram conectado.')
    expect(html).toContain('role="status"')
    expect(html).not.toContain('<dialog')
    expect(html).not.toContain('Cómo arreglarlo')
  })
})
