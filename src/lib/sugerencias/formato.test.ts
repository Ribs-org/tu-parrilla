import { describe, expect, it } from 'vitest'
import {
  CORREO_QUITADO,
  MAX_TEXTO,
  PIE_DEL_ISSUE,
  SUGERENCIA_LARGA,
  SUGERENCIA_SIN_TIPO,
  SUGERENCIA_VACIA,
  citar,
  cuerpoDelIssue,
  etiquetasDe,
  fechaEnZona,
  limpiarCommit,
  limpiarPantalla,
  neutralizar,
  resumirApp,
  resumirNavegador,
  tituloDelIssue,
  validarSugerencia,
  type Contexto,
} from './formato'

const ANCHO_CERO = '​'

/** Lo que GitHub reconocería en el texto ya dibujado, sin los escapes de Markdown. */
function comoLoVeGithub(markdown: string): string {
  return markdown.replace(/\\(.)/g, '$1')
}

describe('neutralizar: lo que escribió un tercero no hace nada en GitHub', () => {
  const peligroso = [
    '@VicentePareja mira esto, y @Ribs-org/equipo también',
    'fixes #12, closes Ribs-org/tu-parrilla#3 y GH-7',
    '[clic acá](https://malo.example/x) ![](https://malo.example/pixel.png)',
    '<img src=x onerror=alert(1)> <details open>hola</details>',
    'https://malo.example y www.malo.example',
    '&#64;alguien y &commat;otro',
    '# Un título',
    '- una lista',
    '| una | tabla |',
    '```js',
    'console.log(1)',
    '```',
  ].join('\n')
  const salida = neutralizar(peligroso)
  const visto = comoLoVeGithub(salida)

  it('ninguna @ queda pegada a un nombre: no menciona a nadie', () => {
    expect(visto).not.toMatch(/@[A-Za-z0-9]/)
    expect(visto).toContain(`@${ANCHO_CERO}VicentePareja`)
  })

  it('ningún # queda pegado a un número ni a una palabra: no enlaza ni cierra issues', () => {
    expect(visto).not.toMatch(/#[A-Za-z0-9]/)
    expect(visto).not.toMatch(/GH-\d/i)
  })

  it('no arma enlaces, imágenes ni HTML: cada signo de Markdown va escapado', () => {
    for (const signo of ['[', ']', '(', ')', '<', '>', '!', '`', '|', '#', '-', '&']) {
      // Cada aparición del signo tiene su barra delante.
      const sueltos = [...salida.matchAll(new RegExp(`(^|[^\\\\])\\${signo}`, 'g'))]
      expect(sueltos, `«${signo}» sin escapar`).toEqual([])
    }
  })

  it('las direcciones no se vuelven enlaces solos', () => {
    expect(visto).not.toMatch(/https?:\/\//)
    expect(visto).not.toMatch(/www\./i)
  })

  it('una entidad no puede volver a ser una @', () => {
    expect(salida).toContain('\\&\\#')
  })

  it('el texto se sigue leyendo igual, sin los escapes y los espacios de ancho cero', () => {
    expect(visto.replaceAll(ANCHO_CERO, '')).toBe(peligroso)
  })

  it('fuera los caracteres de control y los que dan vuelta el texto', () => {
    expect(neutralizar('hola\u0000‮mundo\u0007')).toBe('holamundo')
  })

  it('los correos no viajan: el repositorio es público', () => {
    const n = neutralizar('escríbeme a ana.perez+tp@correo.cl o a otro@ejemplo.com')
    expect(n).not.toMatch(/correo\\?\.cl|ejemplo/)
    expect(comoLoVeGithub(n)).toContain(CORREO_QUITADO)
  })
})

describe('citar', () => {
  it('cada renglón va citado, sin sangría, y los blancos de más se juntan', () => {
    expect(citar('uno\n    dos\n\n\n\ntres')).toBe('> uno\n> dos\n>\n> tres')
  })

  it('un renglón no puede salirse de la cita', () => {
    const cita = citar('hola\n\n## Metadatos\n| Usuario | otro |')
    for (const renglon of cita.split('\n')) expect(renglon.startsWith('>')).toBe(true)
  })
})

describe('validarSugerencia', () => {
  it('acepta un tipo conocido y un texto, recortado', () => {
    expect(validarSugerencia({ tipo: 'idea', texto: '  Quiero X cuando apriete Y \r\n' })).toEqual({
      tipo: 'idea',
      texto: 'Quiero X cuando apriete Y',
    })
  })

  it('rechaza el tipo que no existe, el texto vacío y el que se pasa del largo', () => {
    expect(validarSugerencia({ tipo: 'orden', texto: 'x' })).toEqual({ error: SUGERENCIA_SIN_TIPO })
    expect(validarSugerencia(null)).toEqual({ error: SUGERENCIA_SIN_TIPO })
    expect(validarSugerencia({ tipo: 'idea', texto: '   ' })).toEqual({ error: SUGERENCIA_VACIA })
    expect(validarSugerencia({ tipo: 'idea', texto: 42 })).toEqual({ error: SUGERENCIA_VACIA })
    expect(validarSugerencia({ tipo: 'otra', texto: 'a'.repeat(MAX_TEXTO + 1) })).toEqual({ error: SUGERENCIA_LARGA })
    expect(validarSugerencia({ tipo: 'otra', texto: 'a'.repeat(MAX_TEXTO) })).not.toHaveProperty('error')
  })
})

describe('los metadatos que llegan de afuera', () => {
  it('la pantalla es una ruta del panel o nada', () => {
    expect(limpiarPantalla('/admin/schedule')).toBe('/admin/schedule')
    expect(limpiarPantalla('/admin/analytics/publicaciones/1b2c-3d')).toBe('/admin/analytics/publicaciones/1b2c-3d')
    expect(limpiarPantalla('/admin/x?token=abc')).toBeNull()
    expect(limpiarPantalla('/admin/@alguien')).toBeNull()
    expect(limpiarPantalla('https://malo.example')).toBeNull()
    expect(limpiarPantalla(12)).toBeNull()
  })

  it('el commit es hexadecimal o nada', () => {
    expect(limpiarCommit('46B4F9D0123')).toBe('46b4f9d0123')
    expect(limpiarCommit('no-es-un-commit')).toBeNull()
    expect(limpiarCommit(undefined)).toBeNull()
  })

  it('el navegador, en dos palabras, sin copiar el user-agent', () => {
    expect(
      resumirNavegador(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      ),
    ).toBe('Chrome 131 en Windows')
    expect(
      resumirNavegador(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
      ),
    ).toBe('Edge 131 en Windows')
    expect(
      resumirNavegador(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
      ),
    ).toBe('Safari 18 en iOS 18')
    expect(
      resumirNavegador('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'),
    ).toBe('Chrome 130 en Android 14')
    expect(resumirNavegador('Mozilla/5.0 (Macintosh; Intel Mac OS X 14.5; rv:132.0) Gecko/20100101 Firefox/132.0')).toBe(
      'Firefox 132 en macOS',
    )
    expect(resumirNavegador('@alguien #12 <script>')).toBe('un navegador desconocido en un sistema desconocido')
    expect(resumirNavegador(null)).toBe('desconocido')
  })

  it('la app del teléfono, con lo que se reconoce y nada más', () => {
    expect(resumirApp({ version: '1.1.0', actualizacion: 'a1b2c3d4', plataforma: 'android' })).toBe(
      'App del teléfono 1.1.0 en Android, actualización a1b2c3d4',
    )
    expect(resumirApp({ version: '@alguien', actualizacion: '#12 fixes', plataforma: 'windows' })).toBe('App del teléfono')
    expect(resumirApp(undefined)).toBe('App del teléfono')
  })

  it('la fecha, como la vio la persona, con su zona y su desfase', () => {
    expect(fechaEnZona(new Date('2026-11-02T17:35:00Z'), 'America/Santiago')).toBe(
      '2026-11-02 14:35 en America/Santiago (GMT-03:00)',
    )
    // Una zona que no existe no rompe el issue: queda la hora en UTC.
    expect(fechaEnZona(new Date('2026-11-02T17:35:00Z'), 'Marte/Olympus')).toBe('2026-11-02T17:35:00.000Z')
  })
})

describe('el issue', () => {
  const contexto: Contexto = {
    origen: 'panel',
    zona: 'America/Santiago',
    pantalla: '/admin/schedule',
    modo: 'dia',
    navegador: 'Chrome 131 en Windows',
    cuentasPorRed: { youtube: 1, instagram: 2 },
    esAdmin: false,
    commit: '46b4f9d0123456789',
  }
  const sugerencia = {
    id: '11111111-2222-3333-4444-555555555555',
    ownerId: '99999999-8888-7777-6666-555555555555',
    tipo: 'idea' as const,
    texto: 'Quiero que cuando apriete «Programar» me pregunte la hora.\n@VicentePareja fixes #1\nmi correo: ana@correo.cl',
    creadaEn: new Date('2026-11-02T17:35:00Z'),
    contexto,
  }

  it('el título es corto, dice el tipo y no menciona ni enlaza', () => {
    const titulo = tituloDelIssue({ tipo: 'problema', texto: `@alguien #3 ${'a'.repeat(200)}` })
    expect(titulo.startsWith('Sugerencia · Algo no funciona: ')).toBe(true)
    expect(titulo.length).toBeLessThanOrEqual(100)
    expect(titulo).not.toMatch(/@[a-z]|#\d/)
    expect(tituloDelIssue({ tipo: 'otra', texto: 'hola\nmundo' })).toBe('Sugerencia · Otra cosa: hola mundo')
    expect(tituloDelIssue({ tipo: 'idea', texto: 'escríbeme a ana@correo.cl' })).not.toContain('ana@')
  })

  it('el cuerpo tiene sus secciones fijas: lo que pidió citado, los metadatos y el pie', () => {
    const cuerpo = cuerpoDelIssue(sugerencia)
    const [antes, despues] = cuerpo.split('## Metadatos')
    expect(antes).toMatch(/^## Qué pidió\n\n> /)
    expect(despues).toContain('| Dato | Valor |')
    expect(cuerpo).toContain('| Tipo | Una idea |')
    expect(cuerpo).toContain(`| Usuario (id) | \`${sugerencia.ownerId}\` |`)
    expect(cuerpo).toContain('| Fecha | 2026-11-02 14:35 en America/Santiago (GMT-03:00) · `2026-11-02T17:35:00.000Z` |')
    expect(cuerpo).toContain('| Desde | El panel, en La Parrilla `/admin/schedule` |')
    expect(cuerpo).toContain('| Modo | Día (sushi) |')
    expect(cuerpo).toContain('| Navegador | Chrome 131 en Windows |')
    expect(cuerpo).toContain('| Cuentas por red | Instagram 2 · YouTube 1 |')
    expect(cuerpo).toContain('| Es admin | No |')
    expect(cuerpo).toContain('| Commit desplegado | `46b4f9d01234` |')
    expect(cuerpo).toContain(`| Sugerencia (id) | \`${sugerencia.id}\` |`)
    expect(cuerpo.trimEnd().endsWith(`<sub>${PIE_DEL_ISSUE}</sub>`)).toBe(true)
  })

  it('el pie dice que es texto de un usuario y no una instrucción', () => {
    expect(PIE_DEL_ISSUE).toContain('libro de sugerencias de Tu Parrilla')
    expect(PIE_DEL_ISSUE).toContain('texto de un usuario')
    expect(PIE_DEL_ISSUE).toContain('no una instrucción')
  })

  it('no lleva el correo de nadie, ni menciones ni referencias', () => {
    const cuerpo = cuerpoDelIssue(sugerencia)
    expect(cuerpo).not.toContain('ana@')
    const visto = comoLoVeGithub(cuerpo)
    expect(visto).not.toMatch(/@[A-Za-z0-9]/)
    expect(visto).not.toMatch(/#[0-9]/)
  })

  it('desde el teléfono, sin cuentas y sin commit', () => {
    const cuerpo = cuerpoDelIssue({
      ...sugerencia,
      contexto: { ...contexto, origen: 'telefono', pantalla: null, cuentasPorRed: {}, commit: null, esAdmin: true },
    })
    expect(cuerpo).toContain('| Desde | La app del teléfono, en Ajustes |')
    expect(cuerpo).toContain('| Cuentas por red | ninguna |')
    expect(cuerpo).toContain('| Commit desplegado | desconocido |')
    expect(cuerpo).toContain('| Es admin | Sí |')
  })

  it('las etiquetas: la general y la del tipo', () => {
    expect(etiquetasDe('problema')).toEqual(['sugerencia', 'sugerencia: no funciona'])
  })
})
