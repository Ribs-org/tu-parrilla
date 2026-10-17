import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'
import { Landing } from './landing'

// La portada es lo que Google miró para verificar la marca, y lo que mira cualquier revisión
// de una red: tiene que decir qué hace la app y para qué usa los datos de cada red, con la
// privacidad y los términos a la vista, sin pedir ingreso (`docs/google-verificacion-guion.md`,
// «La página principal tiene que explicar la app»). Un rediseño que se coma una de estas cosas
// no rompe nada a la vista, y por eso lo cuida una prueba.
const html = renderToStaticMarkup(createElement(Landing))
const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('la portada', () => {
  it('dice qué hace la app, con su nombre', () => {
    expect(texto).toContain('Tu Parrilla publica en Instagram, Facebook, TikTok, YouTube, Threads y X')
  })

  it('dice para qué usa tu canal de YouTube', () => {
    expect(texto).toContain('Con tu canal de YouTube, sube los videos que programas y lee sus contadores y sus comentarios')
  })

  it('enlaza la privacidad y los términos', () => {
    expect(html).toContain('href="/privacidad"')
    expect(html).toContain('href="/terminos"')
  })

  it('nombra a quien presta el servicio, como lo verificó Meta', () => {
    expect(texto).toContain(RESPONSABLE)
    expect(texto).toContain(RUT)
    expect(texto).toContain(CONTACTO)
  })

  it('no pide nada: sin formulario, y el único ingreso es por invitación', () => {
    expect(html).not.toMatch(/<form/)
    expect(texto).toContain('Tu Parrilla es por invitación')
    expect(html).toContain('href="/ingresar"')
  })
})
