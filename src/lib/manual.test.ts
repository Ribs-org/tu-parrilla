import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGINAS, RUTA_DEL_MANUAL, cuerpoDe, esPaginaDelManual, htmlDe, nombreEnLaLista, rutaDe, tituloDe } from './manual'

const DIR = 'public/docs/ui'

describe('el manual del parrillero', () => {
  it('trae todas las páginas de la wiki, y nada más', () => {
    const archivos = readdirSync(DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
    expect([...PAGINAS].sort()).toEqual(archivos.sort())
  })

  it('cada página tiene nombre en la lista', () => {
    for (const pagina of PAGINAS) {
      const nombre = nombreEnLaLista(pagina, readFileSync(join(DIR, `${pagina}.md`), 'utf8'))
      expect(nombre.length, pagina).toBeGreaterThan(3)
      expect(nombre, pagina).not.toContain('—')
    }
  })

  it('la entrada es el manual a secas, y cada otra página cuelga de él', () => {
    expect(rutaDe('index')).toBe(RUTA_DEL_MANUAL)
    expect(rutaDe('la-parrilla')).toBe(`${RUTA_DEL_MANUAL}/la-parrilla`)
    expect(esPaginaDelManual('la-parrilla')).toBe(true)
    expect(esPaginaDelManual('../README')).toBe(false)
  })

  it('el título sale de la primera línea, sin el «# »', () => {
    expect(tituloDe('# La Parrilla — lo que viene\r\n\ntexto')).toBe('La Parrilla — lo que viene')
  })
})

describe('una página del manual', () => {
  const md = [
    '# Los Fierros — tus redes conectadas',
    '',
    'Ver [La Parrilla](la-parrilla.md), [el índice](index.md) y [la guía](../api-llm.md).',
    'Una que no es del manual: [vieja](otra.md).',
    '',
    '| A | B |',
    '|---|---|',
    '| 1 | 2 |',
    '',
    '## Para quien mantiene esta página',
    '',
    '- `src/app/admin/(dash)/accounts/page.tsx`',
  ].join('\n')

  it('pierde el título, que lo pone la pantalla, y el pie para quien la mantiene', () => {
    const cuerpo = cuerpoDe(md)
    expect(cuerpo).not.toContain('# Los Fierros')
    expect(cuerpo).not.toContain('Para quien mantiene')
    expect(cuerpo).not.toContain('src/app/admin')
  })

  it('lleva cada enlace adonde sirve: las páginas al manual, las guías a /docs/', () => {
    const cuerpo = cuerpoDe(md)
    expect(cuerpo).toContain(`[La Parrilla](${RUTA_DEL_MANUAL}/la-parrilla)`)
    expect(cuerpo).toContain(`[el índice](${RUTA_DEL_MANUAL})`)
    expect(cuerpo).toContain('[la guía](/docs/api-llm.md)')
    expect(cuerpo).toContain('[vieja](/docs/ui/otra.md)')
  })

  it('en HTML, las guías abren aparte y las tablas van en su caja', () => {
    const html = htmlDe(cuerpoDe(md))
    expect(html).toContain('<a target="_blank" rel="noreferrer" href="/docs/api-llm.md">la guía</a>')
    expect(html).toContain(`<a href="${RUTA_DEL_MANUAL}/la-parrilla">La Parrilla</a>`)
    expect(html).toContain('<div class="manual-tabla"><table>')
    expect(html).toContain('</table></div>')
  })

  it('los marcadores entre ángulos se leen: no se los come el navegador como etiquetas', () => {
    const html = htmlDe('La frase «Tu llave «<nombre>». Cópiala ahora», y «<N> se enfrían».')
    expect(html).toContain('«Tu llave «&lt;nombre&gt;». Cópiala ahora»')
    expect(html).toContain('«&lt;N&gt; se enfrían»')
    expect(htmlDe(cuerpoDe(readFileSync(join(DIR, 'la-cocina.md'), 'utf8')))).toContain('«creada &lt;fecha&gt; · sin usar»')
  })

  it('ningún enlace de la wiki de verdad queda apuntando a un .md suelto de la carpeta', () => {
    for (const pagina of PAGINAS) {
      const cuerpo = cuerpoDe(readFileSync(join(DIR, `${pagina}.md`), 'utf8'))
      expect(cuerpo, pagina).not.toMatch(/\]\([a-z0-9-]+\.md\)/)
    }
  })
})
