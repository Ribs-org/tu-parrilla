import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { etiquetaDestino, motivoDestino, nombreDestino } from '@/app/admin/(dash)/schedule/etiqueta'
import { Panel } from '@/components/charts/panel'
import { RangoBar } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import { PERCENTIL_POR_DEFECTO, leerPercentil } from '@/lib/mejores'
import { networkLabel } from '@/lib/networks'
import { CLAVE_PIEZA, ordenarVersiones, repartirAtributos, textoDeAtributo } from '@/lib/pieza'
import { getPieza, type VersionDePieza } from '@/lib/piezas'
import { getPostRows } from '@/lib/posts'
import type { PostRow } from '@/lib/posts-kpis'
import { numerosHref, type Params } from '@/lib/tablero'
import { cn, formatNumber } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'

export const dynamic = 'force-dynamic'

/** `—` y nunca `0`: no saber y no tener son respuestas distintas. */
function num(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : formatNumber(value)
}

function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${value.toFixed(2)}%`
}

/**
 * La pieza: cada lugar donde salió una publicación, con sus números lado a lado. Las
 * versiones son los destinos del post programado del que salió y, si sus atributos traen
 * `pieza`, los de todos los posts programados con el mismo valor (`getPieza`). Se entra
 * desde «Tus publicaciones», «Lo que más creció» y «Qué publicación te trajo gente».
 */
export default async function PiezaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Params>
}) {
  const { id } = await params
  const query = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const pieza = await getPieza(ownerId, id)
  if (!pieza) notFound()

  // Como en «Tus publicaciones»: la página y los bots son filtros de «En tu página» del
  // tablero, y acá no se ven. Las borradas entran: una versión borrada sigue siendo parte
  // de la historia de la pieza.
  const filters = parseFilters(query, ownerId, zona)
  const ids = pieza.versiones.map((v) => v.socialPostId).filter((s): s is string => s !== null)
  const filas = await getPostRows({ ...filters, profileId: null, includeBots: false }, true, { ids })
  const filaDe = new Map(filas.map((f) => [f.id, f]))
  const versiones = ordenarVersiones(
    pieza.versiones.map((v) => ({ ...v, fila: v.socialPostId ? (filaDe.get(v.socialPostId) ?? null) : null })),
  )
  const { comunes, queCambian } = repartirAtributos(versiones)
  const organica = versiones.length === 1 && versiones[0]!.scheduledPostId === null
  const programados = new Set(versiones.map((v) => v.scheduledPostId).filter(Boolean)).size

  // Vuelve a donde se entró: el tablero marca sus enlaces con `de=numeros`, y «Tu mejor
  // 10 %» con `de=mejores`; sin marca, a Tus publicaciones.
  const vuelta =
    query.de === 'numeros'
      ? { ruta: '/admin/analytics', texto: nombreDe('/admin/analytics') }
      : query.de === 'mejores'
        ? { ruta: '/admin/analytics/mejores', texto: `Tu mejor ${leerPercentil(typeof query.percentil === 'string' ? query.percentil : null) ?? PERCENTIL_POR_DEFECTO} %` }
        : { ruta: '/admin/analytics/publicaciones', texto: 'Tus publicaciones' }
  const aqui = numerosHref(`/admin/analytics/publicaciones/${pieza.abierta.id}`, query, {})
  const fecha = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: zona,
  })

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref(vuelta.ruta, query, { de: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {vuelta.texto}
        </Link>
        <p className="mt-2 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-fg-faint">Pieza</p>
        <h1 className="line-clamp-2 max-w-3xl font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">
          {pieza.abierta.caption || `?s=${pieza.abierta.campaign}`}
        </h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Cada lugar donde salió, con sus números lado a lado. Las views las cuenta cada red; las
          visitas, Tu Parrilla, cuando alguien entra por el link de esa versión.
        </p>
        {pieza.clave || comunes.length > 0 ? (
          <ul aria-label="Atributos" className="mt-3 flex flex-wrap gap-1.5">
            {pieza.clave ? <Atributo clave={CLAVE_PIEZA} valor={pieza.clave} /> : null}
            {comunes.map(([clave, valor]) => (
              <Atributo
                key={clave}
                clave={clave}
                valor={valor}
                href={numerosHref('/admin/analytics/comparar', query, { atributo: clave, de: null })}
              />
            ))}
          </ul>
        ) : null}
      </header>

      <RangoBar periodo={filters.periodo} />

      <Panel
        className="mt-4"
        title={versiones.length === 1 ? 'Una versión' : `${versiones.length} versiones`}
        hint="Los números del período elegido; con «Todo», los de toda la vida. Views: el total en la red, con lo ganado en el período al lado. En YouTube no hay ganado ni arrastre: sus reglas no permiten calcular métricas con sus datos."
      >
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[34rem] border-collapse text-[0.85rem]">
            <thead>
              <tr className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-faint">
                <th colSpan={1 + queCambian.length} />
                <th className="whitespace-nowrap pb-1 text-right font-normal">En la red</th>
                <th colSpan={2} className="whitespace-nowrap pb-1 pl-4 text-right font-normal">
                  En tu página · lo mide Tu Parrilla
                </th>
              </tr>
              <tr className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                <th className="py-2 pr-3 text-left font-normal">Versión</th>
                {queCambian.map((clave) => (
                  <th key={clave} className="py-2 pr-3 text-left font-normal normal-case tracking-normal">
                    {clave}
                  </th>
                ))}
                <th className="py-2 text-right font-normal">Views</th>
                <th className="py-2 pl-4 text-right font-normal">Visitas</th>
                <th className="py-2 pl-4 text-right font-normal">Arrastre</th>
              </tr>
            </thead>
            <tbody>
              {versiones.map((v) => (
                <tr
                  key={v.clave}
                  className={cn(
                    'border-t border-velo/[0.06] align-top',
                    v.socialPostId === pieza.abierta.id && 'bg-velo/[0.03]',
                    v.fila?.archived && 'opacity-50',
                  )}
                >
                  <td className="py-2 pr-3">
                    <span className="text-fg">{nombreDestino(v)}</span>
                    {v.trial ? (
                      <span className="ml-1.5 inline-block whitespace-nowrap rounded bg-brasa/15 px-1.5 py-0.5 font-mono text-[0.6rem] uppercase tracking-[0.12em] text-brasa">
                        Trial reel
                      </span>
                    ) : null}
                    <span className="block font-mono text-[0.65rem] text-fg-faint">
                      {estadoDe(v, v.fila)}
                      {v.fecha ? ` · ${fecha.format(v.fecha)}` : ''}
                      {v.socialPostId === pieza.abierta.id && versiones.length > 1 ? ' · la que abriste' : ''}
                    </span>
                    {motivoDestino({ status: v.status ?? '', lastError: v.lastError }) ? (
                      <span className="block text-[0.72rem] text-negative">{v.lastError}</span>
                    ) : null}
                    {/* Con id y sin fila: la red todavía no la entregó. Sin id —un borrador en la
                        bandeja de TikTok— no va a sincronizar nunca, y el estado ya lo dice. */}
                    {v.status === 'published' && !v.fila && v.externalId !== null ? (
                      <span className="block max-w-xs text-[0.72rem] leading-snug text-fg-faint">
                        Sin números todavía: llegan con la sincronización diaria.
                        {v.trial ? ' Un trial reel puede no aparecer hasta que lo compartas.' : ''}
                      </span>
                    ) : null}
                    <span className="mt-0.5 flex gap-3 text-[0.72rem]">
                      {v.fila?.permalink ? (
                        <a
                          href={v.fila.permalink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-0.5 text-fg-muted transition-colors hover:text-fg"
                        >
                          Ver en {networkLabel(v.network)}
                          <ArrowUpRight className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                      {v.scheduledPostId ? (
                        <Link
                          prefetch={false}
                          href={`/admin/schedule/${v.scheduledPostId}?volver=${encodeURIComponent(aqui)}`}
                          className="text-fg-muted transition-colors hover:text-fg"
                        >
                          Editar atributos
                        </Link>
                      ) : null}
                    </span>
                  </td>
                  {queCambian.map((clave) => (
                    <td key={clave} className="py-2 pr-3 font-mono text-[0.75rem] text-fg-muted">
                      {textoDeAtributo(v.atributos?.[clave])}
                    </td>
                  ))}
                  <td className="py-2 text-right font-mono tabular-nums">
                    {num(v.fila?.views)}
                    {v.fila && v.fila.viewsChange !== null && v.fila.viewsChange > 0 && !v.fila.isNew ? (
                      <span className="ml-1 text-[0.68rem] text-fg-faint">+{formatNumber(v.fila.viewsChange)}</span>
                    ) : null}
                  </td>
                  <td className="py-2 pl-4 text-right font-mono tabular-nums">{num(v.fila?.visits)}</td>
                  <td className="py-2 pl-4 text-right font-mono tabular-nums">{pct(v.fila?.pull)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-fg-faint">
          {organica ? (
            <>
              Esta publicación no salió de La Parrilla: no tiene versiones ni atributos. Lo que
              programas desde La Parrilla sí los tiene.
            </>
          ) : pieza.clave ? (
            <>
              Juntas por el atributo <code className="text-fg-muted">pieza</code>: {programados === 1 ? 'un post programado' : `${programados} posts programados`} con
              el mismo valor. Para sumar otra versión, dale ese mismo valor en sus atributos.
            </>
          ) : (
            <>
              ¿Otra versión con otro hook, o el trial reel en la misma cuenta? Son otro post
              programado: dales a los dos el mismo atributo{' '}
              <code className="text-fg-muted">pieza</code> —por ejemplo{' '}
              <code className="text-fg-muted">{'{"pieza": "chimichurri-30s"}'}</code>— en «Editar
              atributos» o por la API, y aparecen juntos acá.
            </>
          )}
        </p>
      </Panel>
    </>
  )
}

/** Cómo va esa versión: el estado del destino, o lo que se sabe de una orgánica. */
function estadoDe(v: VersionDePieza, fila: PostRow | null): string {
  if (fila?.archived) return 'Borrada en la red'
  if (v.scheduledPostId === null) return 'Fuera de La Parrilla'
  return etiquetaDestino({
    network: v.network,
    status: v.status ?? '',
    externalId: v.externalId,
    opciones: v.opciones,
    lastError: v.lastError,
  })
}

/** Un atributo como chip: `clave: valor`, con enlace a compararlo si se puede. */
function Atributo({ clave, valor, href }: { clave: string; valor: string; href?: string }) {
  const contenido = (
    <>
      <span className="text-fg-faint">{clave}:</span> {valor}
    </>
  )
  return (
    <li className="chapa rounded-md px-2 py-0.5 font-mono text-[0.7rem] text-fg-muted">
      {href ? (
        <Link href={href} title={`Comparar por ${clave}`} className="transition-colors hover:text-fg">
          {contenido}
        </Link>
      ) : (
        contenido
      )}
    </li>
  )
}
