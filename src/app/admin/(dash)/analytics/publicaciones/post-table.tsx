'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, useTransition } from 'react'
import { ArrowDown, ArrowUp, ArrowUpRight, Check, Copy } from 'lucide-react'
import { updatePostCampaign } from '@/app/admin/actions'
import { comoSalio, medianaDe, type Marca } from '@/lib/parrilla'
import { useSortedRows } from '@/components/charts/use-sorted-rows'
import { networkLabel } from '@/lib/networks'
import { hasNoPlatformMetrics, type PostRow } from '@/lib/posts-kpis'
import { NombreDe } from '@/components/de-noche-y-de-dia'
import { cn, formatNumber } from '@/lib/utils'
import { copiarAlPortapapeles } from '@/lib/copiar'

type Column = 'views' | 'likes' | 'comments' | 'shares' | 'visits' | 'clicks' | 'ctr' | 'pull'

/**
 * `red`: lo cuenta la red. `nuestra`: lo mide Tu Parrilla en la página del dueño. La tabla
 * lo dice sobre cada grupo de columnas, porque views (en la red) y visitas (en tu página)
 * se confundían —y las políticas de YouTube piden que un dato propio al lado de los suyos
 * se lea claramente como no suyo—.
 */
const COLUMNS: Array<{ key: Column; label: string; grupo: 'red' | 'nuestra' }> = [
  { key: 'views', label: 'Views', grupo: 'red' },
  { key: 'likes', label: 'Likes', grupo: 'red' },
  { key: 'comments', label: 'Coment.', grupo: 'red' },
  { key: 'shares', label: 'Compart.', grupo: 'red' },
  { key: 'visits', label: 'Visitas', grupo: 'nuestra' },
  { key: 'clicks', label: 'Clicks', grupo: 'nuestra' },
  { key: 'ctr', label: 'CTR', grupo: 'nuestra' },
  { key: 'pull', label: 'Arrastre', grupo: 'nuestra' },
]

/** Lo que se ve sin pedir más: lo que creció en la red y la gente que llegó a tu página. */
const POCAS: ReadonlySet<Column> = new Set(['views', 'visits'])

/** `—` and never `0`: no data and no traffic are different answers. */
function num(value: number | null): string {
  return value === null ? '—' : formatNumber(value)
}

function pct(value: number | null, digits = 1): string {
  return value === null ? '—' : `${value.toFixed(digits)}%`
}

const CLASE_CORRIO: Record<Marca, string> = {
  'se-paso': 'corrio-se-paso',
  'salio-bien': 'corrio-bien',
  normal: 'corrio-normal',
  // Sin barra: no hay con qué comparar, y una barra gris diría «le fue mal», que es
  // una afirmación distinta de «no sé».
  'sin-datos': '',
}

// The default cut: enough to read the leaders of the current sort without scrolling
// a whole catalogue. Expanding is a view preference, so it lives in client state and
// resets on reload rather than in the URL.
const PREVIEW_COUNT = 20

/**
 * La tabla de publicaciones. `columnas` 'pocas' muestra views y visitas; 'todas' suma likes,
 * comentarios, compartidos, clicks, CTR y arrastre. `baseEnlace` es la dirección pública de
 * la página principal del dueño: el link copiado tiene que llevar a ella y no al host del
 * panel, cuya raíz en tu-parrilla.cl es la portada y no anota visitas. `nombres` trae «Red ·
 * handle» por cuenta, para distinguir dos cuentas de la misma red. El texto de cada fila abre
 * su pieza; `consulta` es lo que se le acarrea (`?range=…`), para volver con los filtros.
 *
 * Con 'pocas', en el teléfono las dos cifras bajan debajo del título y las columnas se van: la
 * tabla pedía 26 rem de ancho mínimo, y a 390 px la columna de views —la cifra de la
 * pantalla— quedaba escondida a la derecha y «Se pasó» se cortaba en el borde. Ordenar, ahí,
 * es con los dos botones de arriba.
 */
