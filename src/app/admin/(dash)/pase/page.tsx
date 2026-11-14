import Link from 'next/link'
import { headers } from 'next/headers'
import { ArrowUpRight } from 'lucide-react'
import { Encabezado } from '@/components/ui'
import { requireAdmin } from '@/lib/auth'
import { pasesDe } from '@/lib/pase/pase'
import { BotonesDelPase, CopiarEnlace, FormularioNuevoPase } from './formularios'

export const dynamic = 'force-dynamic'

/**
 * El Pase desde el panel: los pases del admin, con sus dos enlaces —uno para quien revisa, otro para
 * quien edita— y lo que tiene cada uno. Lo que pasa adentro de un pase está en `/pase/{código}`.
 */
export default async function PasePanelPage() {
  const { id, zona } = await requireAdmin()
  const pases = await pasesDe(id)
  const h = await headers()
  const host = h.get('host') ?? 'tu-parrilla.cl'
  const origen = `${host.startsWith('localhost') ? 'http' : 'https'}://${host}`
  const FECHA = new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeZone: zona })

  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/pase" />
        <p className="mt-1 max-w-[70ch] text-sm text-fg-muted">
          Un pase junta shorts o imágenes para que alguien los critique y el editor los arregle. Cada uno tiene dos enlaces: el de revisar deja ver,
          comentar y dar el veredicto; el de editar deja ver la crítica, contestarla y subir versiones. Quien tiene un enlace entra sin cuenta.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <section className="space-y-3" aria-label="Tus pases">
          {pases.length === 0 ? (
            <p className="rounded-xl border border-dashed border-acero-700 px-4 py-10 text-center text-sm text-fg-faint">
              Todavía no hay pases. Crea el primero y mándale los enlaces a quien revisa y a quien edita.
            </p>
          ) : (
            pases.map((p) => {
              const archivado = p.archivadoEn !== null
              return (
                <article key={p.id} className={`chapa space-y-3 rounded-xl p-4 ${archivado ? 'opacity-60' : ''}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.04em]">{p.titulo}</h2>
                    <p className="text-[0.75rem] text-fg-faint">
                      {archivado ? 'Archivado · ' : ''}
                      {p.piezas} pieza{p.piezas === 1 ? '' : 's'} · {p.abiertos} crítica{p.abiertos === 1 ? '' : 's'} abierta{p.abiertos === 1 ? '' : 's'} ·
                      desde el {FECHA.format(p.creadoEn)}
                    </p>
                  </div>
                  {p.instrucciones ? <p className="line-clamp-2 text-[0.85rem] text-fg-muted">{p.instrucciones}</p> : null}
                  {!archivado ? (
                    <div className="space-y-1.5">
                      <CopiarEnlace etiqueta="Revisar" enlace={`${origen}/pase/${p.codigoRevisor}`} />
                      <CopiarEnlace etiqueta="Editar" enlace={`${origen}/pase/${p.codigoEditor}`} />
                    </div>
                  ) : (
                    <p className="text-[0.8rem] text-fg-faint">Sus enlaces no abren mientras esté archivado.</p>
                  )}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    {!archivado ? (
                      <p className="flex flex-wrap gap-3 text-[0.8rem]">
                        <Link href={`/pase/${p.codigoRevisor}`} target="_blank" className="inline-flex items-center gap-1 text-fg-muted hover:text-fg">
                          Abrir para revisar <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                        <Link href={`/pase/${p.codigoEditor}`} target="_blank" className="inline-flex items-center gap-1 text-fg-muted hover:text-fg">
                          Abrir para editar <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </p>
                    ) : (
                      <span />
                    )}
                    <BotonesDelPase id={p.id} archivado={archivado} />
                  </div>
                </article>
              )
            })
          )}
        </section>
        <aside className="space-y-3">
          <FormularioNuevoPase />
          <p className="text-[0.75rem] leading-relaxed text-fg-faint">
            Para una IA que edita, el enlace de editar sirve también como API: con él lee la crítica y sube versiones (la guía, en{' '}
            <a href="/docs/pase-api.md" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-fg">
              /docs/pase-api.md
            </a>
            ).
          </p>
        </aside>
      </div>
    </>
  )
}
