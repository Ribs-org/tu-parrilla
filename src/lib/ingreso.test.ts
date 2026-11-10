import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  MAX_CODIGOS_POR_VENTANA,
  MAX_INTENTOS,
  VENTANA_MS,
  VIGENCIA_MS,
  codigoCoincide,
  codigoDeRevision,
  correoDelCodigo,
  generarCodigo,
  hashCodigo,
  normalizarCorreo,
  puedePedir,
  vigente,
} from './ingreso'

const now = new Date('2026-09-16T12:00:00Z')

describe('normalizarCorreo', () => {
  it('recorta y pasa a minúsculas', () => {
    expect(normalizarCorreo('  Vicente@Ejemplo.CL ')).toBe('vicente@ejemplo.cl')
  })
  it('rechaza lo que no parece correo', () => {
    expect(normalizarCorreo('')).toBeNull()
    expect(normalizarCorreo('sin-arroba')).toBeNull()
    expect(normalizarCorreo('a@b')).toBeNull()
    expect(normalizarCorreo('dos @dominio.cl')).toBeNull()
    expect(normalizarCorreo('a'.repeat(250) + '@x.cl')).toBeNull()
  })
})

describe('generarCodigo y hashCodigo', () => {
  it('seis dígitos, con ceros a la izquierda', () => {
    for (let i = 0; i < 50; i++) expect(generarCodigo()).toMatch(/^\d{6}$/)
  })
  it('el hash es estable, distinto por clave, y coincide en tiempo constante', () => {
    const h = hashCodigo('123456', 'clave')
    expect(h).toBe(hashCodigo('123456', 'clave'))
    expect(h).not.toBe(hashCodigo('123456', 'otra'))
    expect(codigoCoincide('123456', h, 'clave')).toBe(true)
    expect(codigoCoincide('123457', h, 'clave')).toBe(false)
    expect(codigoCoincide('12345', h, 'clave')).toBe(false)
  })
})

describe('vigente', () => {
  const fila = { expiraEn: new Date(now.getTime() + VIGENCIA_MS), usadoEn: null, intentos: 0 }
  it('vale si no venció, no se usó y no agotó intentos', () => {
    expect(vigente(fila, now)).toBe(true)
  })
  it('no vale vencido, usado o agotado', () => {
    expect(vigente({ ...fila, expiraEn: new Date(now.getTime() - 1) }, now)).toBe(false)
    expect(vigente({ ...fila, usadoEn: now }, now)).toBe(false)
    expect(vigente({ ...fila, intentos: MAX_INTENTOS }, now)).toBe(false)
  })
})

describe('codigoDeRevision', () => {
  afterEach(() => vi.unstubAllEnvs())
  it('sin variables no hay código de revisión', () => {
    expect(codigoDeRevision('revision@tu-parrilla.cl')).toBeNull()
  })
  it('con las dos variables, solo ese correo (normalizado) recibe el código fijo', () => {
    vi.stubEnv('REVISION_CORREO', 'Revision@Tu-Parrilla.cl')
    vi.stubEnv('REVISION_CODIGO', '123456')
    expect(codigoDeRevision('revision@tu-parrilla.cl')).toBe('123456')
    expect(codigoDeRevision('otra@tu-parrilla.cl')).toBeNull()
  })
  it('un código que no son seis dígitos se ignora', () => {
    vi.stubEnv('REVISION_CORREO', 'revision@tu-parrilla.cl')
    vi.stubEnv('REVISION_CODIGO', 'abc')
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    expect(codigoDeRevision('revision@tu-parrilla.cl')).toBeNull()
    vi.restoreAllMocks()
  })
})

describe('puedePedir', () => {
  it('tres por ventana; el cuarto espera', () => {
    const hace = (ms: number) => new Date(now.getTime() - ms)
    expect(puedePedir([], now)).toBe(true)
    expect(puedePedir([hace(1000), hace(2000)], now)).toBe(true)
    expect(puedePedir([hace(1000), hace(2000), hace(3000)], now)).toBe(false)
    expect(puedePedir([hace(VENTANA_MS + 1), hace(2000), hace(3000)], now)).toBe(true)
    expect(MAX_CODIGOS_POR_VENTANA).toBe(3)
  })
})

describe('correoDelCodigo', () => {
  const sitio = 'https://tu-parrilla.cl'
  const enlace = 'https://tu-parrilla.cl/ingresar/codigo?correo=juana%2Bparrilla%40ejemplo.cl#codigo=123456'

  it('el de siempre trae el código, el botón y el enlace, que abre el navegador y no la app', () => {
    const { subject, text, html } = correoDelCodigo('123456', { correo: 'juana+parrilla@ejemplo.cl', sitio })
    expect(subject).toBe('123456 es tu código para entrar a Tu Parrilla')
    expect(text).toContain('Tu código para entrar a Tu Parrilla es 123456. Vale diez minutos.')
    expect(text).toContain(`Para entrar, abre este enlace y aprieta «Entrar»:\n${enlace}`)
    expect(text).toContain('Si lo pediste en la app del teléfono, escribe el código en la app')
    expect(html).toContain(`<a href="${enlace}"`)
    expect(html).toContain('>Entrar a Tu Parrilla</a>')
    expect(html).toContain('>123456</strong>')
  })

  it('la invitación saluda, trae el botón y dice dónde pedir otro', () => {
    const { subject, text, html } = correoDelCodigo('123456', {
      correo: 'juana+parrilla@ejemplo.cl',
      sitio,
      invitacion: { nombre: ' Juana Pérez ' },
    })
    expect(subject).toBe('Te invitaron a Tu Parrilla: tu código es 123456')
    expect(text.startsWith('Hola Juana:\n\nTe invitaron a Tu Parrilla.')).toBe(true)
    expect(text).toContain(enlace)
    expect(text).toContain('O escribe este código: 123456. Vale diez minutos.')
    expect(text).toContain('pide otro en https://tu-parrilla.cl/ingresar con este mismo correo (juana+parrilla@ejemplo.cl)')
    expect(html).toContain('>Entrar a Tu Parrilla</a>')
  })

  it('lo que escribió el admin va escapado en el HTML', () => {
    const { html } = correoDelCodigo('123456', { correo: 'a@ejemplo.cl', sitio, invitacion: { nombre: '<b>Juana</b>' } })
    expect(html).toContain('Hola &lt;b&gt;Juana&lt;/b&gt;:')
    expect(html).not.toContain('<b>')
  })

  it('sin dominio del producto, sin enlaces ni HTML: el de siempre queda como era', () => {
    expect(correoDelCodigo('123456', { correo: 'juana@ejemplo.cl', sitio: '' })).toEqual({
      subject: '123456 es tu código para entrar a Tu Parrilla',
      text: 'Tu código para entrar a Tu Parrilla es 123456. Vale diez minutos. Si no lo pediste, ignora este correo.',
    })
    const invitacion = correoDelCodigo('123456', { correo: 'juana@ejemplo.cl', sitio: '', invitacion: { nombre: null } })
    expect(invitacion.text.startsWith('Hola:')).toBe(true)
    expect(invitacion.text).toContain('escribe este código en la pantalla de ingreso de Tu Parrilla: 123456')
    expect(invitacion.text).not.toContain('http')
    expect(invitacion.html).toBeUndefined()
  })
})
