import { readFile } from 'node:fs/promises'
import path from 'node:path'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { requireUser } from '@/lib/auth'
import { PAGINAS, cuerpoDe, esPaginaDelManual, htmlDe, nombreEnLaLista, rutaDe, tituloDe, type PaginaDelManual } from '@/lib/manual'
import { temaPedido } from '@/lib/tema-servidor'
import { cn } from '@/lib/utils'
import { MANUAL, nombreDe } from '@/lib/vocabulario'

export const dynamic = 'force-dynamic'

/**
 * El título de la pestaña del navegador, en el modo de este equipo: el CSS que cambia el de la
 * página no llega hasta acá. Sale de la cookie y no de la cuenta, como el color de la barra del
 * navegador (`(dash)/layout.tsx`), para no leer la base dos veces.
 */
export async function generateMetadata() {
  return { title: MANUAL[await temaPedido()] }
}

/**
 * La carpeta de la wiki. Se lee del disco y no por la red: `next.config.ts` la incluye en la
 * función (`outputFileTracingIncludes`), porque lo de `public/` lo sirve la CDN y no viaja solo
 * con el servidor.
 */
const CARPETA = path.join(process.cwd(), 'public', 'docs', 'ui')

function leer(pagina: PaginaDelManual): Promise<string> {
  return readFile(path.join(CARPETA, `${pagina}.md`), 'utf8')
}

/**
 * El manual del parrillero —de día, el del maestro de sushi—: una página de la wiki de la UI por dirección
 * (`/admin/ia/manual/la-parrilla`), con la lista de todas al lado. Vive dentro de La Cocina, que
 * queda marcada en la barra mientras se lee.
 */
export default async function ManualPage({ params }: { params: Promise<{ pagina?: string[] }> }) {
  await requireUser()
  const { pagina: partes } = await params
  const nombre = partes?.[0] ?? 'index'
  if ((partes?.length ?? 0) > 1 || !esPaginaDelManual(nombre)) notFound()

  const textos = await Promise.all(PAGINAS.map(leer))
  const md = textos[PAGINAS.indexOf(nombre)]!
  const lista = PAGINAS.map((p, i) => ({ pagina: p, nombre: nombreEnLaLista(p, textos[i]!) }))
  const html = htmlDe(cuerpoDe(md))

  return (
    <>
      <header className="mb-8">
        <Link href="/admin/ia" className="text-sm text-fg-muted hover:text-fg">
          ← {nombreDe('/admin/ia')}
        </Link>
        <h1 className="mt-3 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          <DeNocheYDeDia noche={MANUAL.noche} dia={MANUAL.dia} />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">
          Cada pantalla del panel, botón por botón, con el texto literal de cada uno, lo que dice cada mensaje y
          qué hacer con él. Lo escribimos para que tu IA te guíe sin ver tu pantalla —por eso a ratos le habla
          a ella—, y sirve igual para leerlo tú.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
        <nav aria-label="Páginas del manual">
          <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
            {lista.map((p) => (
              <li key={p.pagina}>
                <Link
                  href={rutaDe(p.pagina)}
                  aria-current={p.pagina === nombre ? 'page' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-1.5 text-sm transition-colors',
                    p.pagina === nombre ? 'bg-acero-800 text-fg' : 'text-fg-muted hover:text-fg',
                  )}
                >
                  {p.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="chapa min-w-0 rounded-xl p-5 sm:p-7">
          <h2 className="font-titulo text-xl font-semibold uppercase tracking-[0.04em]">
            {nombre === 'index' ? 'Para empezar' : tituloDe(md)}
          </h2>
          {/* La wiki es del repositorio, no de nadie de afuera: ver `htmlDe`. */}
          <div className="manual mt-5" dangerouslySetInnerHTML={{ __html: html }} />
        </article>
      </div>
    </>
  )
}
