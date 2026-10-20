import { describe, expect, it, vi } from 'vitest'

// `composer.tsx` importa `createScheduledPost` de `actions.ts`, que arrastra módulos con
// `server-only` (mismo motivo que en `aislamiento.test.ts`): se sustituye por un módulo
// vacío para poder importar `vieneMarcada` bajo Vitest.
vi.mock('server-only', () => ({}))

const { vieneMarcada, cuentasInicialesDe, hrefDeVuelta, destinosEnPalabras } = await import('./composer')

describe('vieneMarcada', () => {
  it('con una sola cuenta conectada, viene marcada', () => {
    const sola = { id: 'ig-1', connected: true }
    expect(vieneMarcada(sola, [sola])).toBe(true)
  })

  it('con dos cuentas conectadas, no viene ninguna', () => {
    const a = { id: 'ig-1', connected: true }
    const b = { id: 'ig-2', connected: true }
    expect(vieneMarcada(a, [a, b])).toBe(false)
    expect(vieneMarcada(b, [a, b])).toBe(false)
  })

  it('una desconectada no cuenta para decidir ni viene marcada', () => {
    const viva = { id: 'ig-1', connected: true }
    const muerta = { id: 'ig-2', connected: false }
    expect(vieneMarcada(viva, [viva, muerta])).toBe(true)
    expect(vieneMarcada(muerta, [viva, muerta])).toBe(false)
  })
})

describe('cuentasInicialesDe', () => {
  it('devuelve las cuentas de esa red que empiezan marcadas, y ninguna de otra red', () => {
    const ig = { id: 'ig', network: 'instagram', connected: true }
    const tt = { id: 'tt', network: 'tiktok', connected: true }
    expect(cuentasInicialesDe([ig], 'instagram')).toEqual([ig])
    expect(cuentasInicialesDe([ig], 'tiktok')).toEqual([])
    expect(cuentasInicialesDe([ig, tt], 'instagram')).toEqual([]) // dos candidatas: ninguna marcada
    expect(cuentasInicialesDe([tt], 'tiktok')).toEqual([tt])
  })

  // Sin esto, un dueño cuya única cuenta publicable es de TikTok ve la casilla marcada
  // pero ningún bloque de opciones: `cuentasTikTok` seguía naciendo en `[]` porque
  // `onChange` no corre en el primer render.
  it('con una sola cuenta de TikTok conectada, empieza marcada', () => {
    const tt = { id: 'tt-1', network: 'tiktok', connected: true }
    expect(cuentasInicialesDe([tt], 'tiktok')).toEqual([tt])
  })

  it('con una sola cuenta de Instagram conectada, no hay nada de TikTok que marcar', () => {
    const ig = { id: 'ig-1', network: 'instagram', connected: true }
    expect(cuentasInicialesDe([ig], 'tiktok')).toEqual([])
  })

  it('con dos cuentas conectadas, ninguna empieza marcada', () => {
    const tt = { id: 'tt-1', network: 'tiktok', connected: true }
    const ig = { id: 'ig-1', network: 'instagram', connected: true }
    expect(cuentasInicialesDe([tt, ig], 'tiktok')).toEqual([])
  })
})

describe('hrefDeVuelta', () => {
  it('vuelve a la semana del día programado, con el post recién puesto', () => {
    expect(hrefDeVuelta('/admin/schedule?hecho=programado', 'p1', '2026-10-22')).toBe(
      '/admin/schedule?hecho=programado&nuevo=p1&semana=2026-10-19',
    )
    // «Por hora» es la misma semana: también pasa a la del día programado, sin dejar la vista.
    expect(hrefDeVuelta('/admin/schedule?vista=hora&hecho=programado', 'p1', '2026-10-22')).toBe(
      '/admin/schedule?vista=hora&hecho=programado&nuevo=p1&semana=2026-10-19',
    )
  })

  it('en la vista «Día», a ese día; en la lista, a la lista', () => {
    expect(hrefDeVuelta('/admin/schedule?vista=dia&fecha=2026-10-16&hecho=programado', 'p1', '2026-10-22')).toBe(
      '/admin/schedule?vista=dia&fecha=2026-10-22&hecho=programado&nuevo=p1',
    )
    expect(hrefDeVuelta('/admin/schedule?vista=lista&hecho=programado', 'p1', '2026-10-22')).toBe(
      '/admin/schedule?vista=lista&hecho=programado&nuevo=p1',
    )
  })

  it('sin id, como antes', () => {
    expect(hrefDeVuelta('/admin/schedule?hecho=programado', undefined, '2026-10-22')).toBe('/admin/schedule?hecho=programado')
  })
})

describe('destinosEnPalabras', () => {
  it('las redes en palabras, con el usuario solo cuando dos son de la misma red', () => {
    expect(destinosEnPalabras([{ network: 'instagram', handle: '@a' }, { network: 'tiktok', handle: '@a' }])).toBe(
      'A Instagram y TikTok.',
    )
    expect(
      destinosEnPalabras([
        { network: 'facebook', handle: 'Uno' },
        { network: 'facebook', handle: 'Dos' },
        { network: 'instagram', handle: '@a' },
      ]),
    ).toBe('A Facebook · Uno, Facebook · Dos y Instagram.')
  })

  it('sin cuentas, que falta elegir', () => {
    expect(destinosEnPalabras([])).toBe('Todavía sin cuenta: elige al menos una.')
  })
})