export function PostTable({
  rows,
  columnas = 'pocas',
  baseEnlace,
  nombres = {},
  consulta = '',
}: {
  rows: PostRow[]
  columnas?: 'pocas' | 'todas'
  baseEnlace: string
  nombres?: Record<string, string>
  consulta?: string
}) {
  const visibles = COLUMNS.filter((c) => columnas === 'todas' || POCAS.has(c.key))
  // Las columnas que en el teléfono se van, porque sus cifras bajan debajo del título.
  const compacta = columnas === 'pocas'
  const enAncho = compacta ? 'hidden sm:table-cell' : undefined
  const deLaRed = visibles.filter((c) => c.grupo === 'red').length
  const nuestras = visibles.length - deLaRed
  const { sorted, sortKey, descending, toggle } = useSortedRows(rows, 'views')
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? sorted : sorted.slice(0, PREVIEW_COUNT)
  const hidden = sorted.length - visible.length

  if (rows.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-fg-faint">Todavía no hay posts sincronizados.</p>
        <p className="mx-auto mt-2 max-w-sm text-[0.8rem] leading-relaxed text-fg-faint">
          Conecta una red en{' '}
          <span className="text-fg-muted">
            <NombreDe ruta="/admin/accounts" /> (Ajustes)
          </span>{' '}
          y aprieta <span className="text-fg-muted">Sincronizar ahora</span> ahí mismo.
        </p>
      </div>
    )
  }

  // Scale of the comparison bars: the biggest cumulative view count on screen. Rows
  // with no reading are skipped rather than counted as zero, and the guard keeps a
  // catalogue that is all-null (or genuinely all-zero) from dividing by nothing.
  const maxViews = rows.reduce((best, r) => (r.views !== null && r.views > best ? r.views : best), 0)

  /*
   * La vara contra la que se mide cada post. Son las vistas **ganadas en el período** y
   * no el acumulado: el acumulado premia la antigüedad, así que un post de hace un año
   * ganaría siempre y los nuevos —que son los que hay que evaluar— saldrían fríos.
   *
   * Se calcula sobre `rows` y no sobre lo visible: la vara no puede moverse porque el
   * dueño haya expandido la tabla o cambiado el orden.
   */
  const mediana = medianaDe(
    rows.map((r) => r.viewsChange).filter((v): v is number => v !== null),
  )

  return (
    <div className="-mx-1 overflow-x-auto px-1">
      {compacta ? (
        <div className="mb-2 flex items-center gap-2 sm:hidden" role="group" aria-label="Ordenar por">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">Ordenar</span>
          {visibles.map((column) => (
            <button
              key={column.key}
              type="button"
              aria-pressed={sortKey === column.key}
              onClick={() => toggle(column.key)}
              className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.1em] transition-colors',
                sortKey === column.key ? 'border-acero-600 text-fg' : 'border-acero-700 text-fg-faint hover:text-fg-muted',
              )}
            >
              {column.label}
              {sortKey === column.key ? (
                descending ? <ArrowDown className="h-3 w-3" aria-hidden /> : <ArrowUp className="h-3 w-3" aria-hidden />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
      <table
        className={cn(
          'w-full border-collapse text-[0.85rem]',
          // En el teléfono queda una sola columna, y con `table-fixed` mide lo que la pantalla:
          // en automático crecía hasta el título más largo y se cortaba a la derecha.
          columnas === 'todas' ? 'min-w-[46rem]' : 'table-fixed sm:table-auto sm:min-w-[26rem]',
        )}
      >
        <thead>
          {/* Quién cuenta cada grupo de columnas, dicho sobre ellas y no en una nota al pie. */}
          <tr className={cn(compacta && 'hidden sm:table-row')}>
            <td aria-hidden />
            <th scope="colgroup" colSpan={deLaRed} className="pb-1 text-right font-normal">
              <span className="border-b border-velo/[0.08] pb-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">
                En la red
              </span>
            </th>
            <th scope="colgroup" colSpan={nuestras} className="pb-1 text-right font-normal">
              <span className="border-b border-velo/[0.08] pb-0.5 font-mono text-[0.6rem] uppercase tracking-[0.14em] text-fg-faint">
                En tu página · lo mide Tu Parrilla
              </span>
            </th>
          </tr>
          <tr>
            <th scope="col" className="pb-2 text-left font-normal">
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                Post
              </span>
            </th>
            {visibles.map((column) => (
              <th
                key={column.key}
                scope="col"
                aria-sort={
                  sortKey === column.key ? (descending ? 'descending' : 'ascending') : 'none'
                }
                className={cn('pb-2 text-right font-normal', enAncho)}
              >
                <button
                  type="button"
                  onClick={() => toggle(column.key)}
                  className={cn(
                    'inline-flex items-center gap-1 rounded px-1 py-0.5 font-mono text-[0.65rem] uppercase tracking-[0.14em] transition-colors',
                    sortKey === column.key ? 'text-fg' : 'text-fg-faint hover:text-fg-muted',
                  )}
                >
                  {column.label}
                  {sortKey === column.key ? (
                    descending ? (
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    ) : (
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    )
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row) => (
            <tr
              key={row.id}
              className={cn(
                'border-t border-velo/[0.06]',
                // A row the network reported nothing about steps back the same way a
                // deleted one does: it is still true, just not comparable. The page
                // explains why above the table, so the dimming is not a dead end.
                (row.archived || hasNoPlatformMetrics(row)) && 'opacity-50',
              )}
            >
              <td className="py-2 pr-3">
                <div className="flex items-center gap-2.5">
                  {/* La miniatura con forma de corte: es lo único de esta tabla con
                      superficie, así que es por donde entra la parrilla sin tocar la
                      densidad de las filas. */}
                  {row.thumbnailUrl ? (
                    <span className="corte-mini h-9 w-9 shrink-0">
                      <Image
                        src={row.thumbnailUrl}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 object-cover"
                      />
                    </span>
                  ) : (
                    <span className="corte-mini h-9 w-9 shrink-0 bg-velo/[0.06]" aria-hidden />
                  )}
                  <div className="min-w-0">
                    {/* Sin prefetch: son hasta doscientas filas (ver `docs/pendientes.md`). */}
                    <Link
                      prefetch={false}
                      href={`/admin/analytics/publicaciones/${row.id}${consulta}`}
                      className="block max-w-[18rem] truncate text-fg transition-colors hover:text-fg-muted"
                    >
                      {row.caption || 'Sin descripción'}
                    </Link>
                    <span className="font-mono text-[0.65rem] text-fg-faint">
                      {nombres[row.accountId] ?? networkLabel(row.network)} · {row.publishedLabel}
                      {row.isNew ? ' · nuevo' : ''}
                      {row.permalink ? (
                        <a
                          href={row.permalink}
                          target="_blank"
                          rel="noreferrer"
                          title={`Ver en ${networkLabel(row.network)}`}
                          aria-label={`Ver en ${networkLabel(row.network)}`}
                          className="ml-1 inline-flex align-middle text-fg-faint transition-colors hover:text-fg"
                        >
                          <ArrowUpRight className="h-3 w-3" aria-hidden />
                        </a>
                      ) : null}
                    </span>
                    {/*
                      El sello de los que corrieron el doble de la mediana. Es lo que el
                      dueño viene a buscar cuando abre esta tabla —cuáles se le fueron
                      de las manos— y antes había que deducirlo comparando números a ojo.
                    */}
                    {comoSalio(row.viewsChange, mediana) === 'se-paso' ? (
                      <span
                        className="ml-1.5 whitespace-nowrap font-titulo text-[0.6rem] uppercase tracking-[0.12em] text-brasa"
                        title="El doble o más de las vistas ganadas por la mitad de tus posts del período"
                      >
                        Se pasó
                      </span>
                    ) : null}
                    {compacta ? (
                      // En el teléfono, las dos cifras de las columnas, con quién las cuenta.
                      <span className="mt-0.5 block font-mono text-[0.7rem] text-fg-muted sm:hidden">
                        {num(row.views)} views
                        {row.viewsChange !== null && row.viewsChange > 0 && !row.isNew ? ` (+${formatNumber(row.viewsChange)})` : ''}
                        {' · '}
                        {num(row.visits)} visitas a tu página
                      </span>
                    ) : null}
                    <CampaignCell postId={row.id} campaign={row.campaign} baseEnlace={baseEnlace} />
                  </div>
                </div>
              </td>

              {visibles.map((column) =>
                column.key === 'views' ? (
                  <td key="views" className={cn('relative py-2 text-right font-mono tabular-nums', enAncho)}>
                    {/*
                      La barra ya existía y era siempre del mismo color: decía el tamaño,
                      no si era mucho o poco para este dueño. Ahora se pinta según cómo
                      corrió contra la mediana del período, que es la comparación que
                      ninguna columna hace.
                    */}
                    {row.views !== null && maxViews > 0 ? (
                      <span
                        aria-hidden
                        className={cn(
                          'absolute inset-y-1 left-0 -z-10 rounded',
                          CLASE_CORRIO[comoSalio(row.viewsChange, mediana)],
                        )}
                        style={{ width: `${(row.views / maxViews) * 100}%` }}
                      />
                    ) : null}
                    {num(row.views)}
                    {row.viewsChange !== null && row.viewsChange > 0 && !row.isNew ? (
                      <span className="ml-1 text-[0.68rem] text-fg-faint">
                        +{formatNumber(row.viewsChange)}
                      </span>
                    ) : null}
                  </td>
                ) : (
                  <td
                    key={column.key}
                    className={cn(
                      'py-2 text-right font-mono tabular-nums',
                      column.key !== 'visits' && column.key !== 'pull' && 'text-fg-muted',
                      enAncho,
                    )}
                  >
                    {celda(row, column.key)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {hidden > 0 || expanded ? (
        <div className="border-t border-velo/[0.06] pt-2 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded px-2 py-1 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-fg-faint transition-colors hover:text-fg"
          >
            {expanded
              ? 'Mostrar menos'
              : hidden === 1
                ? 'Ver la publicación restante'
                : `Ver las ${hidden} restantes`}
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** El texto de una celda que no es la de views (esa lleva su barra). */
function celda(row: PostRow, columna: Column): string {
  switch (columna) {
    case 'likes':
      return num(row.likes)
    case 'comments':
      return num(row.comments)
    case 'shares':
      return num(row.shares)
    case 'visits':
      return num(row.visits)
    case 'clicks':
      return num(row.clicks)
    case 'ctr':
      return pct(row.ctr)
    case 'pull':
      return pct(row.pull, 2)
    default:
      return num(row.views)
  }
}

function CampaignCell({ postId, campaign, baseEnlace }: { postId: string; campaign: string; baseEnlace: string }) {
  const [value, setValue] = useState(campaign)
  const [editing, setEditing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  // Escape unmounts the focused <input> synchronously, which fires a native blur as
  // part of that DOM removal. React delivers that blur through the pre-Escape
  // render's stale onBlur closure (still holding the dirty, about-to-be-discarded
  // value), so without this guard the "cancelled" edit gets saved anyway. The ref
  // is shared across renders/closures, so setting it inside cancel() or the real
  // save() is visible to that stale call too, and the same guard collapses Enter's
  // matching stale blur into a no-op instead of a second, redundant save.
  const settledRef = useRef(false)

  function startEditing() {
    settledRef.current = false
    setEditing(true)
  }

  function save() {
    if (settledRef.current) return
    settledRef.current = true
    setEditing(false)
    if (value === campaign) return
    startTransition(async () => {
      const result = await updatePostCampaign(postId, value)
      if (result.error) {
        setError(result.error)
        setValue(campaign)
      } else {
        setError(null)
        // The server normalises what was typed (spaces become hyphens, etc), so
        // display and the copy button must reflect the tag it actually stored.
        if (result.campaign) setValue(result.campaign)
      }
    })
  }

  function cancel() {
    settledRef.current = true
    setValue(campaign)
    setEditing(false)
  }

  function copy() {
    // La página principal del dueño y no `window.location.origin`: el panel vive en
    // tu-parrilla.cl, cuya raíz es la portada del producto y no anota visitas, así que ese
    // link perdía toda la atribución. El visto, solo si se copió de verdad (`copiarAlPortapapeles`).
    void copiarAlPortapapeles(`${baseEnlace}?s=${value}`).then((copiado) => {
      if (!copiado) {
        setError('No se pudo copiar el link.')
        return
      }
      setCopied(true)
      setError(null)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="mt-0.5 flex items-center gap-1.5">
      {editing ? (
        <input
          value={value}
          autoFocus
          onChange={(event) => setValue(event.target.value)}
          onBlur={save}
          onKeyDown={(event) => {
            if (event.key === 'Enter') save()
            if (event.key === 'Escape') cancel()
          }}
          className="w-36 rounded bg-velo/[0.08] px-1 py-0.5 font-mono text-[0.65rem] text-fg outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={startEditing}
          disabled={pending}
          title="Editar la etiqueta"
          className="rounded bg-velo/[0.06] px-1.5 py-0.5 font-mono text-[0.65rem] text-fg-muted transition-colors hover:text-fg"
        >
          ?s={value}
        </button>
      )}

      <button
        type="button"
        onClick={copy}
        disabled={pending}
        title="Copiar el link con la etiqueta"
        className="text-fg-faint transition-colors hover:text-fg"
      >
        {copied ? <Check className="h-3 w-3" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      </button>

      {error ? <span className="text-[0.65rem] text-negative">{error}</span> : null}
    </div>
  )
}
