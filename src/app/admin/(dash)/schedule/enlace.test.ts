import { describe, expect, it } from 'vitest'
import { scheduleHref, volverDelEditor } from './enlace'

describe('scheduleHref', () => {
  it('sin parámetros ni cambios, la ruta pelada', () => {
    expect(scheduleHref({}, {})).toBe('/admin/schedule')
  })

  it('carga lo que venía y aplica el cambio', () => {
    expect(scheduleHref({ vista: 'calendario', semana: '2026-09-28' }, { semana: '2026-10-05' })).toBe(
      '/admin/schedule?vista=calendario&semana=2026-10-05',
    )
  })

  it('un cambio en null borra la clave', () => {
    expect(scheduleHref({ vista: 'calendario', semana: '2026-09-28' }, { vista: null, semana: null })).toBe(
      '/admin/schedule',
    )
  })

  it('«componer» no viaja: la orden de abrir el compositor es de un solo uso', () => {
    // «Nueva publicación» llega con componer=1, y cualquier clic de ahí en adelante —una
    // pestaña, el «volver» del editor, cerrar el panel— tiene que dejarlo atrás.
    expect(scheduleHref({ componer: '1' }, {})).toBe('/admin/schedule')
    expect(scheduleHref({ componer: '1', vista: 'calendario' }, { vista: 'calendario' })).toBe(
      '/admin/schedule?vista=calendario',
    )
  })

  it('lo que abre el panel lateral y el aviso de «programado» tampoco viajan', () => {
    expect(
      scheduleHref({ componer: '1', dia: '2026-10-16', borrador: 'b1', panel: 'csv', hecho: 'programado', semana: '2026-10-12' }, {}),
    ).toBe('/admin/schedule?semana=2026-10-12')
  })

  it('«mensaje» tampoco, que es el desenlace de una vuelta de OAuth', () => {
    expect(scheduleHref({ mensaje: 'cuenta-conectada', vista: 'calendario' }, {})).toBe(
      '/admin/schedule?vista=calendario',
    )
  })

  it('pedir explícitamente un parámetro de un solo uso sí lo escribe', () => {
    // La exclusión es sobre lo que se arrastra, no sobre lo que se pide: sin esto nadie
    // podría construir el enlace que abre el compositor.
    expect(scheduleHref({}, { componer: '1' })).toBe('/admin/schedule?componer=1')
  })

  it('una clave repetida viaja entera', () => {
    expect(scheduleHref({ red: ['tiktok', 'instagram'] }, {})).toBe('/admin/schedule?red=tiktok&red=instagram')
  })
})

describe('volverDelEditor', () => {
  it('vuelve a la parrilla o a una pieza de Los Números', () => {
    expect(volverDelEditor('/admin/schedule?vista=lista')).toBe('/admin/schedule?vista=lista')
    expect(volverDelEditor('/admin/analytics/publicaciones/abc?range=all')).toBe('/admin/analytics/publicaciones/abc?range=all')
  })

  it('a otra parte, o sin valor, la parrilla pelada', () => {
    expect(volverDelEditor('https://otro.sitio/admin/schedule')).toBe('/admin/schedule')
    expect(volverDelEditor('/admin/analytics')).toBe('/admin/schedule')
    expect(volverDelEditor(null)).toBe('/admin/schedule')
  })
})
