import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import {
  PALABRAS_DE_DIA,
  PANTALLAS,
  ROTULO_CALOR,
  SE_QUEMO,
  ajustes,
  nombreDe,
  nombreEn,
  pantallaDe,
  pestanas,
} from './vocabulario'

describe('«Se quemó» en cada modo', () => {
  // La app la copia en `mobile/src/lib/tema.ts`: se compara por texto, porque `mobile/` no se
  // importa desde acá (tiene su propio tsconfig, el de Expo).
  it('de día se echó a perder, y la app del teléfono dice lo mismo que el panel', () => {
    expect(SE_QUEMO).toEqual({ noche: 'Se quemó', dia: 'Se echó a perder' })
    const app = readFileSync(join(process.cwd(), 'mobile', 'src', 'lib', 'tema.ts'), 'utf8')
    expect(app).toContain(`SE_QUEMO: Record<Tema, string> = { noche: '${SE_QUEMO.noche}', dia: '${SE_QUEMO.dia}' }`)
  })

  it('la app del teléfono llama igual que el panel a las pantallas que cambian de día y al calor de cada día', () => {
    const app = readFileSync(join(process.cwd(), 'mobile', 'src', 'lib', 'tema.ts'), 'utf8')
    for (const [constante, ruta] of [
      ['LA_PARRILLA', '/admin/schedule'],
      ['LOS_FIERROS', '/admin/accounts'],
    ] as const) {
      expect(app).toContain(`${constante}: Record<Tema, string> = { noche: '${nombreDe(ruta)}', dia: '${nombreDe(ruta, 'dia')}' }`)
    }
    for (const tema of ['noche', 'dia'] as const) {
      const { apagada, prendida, llena } = ROTULO_CALOR[tema]
      expect(app).toContain(`${tema}: { apagada: '${apagada}', prendida: '${prendida}', llena: '${llena}' }`)
    }
  })
})

/** Los archivos de una carpeta, recursivos, sin los tests. */
function fuentes(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const ruta = join(dir, e.name)
    if (e.isDirectory()) return fuentes(ruta)
    return /\.tsx?$/.test(e.name) && !/\.test\./.test(e.name) ? [ruta] : []
  })
}

