import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PANTALLAS, ajustes, pantallaDe, pestanas } from './vocabulario'

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

  it('cuatro pestañas con La Parrilla primera y Tu IA al final, y Ajustes con tres entradas para un usuario y cuatro para el admin', () => {
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
    // El manual vive dentro de Tu IA: la pestaña queda marcada mientras se lee.
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
