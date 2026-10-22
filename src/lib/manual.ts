// El manual del parrillero: la wiki de la UI (`public/docs/ui/`), armada para leerla en el
// panel, dentro de La Cocina. La wiki está escrita para que un LLM guíe a una persona sin ver su
// pantalla, con el texto literal de cada botón; el manual la muestra tal cual, para que la lea
// la persona misma. Lo que cambia es solo la forma: sin el pie para quien la mantiene, y con
// los enlaces entre páginas llevados al manual. Puro a propósito: la página lee los archivos.
import { Marked } from 'marked'

/**
 * Las páginas de la wiki, en el orden del manual: la de entrada, la puerta, las cuatro
 * pestañas, lo de Ajustes y la app del teléfono. Un test exige que estén todas las de la
 * carpeta: una página nueva de la wiki tiene que entrar acá para salir en el manual.
 */
export const PAGINAS = [
  'index',
  'ingresar',
  'la-parrilla',
  'la-mesa',
  'los-numeros',
  'la-cocina',
  'los-fierros',
  'la-vitrina',
  'los-maestros',
  'tu-cuenta',
  'app-movil',
] as const

export type PaginaDelManual = (typeof PAGINAS)[number]

export const RUTA_DEL_MANUAL = '/admin/ia/manual'

/** El pie de cada página de la wiki: los archivos de donde sale. Es para quien la mantiene. */
const PIE = '## Para quien mantiene esta página'

export function esPaginaDelManual(nombre: string): nombre is PaginaDelManual {
  return (PAGINAS as readonly string[]).includes(nombre)
}

export function rutaDe(pagina: PaginaDelManual): string {
  return pagina === 'index' ? RUTA_DEL_MANUAL : `${RUTA_DEL_MANUAL}/${pagina}`
}

/** El título de una página: su primera línea, sin el «# ». */
export function tituloDe(md: string): string {
  const primera = md.replace(/\r\n/g, '\n').split('\n')[0] ?? ''
  return primera.replace(/^#\s+/, '').trim()
}

/**
 * El nombre de una página en la lista del manual: su título hasta la raya («La Parrilla — lo
 * que viene…» es «La Parrilla»). La de entrada no se llama como su título, que le habla al LLM.
 */
export function nombreEnLaLista(pagina: PaginaDelManual, md: string): string {
  if (pagina === 'index') return 'Para empezar'
  return tituloDe(md).split(' — ')[0]!.trim()
}

/**
 * Lo que se lee de una página: sin el título, que lo pone la pantalla; sin el pie para quien
 * la mantiene, y con cada enlace llevado adonde sirve: otra página de la wiki, al manual; las
 * guías de la API (`../api-llm.md`), a `/docs/`, donde se sirven.
 */
export function cuerpoDe(md: string): string {
  const texto = md.replace(/\r\n/g, '\n')
  const sinPie = texto.split(PIE)[0]!
  const sinTitulo = sinPie.replace(/^#\s[^\n]*\n/, '')
  return sinTitulo
    .replace(/\]\(\.\.\/([a-z0-9-]+\.(?:md|json))\)/g, '](/docs/$1)')
    .replace(/\]\(([a-z0-9-]+)\.md\)/g, (_, pagina: string) =>
      esPaginaDelManual(pagina) ? `](${rutaDe(pagina)})` : `](/docs/ui/${pagina}.md)`,
    )
}

/** Un texto listo para ir en HTML tal cual se lee. */
function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

const marked = new Marked({
  gfm: true,
  renderer: {
    // La wiki no escribe HTML: lo que va entre ángulos —«<nombre>», «<N>», «<red>»— es un
    // marcador, y pasado tal cual el navegador se lo come como una etiqueta desconocida.
    html({ text }) {
      return escapar(text)
    },
  },
})

/**
 * El HTML de una página. La wiki es nuestra —sale del repositorio, no de nadie de afuera—, y
 * aun así nada de ella pasa como HTML: ver `escapar`, arriba. Lo de `/docs/` abre aparte, y
 * cada tabla va en una caja que se desliza de lado, porque en un teléfono las de la wiki no
 * caben.
 */
export function htmlDe(cuerpo: string): string {
  return (marked.parse(cuerpo, { async: false }) as string)
    .replace(/<a href="\/docs\//g, '<a target="_blank" rel="noreferrer" href="/docs/')
    .replace(/<table>/g, '<div class="manual-tabla"><table>')
    .replace(/<\/table>/g, '</table></div>')
}
