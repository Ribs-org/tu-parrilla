import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CONTACTO, RESPONSABLE, RUT } from '@/lib/empresa'
import { NOMBRE_FORMATO, formatoDe, type Formato } from '@/lib/parrilla'
import { Landing, metadataLanding } from './landing'
import { SEMANA } from './landing-semana'

// La portada es lo que Google miró para verificar la marca, y lo que mira cualquier revisión
// de una red: tiene que decir qué hace la app y para qué usa los datos de cada red, con la
// privacidad y los términos a la vista, sin pedir ingreso (`docs/google-verificacion-guion.md`,
// «La página principal tiene que explicar la app»). Un rediseño que se coma una de estas cosas
// no rompe nada a la vista, y por eso lo cuida una prueba.
const html = renderToStaticMarkup(createElement(Landing))
const texto = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')

describe('la portada', () => {
  it('dice qué hace la app, con su nombre', () => {
    expect(texto).toContain('Tu Parrilla publica en Instagram, Facebook, TikTok y YouTube a la hora que elegiste')
  })

  it('no promete las redes en «Próximamente»: las nombra apagadas, con la palabra', () => {
    expect(texto).toContain('Threads Próximamente')
    expect(texto).toContain('X / Twitter Próximamente')
    expect(texto).not.toMatch(/publica en [^.]*Threads/)
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

  it('de día dice lo mismo que importa: qué hace, el canal, lo legal y quién presta el servicio', () => {
    const dia = renderToStaticMarkup(createElement(Landing, { tema: 'dia' }))
    const textoDia = dia.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(dia).toContain('data-tema="dia"')
    expect(textoDia).toContain('Tu Parrilla publica en Instagram, Facebook, TikTok y YouTube a la hora que elegiste')
    expect(textoDia).toContain('Con tu canal de YouTube, sube los videos que programas')
    expect(dia).toContain('href="/privacidad"')
    expect(dia).toContain('href="/terminos"')
    expect(textoDia).toContain(RESPONSABLE)
  })

  it('la tarjeta para compartir de día lleva la imagen de día, y las dos apuntan a la raíz', () => {
    const noche = metadataLanding('tu-parrilla.cl')
    const dia = metadataLanding('tu-parrilla.cl', 'dia')
    expect(noche.openGraph?.images).toBe('https://tu-parrilla.cl/api/og')
    expect(dia.openGraph?.images).toBe('https://tu-parrilla.cl/api/og/dia')
    expect(dia.twitter?.images).toBe('https://tu-parrilla.cl/api/og/dia')
    expect(dia.alternates?.canonical).toBe('https://tu-parrilla.cl/')
  })

  it('muestra a los creadores que trabajan con Tu Parrilla, enlazados a su perfil y con su foto', () => {
    expect(texto).toContain('Creadores que trabajan con Tu Parrilla')
    expect(html).toContain('href="https://www.instagram.com/vicente_pareja_j/"')
    expect(html).toContain('href="https://www.tiktok.com/@chinocomprensible"')
    expect(html).toContain('rel="noopener noreferrer"')
    // Las fotos se sirven del sitio, no de la red: que estén en `public/` y no apunten afuera.
    const fotos = [...html.matchAll(/creadores%2F([\w.-]+\.webp)/g)].map((m) => m[1]!)
    expect(new Set(fotos)).toEqual(new Set(['vicente_pareja_j.webp', 'chinocomprensible.webp']))
    for (const foto of fotos) expect(existsSync(join(process.cwd(), 'public', 'creadores', foto))).toBe(true)
    expect(html).not.toMatch(/cdninstagram|fbcdn|tiktokcdn/)
  })

  it('los creadores van arriba: justo después de la semana, antes de la leyenda', () => {
    expect(html.indexOf('Creadores que trabajan con Tu Parrilla')).toBeLessThan(html.indexOf('Pruébalo'))
  })

  it('la semana de ejemplo dibuja todos los formatos del panel, y la leyenda los nombra', () => {
    // Si La Parrilla suma un formato y la portada no, esto falla: pasó con la historia, que llegó
    // el 2026-10-26 y la portada siguió contando cuatro hasta el 2026-11-09.
    const formatos = new Set(SEMANA.flatMap((d) => d.cortes.map((c) => formatoDe(c.media, 0, c.historia).formato)))
    expect(formatos).toEqual(new Set(Object.keys(NOMBRE_FORMATO) as Formato[]))
    expect(texto).toContain('chori el texto y choripán al paso la historia')
    expect(texto).toContain('temaki el texto y onigiri la historia')
  })

  it('el contador suma vistas y me gusta sin YouTube, y sin cifras no aparece', () => {
    const conNumeros = renderToStaticMarkup(createElement(Landing, { numeros: { vistas: 1234567, meGusta: 8901 } }))
    const textoCon = conNumeros.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    expect(textoCon).toContain('1.234.567')
    expect(textoCon).toContain('8.901')
    expect(textoCon).toContain('las cuentas de Instagram, Facebook y TikTok conectadas a Tu Parrilla')
    expect(textoCon).toContain('YouTube no entra')
    expect(texto).not.toContain('Lo que ya salió de la parrilla')
  })

  it('no pide nada: sin formulario, y el único ingreso es por invitación', () => {
    expect(html).not.toMatch(/<form/)
    expect(texto).toContain('Tu Parrilla es por invitación')
    expect(html).toContain('href="/ingresar"')
  })
})