/** El texto de cada cadena, plantilla y texto JSX de un archivo, con su renglón: lo que se ve, sin los comentarios. */
function textosDe(archivo: string): Array<{ renglon: number; texto: string }> {
  const fuente = readFileSync(archivo, 'utf8')
  const sf = ts.createSourceFile(archivo, fuente, ts.ScriptTarget.Latest, true, archivo.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
  const textos: Array<{ renglon: number; texto: string }> = []
  const visitar = (nodo: ts.Node) => {
    if (ts.isStringLiteral(nodo) || ts.isNoSubstitutionTemplateLiteral(nodo) || ts.isJsxText(nodo)) {
      textos.push({ renglon: sf.getLineAndCharacterOfPosition(nodo.getStart()).line + 1, texto: nodo.text })
    } else if (ts.isTemplateExpression(nodo)) {
      textos.push({ renglon: sf.getLineAndCharacterOfPosition(nodo.getStart()).line + 1, texto: nodo.getText() })
    }
    ts.forEachChild(nodo, visitar)
  }
  visitar(sf)
  return textos
}

describe('el modo día', () => {
  it('La Parrilla es La Barra y Los Fierros son Los Cuchillos; las demás pantallas se llaman igual', () => {
    expect(nombreDe('/admin/schedule', 'dia')).toBe('La Barra')
    expect(nombreDe('/admin/accounts', 'dia')).toBe('Los Cuchillos')
    // Sin modo, la noche: lo que no sabe en qué modo se lee nombra la pantalla como siempre.
    expect(nombreDe('/admin/schedule')).toBe('La Parrilla')
    expect(nombreDe('/admin/accounts')).toBe('Los Fierros')
    for (const p of PANTALLAS.filter((p) => p.ruta !== '/admin/schedule' && p.ruta !== '/admin/accounts')) {
      expect(nombreEn(p, 'dia'), p.ruta).toBe(p.nombre)
    }
  })

  it('no hay dos pantallas con el mismo nombre de día, ni uno de día que sea el de noche de otra', () => {
    const deDia = PANTALLAS.map((p) => nombreEn(p, 'dia'))
    expect(new Set(deDia).size).toBe(deDia.length)
    for (const p of PANTALLAS) {
      if (p.nombreDeDia) expect(PANTALLAS.map((q) => q.nombre)).not.toContain(p.nombreDeDia)
    }
  })

  it('cada palabra de día dice otra cosa que la de noche', () => {
    for (const palabra of PALABRAS_DE_DIA) expect(palabra.dia, palabra.noche).not.toBe(palabra.noche)
  })

  it('ningún texto del panel ni de la portada escribe a mano el nombre de una pantalla que cambia de día', () => {
    // Escrito a mano, el nombre no cambia con el modo: de día la persona leería «Los Fierros»
    // al lado de una barra que dice «Los Cuchillos». Va con `NombreDe` o con `nombreDe(ruta, tema)`.
    // Las frases de error no viven acá (`src/lib`): son de la API y se guardan, y no cambian.
    const nombres = PANTALLAS.filter((p) => p.nombreDeDia).map((p) => p.nombre)
    const raiz = process.cwd()
    const hallazgos = [join(raiz, 'src', 'app', 'admin'), join(raiz, 'src', 'components')]
      .flatMap(fuentes)
      .flatMap((archivo) =>
        textosDe(archivo)
          .filter(({ texto }) => nombres.some((nombre) => texto.includes(nombre)))
          .map(({ renglon, texto }) => `${relative(raiz, archivo)}:${renglon}: ${texto.trim().slice(0, 80)}`),
      )
    expect(hallazgos).toEqual([])
  })
})

describe('el vocabulario del panel', () => {
  it('cada pantalla apunta a una ruta que existe de verdad bajo (dash)', () => {
    // La tabla es de presentación: si alguien renombra una carpeta y no la tabla, la
    // pestaña llevaría a un 404 y ningún typecheck lo vería. El sistema de archivos sí.
    const base = join(process.cwd(), 'src', 'app', 'admin', '(dash)')
    for (const p of PANTALLAS) {
      const carpeta = join(base, p.ruta.replace('/admin/', ''))
      expect(existsSync(join(carpeta, 'page.tsx')), `${p.ruta} no tiene page.tsx`).toBe(true)
    }
  })

  it('no hay dos pantallas con la misma ruta ni con el mismo nombre', () => {
    const rutas = PANTALLAS.map((p) => p.ruta)
    const nombres = PANTALLAS.map((p) => p.nombre)
    expect(new Set(rutas).size).toBe(rutas.length)
    expect(new Set(nombres).size).toBe(nombres.length)
  })

  it('cuatro pestañas con La Parrilla primera y La Cocina al final, y Ajustes con tres entradas para un usuario y cuatro para el admin', () => {
    expect(pestanas(false).map((p) => p.ruta)).toEqual([
      '/admin/schedule',
      '/admin/comments',
      '/admin/analytics',
      '/admin/ia',
    ])
    expect(pestanas(true)).toEqual(pestanas(false))
    expect(ajustes(false).map((p) => p.ruta)).toEqual(['/admin/accounts', '/admin/profiles', '/admin/cuenta'])
    expect(ajustes(true).map((p) => p.ruta)).toEqual([
      '/admin/accounts',
      '/admin/profiles',
      '/admin/usuarios',
      '/admin/cuenta',
    ])
  })

  it('pantallaDe resuelve por segmento, y /admin solo no es ninguna (redirige a La Parrilla)', () => {
    expect(pantallaDe('/admin')).toBeNull()
    expect(pantallaDe('/admin/schedule')?.ruta).toBe('/admin/schedule')
    expect(pantallaDe('/admin/schedule/abc')?.ruta).toBe('/admin/schedule')
    expect(pantallaDe('/admin/accounts/elegir')?.ruta).toBe('/admin/accounts')
    expect(pantallaDe('/admin/profiles/xyz')?.ruta).toBe('/admin/profiles')
    // Las publicaciones viven dentro de Los Números: la pestaña queda marcada.
    expect(pantallaDe('/admin/analytics/publicaciones')?.ruta).toBe('/admin/analytics')
    // El manual vive dentro de La Cocina: la pestaña queda marcada mientras se lee.
    expect(pantallaDe('/admin/ia/manual/la-parrilla')?.ruta).toBe('/admin/ia')
    // Un prefijo de texto que no es un segmento no cuenta: /admin/scheduleX no es la parrilla.
    expect(pantallaDe('/admin/scheduleX')).toBeNull()
    expect(pantallaDe('/ingresar')).toBeNull()
  })

  it('todas llevan subtítulo en llano: es la red de seguridad de los nombres', () => {
    for (const p of PANTALLAS) expect(p.subtitulo.length).toBeGreaterThan(8)
  })

  it('el <Encabezado ruta="…"> de cada page.tsx coincide con la carpeta que lo contiene', () => {
    // El inverso de la primera prueba: ahí se comprueba que la tabla apunta a una carpeta
    // real; acá que la carpeta, a su vez, pega su `<Encabezado>` a la ruta correcta. Un
    // `<Encabezado ruta="/admin/content">` pegado en otra pantalla renderizaría el título
    // equivocado sin que nada más lo viera — ni el typecheck, ni la prueba de arriba.
    const base = join(process.cwd(), 'src', 'app', 'admin', '(dash)')
    for (const p of PANTALLAS) {
      const carpeta = join(base, p.ruta.replace('/admin/', ''))
      const archivo = join(carpeta, 'page.tsx')
      const texto = readFileSync(archivo, 'utf8')
      const match = texto.match(/<Encabezado\s+ruta="([^"]+)"/)
      expect(match, `${archivo} no tiene <Encabezado ruta="…">`).not.toBeNull()
      expect(match?.[1], archivo).toBe(p.ruta)
    }
  })

  it('la carga de una pantalla, si lleva su título, lleva el de su carpeta', () => {
    // Las cargas con forma (`loading.tsx`) dibujan el título de verdad para que no salte al
    // llegar. Copiado de otra pantalla, la carga diría un nombre y la pantalla otro.
    const base = join(process.cwd(), 'src', 'app', 'admin', '(dash)')
    for (const p of PANTALLAS) {
      const archivo = join(base, p.ruta.replace('/admin/', ''), 'loading.tsx')
      if (!existsSync(archivo)) continue
      for (const [, ruta] of readFileSync(archivo, 'utf8').matchAll(/<Encabezado\s+ruta="([^"]+)"/g)) {
        expect(ruta, archivo).toBe(p.ruta)
      }
    }
  })
})
