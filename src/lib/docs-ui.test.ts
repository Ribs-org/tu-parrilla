import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PANTALLAS } from './vocabulario'

// La reja de la wiki de la UI (`public/docs/ui/`), la que un LLM lee para guiar a una
// persona que se perdió en el panel. No puede comprobar que cada página diga la verdad
// —eso es trabajo de quien cambia la pantalla, ver `docs/wiki-ui.md`—, pero sí que no se
// quede atrás en lo que se puede medir: una pantalla nueva o renombrada sin su página, un
// enlace roto, o una página que cita archivos que ya no existen.

const DIR = 'public/docs/ui'
const PIE = '## Para quien mantiene esta página'

const paginas = readdirSync(DIR).filter((f) => f.endsWith('.md'))
const leer = (archivo: string) => readFileSync(join(DIR, archivo), 'utf8')

describe('la wiki de la UI no le miente al panel', () => {
  it('cada pantalla del vocabulario tiene su página, con su nombre, su subtítulo y su ruta', () => {
    for (const pantalla of PANTALLAS) {
      const titulo = `# ${pantalla.nombre} — ${pantalla.subtitulo}`
      const pagina = paginas.find((f) => leer(f).split(/\r?\n/)[0] === titulo)
      expect(pagina, `ninguna página de ${DIR} empieza con «${titulo}»`).toBeDefined()
      expect(leer(pagina!)).toContain(`\`${pantalla.ruta}\``)
    }
  })

  it('el índice enlaza todas las páginas', () => {
    const indice = leer('index.md')
    for (const pagina of paginas.filter((f) => f !== 'index.md')) {
      expect(indice, `index.md no enlaza ${pagina}`).toContain(`](${pagina}`)
    }
  })

  it('cada enlace entre páginas, y hacia las guías de la API, lleva a un archivo que existe', () => {
    for (const pagina of paginas) {
      for (const [, destino] of leer(pagina).matchAll(/\]\(([a-z0-9-]+\.md)(?:#[^)]*)?\)/g)) {
        expect(paginas, `${pagina} enlaza ${destino}, que no existe`).toContain(destino)
      }
      for (const [, destino] of leer(pagina).matchAll(/\]\(\.\.\/([a-z0-9-]+\.(?:md|json))(?:#[^)]*)?\)/g)) {
        expect(existsSync(join('public/docs', destino!)), `${pagina} enlaza ../${destino}, que no existe`).toBe(true)
      }
    }
  })

  it('cada página dice de qué archivos sale, y esos archivos existen', () => {
    for (const pagina of paginas.filter((f) => f !== 'index.md')) {
      const pie = leer(pagina).split(PIE)[1]
      expect(pie, `${pagina} no tiene la sección «${PIE.slice(3)}»`).toBeDefined()
      const citados = [...pie!.matchAll(/`((?:src|mobile)\/[^`*]+?)\/?(?:\*\*?)?`/g)].map(([, ruta]) => ruta!)
      expect(citados.length, `${pagina} no cita ningún archivo en su pie`).toBeGreaterThan(0)
      for (const ruta of citados) {
        expect(existsSync(ruta), `${pagina} cita ${ruta}, que no existe: actualiza la página`).toBe(true)
      }
    }
  })
})
