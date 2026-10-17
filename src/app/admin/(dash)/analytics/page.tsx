import { Suspense } from 'react'
import Link from 'next/link'
import { AccountCards, AccountSeriesChart } from './accounts'
import { BajadaDeLosNumeros } from './cabeza'
import { SeccionCargando } from './cargando'
import { BarList } from '@/components/charts/bar-list'
import { CampaignTable } from '@/components/charts/campaign-table'
import { Donut } from '@/components/charts/donut'
import { Funnel } from '@/components/charts/funnel'
import { Heatmap } from '@/components/charts/heatmap'
import { Empty, Panel, PanelSkeleton } from '@/components/charts/panel'
import { StatTile, delta } from '@/components/charts/stat-tile'
import { seriesColor } from '@/components/charts/theme'
import { TrafficChart } from '@/components/charts/traffic-chart'
import { Cargando } from '@/components/esqueleto'
import { BotonBots, RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { Encabezado } from '@/components/ui'
import { buildAccountCards, buildAccountSeries } from '@/lib/account-stats'
import { requireUser } from '@/lib/auth'
import {
  type Filters,
  type Kpis,
  getBrowsers,
  getCampaigns,
  getCities,
  getCountries,
  getDevices,
  getFunnel,
  getHeatmap,
  getKpis,
  getLanguages,
  getNetworks,
  getOperatingSystems,
  getRecentVisits,
  getTimeSeries,
  getTopLinks,
  localDay,
  previousPeriod,
} from '@/lib/analytics'
import { parseFilters } from '@/lib/filters'
import { networkLabel } from '@/lib/networks'
import { getCampaignPosts, getCuentas, getPostRows, getPostSeries, postKpisFrom } from '@/lib/posts'
import { topPostsByGain, type CuentaRow } from '@/lib/posts-kpis'
import { lecturasDeCuentas } from '@/lib/lecturas-cuentas'
import { getAllProfiles } from '@/lib/profiles'
import {
  alternarSeccion,
  cuentaElegida,
  numerosHref,
  seccionesAbiertas,
  seguidoresGanados,
  type Params,
  type Seccion,
} from '@/lib/tablero'
import { countryName, flagEmoji, formatNumber, formatPercent } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const RUTA = '/admin/analytics'

/**
 * Cuántas publicaciones se leen para sumar lo ganado en el período. Sin ventana de
 * publicación —un reel de agosto que crece en octubre cuenta en octubre—, así que el tope
 * va por las más recientes; lo viejo que ya no crece no mueve la suma.
 */
const PUBLICACIONES_LEIDAS = 500

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

function timeAgo(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'recién'
  if (seconds < 3600) return RELATIVE.format(-Math.round(seconds / 60), 'minute')
  if (seconds < 86400) return RELATIVE.format(-Math.round(seconds / 3600), 'hour')
  return RELATIVE.format(-Math.round(seconds / 86400), 'day')
}

const DEVICE_LABELS: Record<string, string> = {
  mobile: 'Celular',
  desktop: 'Computador',
  tablet: 'Tablet',
  wearable: 'Wearable',
  console: 'Consola',
  smarttv: 'Smart TV',
  Desconocido: 'Desconocido',
}

/** Los filtros sin los de «En tu página»: para lo que se cuenta en las redes. */
function sinFiltrosDePagina(filters: Filters): Filters {
  return { ...filters, profileId: null, includeBots: false }
}

/** «Instagram · @handle», o solo la red si la cuenta no tiene handle. */
function nombreDeCuenta(cuenta: Pick<CuentaRow, 'network' | 'handle'>): string {
  return cuenta.handle ? `${networkLabel(cuenta.network)} · ${cuenta.handle}` : networkLabel(cuenta.network)
}

/**
 * Los Números: un solo tablero con dos mitades que miden cosas distintas y lo dicen. «En las
 * redes» es lo que hicieron tus publicaciones donde se publicaron, y lo cuentan las redes;
 * «En tu página» es quién entró a tu página de links y qué apretó, y lo cuenta Tu Parrilla.
 * Cada mitad muestra dos números y una lista; el resto espera detrás de su «⋯ Más», que la
 * URL abre (`?mas=redes`, `?mas=pagina`) para que no se consulte lo que no se va a ver.
 *
 * Reemplaza a dos pantallas que compartían barra de filtros y no se explicaban entre sí (ver
 * `docs/superpowers/specs/2026-10-13-numeros-tablero-design.md`).
 */
export default async function NumerosPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)
  const abiertas = seccionesAbiertas(params)
  // En serie: más consultas a la vez que conexiones en el pool se colgaron una vez contra
  // el pooler de Supabase (`docs/pendientes.md`).
  const cuentas = await getCuentas(ownerId)
  const profiles = await getAllProfiles(ownerId)

  return (
    <>
      <header className="mb-4">
        <Encabezado ruta="/admin/analytics" />
        <BajadaDeLosNumeros />
      </header>

      <RangoBar />

      <div className="mt-6 space-y-10">
        <Suspense fallback={<SeccionCargando />}>
          <EnLasRedes filters={filters} params={params} cuentas={cuentas} abierta={abiertas.has('redes')} />
        </Suspense>
        <Suspense fallback={<SeccionCargando orden={4} />}>
          <EnTuPagina
            filters={filters}
            params={params}
            profiles={profiles}
            cuentas={cuentas}
            abierta={abiertas.has('pagina')}
          />
        </Suspense>
      </div>
    </>
  )
}

/** El título de una mitad, su bajada, su filtro propio y el «⋯ Más» que la abre. */
function CabezaDeSeccion({
  seccion,
  titulo,
  bajada,
  params,
  abierta,
  filtro,
}: {
  seccion: Seccion
  titulo: string
  bajada: string
  params: Params
  abierta: boolean
  filtro?: React.ReactNode
}) {
  return (
    <div className="mb-3 flex flex-wrap items-end gap-3">
      {/* `basis-full` en el teléfono: con `flex-1` sola, el selector de cuentas y «⋯ Más»
          cabían al lado y el título se apretaba a una palabra por renglón. */}
      <div className="min-w-0 grow basis-full sm:basis-0">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.04em]">{titulo}</h2>
        <p className="text-[0.8rem] text-fg-muted">{bajada}</p>
      </div>
      {filtro}
      <Link
        href={numerosHref(RUTA, params, { mas: alternarSeccion(params, seccion) })}
        scroll={false}
        aria-expanded={abierta}
        className="rounded-xl px-3 py-2 text-xs text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg"
      >
        {abierta ? 'Menos' : '⋯ Más'}
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------- en las redes -- */

async function EnLasRedes({
  filters,
  params,
  cuentas,
  abierta,
}: {
  filters: Filters
  params: Params
  cuentas: CuentaRow[]
  abierta: boolean
}) {
  const cuenta = cuentaElegida(params, cuentas)
  // La página y los bots son filtros de «En tu página»: las visitas de cada publicación se
  // cuentan en todas tus páginas y sin bots, digan lo que digan esos dos filtros.
  const deLasRedes = sinFiltrosDePagina(filters)
  const filas = await getPostRows(deLasRedes, false, {
    limit: PUBLICACIONES_LEIDAS,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const lecturas = (await lecturasDeCuentas(filters.ownerId)).filter((l) => cuenta === null || l.accountId === cuenta.id)
  const desde = localDay(filters.from, filters.zone)
  const hasta = localDay(filters.to, filters.zone)
  const tarjetas = buildAccountCards(lecturas, desde, hasta, 'cuenta')
  const kpis = postKpisFrom(filas)
  const ganados = seguidoresGanados(tarjetas)
  const top = topPostsByGain(filas, 5)
  const handles = new Map(cuentas.map((c) => [c.id, c]))

  return (
    <section aria-label="En las redes">
      <CabezaDeSeccion
        seccion="redes"
        titulo="En las redes"
        bajada="Lo que hicieron tus publicaciones donde las publicaste. Lo cuentan las redes."
        params={params}
        abierta={abierta}
        filtro={
          cuentas.length > 1 ? (
            <SelectorEnUrl
              clave="cuenta"
              etiqueta="Cuenta"
              todas="Todas las cuentas"
              opciones={cuentas.map((c) => ({ valor: c.id, texto: nombreDeCuenta(c) }))}
            />
          ) : null
        }
      />
      <div className="grid grid-cols-2 gap-3">
        {/* «—» y no «0» cuando ninguna publicación tiene lo ganado: no se sabe no es cero. */}
        <StatTile
          label="Views ganadas"
          value={filas.some((f) => f.viewsChange !== null) ? formatNumber(kpis.views) : '—'}
          hint="En el período · sin YouTube"
        />
        <StatTile
          label="Seguidores ganados"
          value={ganados === null ? '—' : `${ganados > 0 ? '+' : ''}${formatNumber(ganados)}`}
          hint="En el período · sin YouTube"
        />
      </div>

      <Panel
        className="mt-3"
        title="Lo que más creció"
        hint="Las publicaciones que más views ganaron en el período, de cualquier fecha."
        action={
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:gap-4">
            <Link
              href={numerosHref(`${RUTA}/mejores`, params, { mas: null })}
              className="text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
            >
              Tu mejor 10 % →
            </Link>
            <Link
              href={numerosHref(`${RUTA}/comparar`, params, { mas: null })}
              className="text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
            >
              Comparar por atributo →
            </Link>
            <Link
              href={numerosHref(`${RUTA}/publicaciones`, params, { mas: null })}
              className="text-[0.75rem] text-fg-muted transition-colors hover:text-fg"
            >
              Ver todas las publicaciones →
            </Link>
          </div>
        }
      >
        <BarList
          items={top.map((post) => {
            const deQuien = handles.get(post.accountId)
            return {
              key: post.id,
              // La etiqueta cuando no hay texto: es lo que escribió el dueño, y dice más que
              // un «sin texto». `||` y no `??`: Instagram guarda el texto vacío como cadena.
              label: post.caption || post.campaign,
              value: post.viewsChange ?? 0,
              note: deQuien ? nombreDeCuenta(deQuien) : networkLabel(post.network),
              // A su pieza, donde están sus versiones y el enlace a la red.
              href: numerosHref(`${RUTA}/publicaciones/${post.id}`, params, { de: 'numeros' }),
            }
          })}
          color={seriesColor(0)}
          emptyLabel="Ninguna publicación ganó views en este período. Las métricas llegan con la sincronización diaria, así que lo publicado hoy aparece mañana."
        />
      </Panel>

      {abierta ? (
        <RedesEnDetalle
          filters={deLasRedes}
          filas={filas}
          tarjetas={tarjetas}
          serieCuentas={buildAccountSeries(lecturas, desde, hasta)}
          cuentas={cuentas}
          cuenta={cuenta}
        />
      ) : null}
    </section>
  )
}

/** Las lecturas diarias de cada cuenta del dueño, con su cuenta: el panel agrupa por ella. */
async function RedesEnDetalle({
  filters,
  filas,
  tarjetas,
  serieCuentas,
  cuentas,
  cuenta,
}: {
  filters: Filters
  filas: Awaited<ReturnType<typeof getPostRows>>
  tarjetas: ReturnType<typeof buildAccountCards>
  serieCuentas: ReturnType<typeof buildAccountSeries>
  cuentas: CuentaRow[]
  cuenta: CuentaRow | null
}) {
  const kpis = postKpisFrom(filas)
  const serie = await getPostSeries(filters)

  return (
    <div className="mt-3 grid grid-cols-1 gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Interacciones"
          value={formatNumber(kpis.engagement)}
          hint="Likes, comentarios y compartidos ganados · sin YouTube"
        />
        <StatTile label="Visitas desde posts" value={formatNumber(kpis.visits)} hint="Llegaron a tu página por su link" />
        <StatTile
          label="Arrastre"
          value={kpis.pull === null ? '—' : formatPercent(kpis.pull, 2)}
          hint="De quienes vieron, cuántos llegaron a tu página · sin YouTube"
        />
      </div>

      <Panel
        title="Tus cuentas"
        hint="Seguidores por cuenta, con lo ganado en el período; en YouTube, solo el total, porque sus reglas no permiten calcular lo ganado. Visitas al perfil y alcance son del último día leído — Instagram es la única que los entrega hoy."
      >
        <AccountCards
          cards={tarjetas}
          nombres={Object.fromEntries(cuentas.map((c) => [c.id, nombreDeCuenta(c)]))}
        />
        <div className="mt-4">
          <AccountSeriesChart series={serieCuentas} />
        </div>
      </Panel>

      <Panel
        title="Views ganadas y visitas, día a día"
        hint={`Cuánto creció lo que se vio en las redes contra cuánta gente llegó a tu página.${
          cuenta ? ' Esta serie es de todas tus cuentas, no solo de la elegida.' : ''
        } Las views no incluyen YouTube; las visitas, sí.`}
      >
        {/* Separadas: views en miles contra visitas en decenas, en un mismo eje, dejaban las
            visitas planas en cero. */}
        <TrafficChart
          data={serie}
          separadas
          series={[
            { key: 'views', name: 'Views ganadas' },
            { key: 'visits', name: 'Visitas' },
          ]}
        />
      </Panel>
    </div>
  )
}

/* ------------------------------------------------------------- en tu página -- */

async function EnTuPagina({
  filters,
  params,
  profiles,
  cuentas,
  abierta,
}: {
  filters: Filters
  params: Params
  profiles: Awaited<ReturnType<typeof getAllProfiles>>
  cuentas: CuentaRow[]
  abierta: boolean
}) {
  const kpis = await getKpis(filters)
  const anterior = await getKpis(previousPeriod(filters))
  const campanas = await getCampaigns(filters, 6)
  const conEtiqueta = campanas.filter((c) => c.campaign !== '(sin etiqueta)').slice(0, 5)
  const posts = await getCampaignPosts(filters.ownerId, conEtiqueta.map((c) => c.campaign))
  const handles = new Map(cuentas.map((c) => [c.id, c]))

  return (
    <section aria-label="En tu página">
      <CabezaDeSeccion
        seccion="pagina"
        titulo="En tu página"
        bajada="Quién entró a tu página de links —tu Vitrina— y qué apretó. Lo cuenta Tu Parrilla, sin cookies ni terceros."
        params={params}
        abierta={abierta}
        filtro={
          <>
            {profiles.length > 1 ? (
              <SelectorEnUrl
                clave="profile"
                etiqueta="Página"
                todas="Todas tus páginas"
                opciones={profiles.map((p) => ({ valor: p.id, texto: `${p.displayName} · /${p.slug}` }))}
              />
            ) : null}
            {/* Prendido, se ve siempre: un filtro activo que no se ve es un filtro que engaña. */}
            {filters.includeBots ? <BotonBots /> : null}
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Visitas" value={formatNumber(kpis.visits)} delta={delta(kpis.visits, anterior.visits)} />
        <StatTile
          label="Clicks en tus links"
          value={formatNumber(kpis.clicks)}
          delta={delta(kpis.clicks, anterior.clicks)}
        />
      </div>

      <Panel
        className="mt-3"
        title="Qué publicación te trajo gente"
        hint="Visitas que llegaron por el link de una publicación (su etiqueta ?s=)."
      >
        <BarList
          items={conEtiqueta.map((c) => {
            const post = posts.get(c.campaign)
            const deQuien = post ? handles.get(post.accountId) : undefined
            return {
              key: c.campaign,
              label: post?.caption || `?s=${c.campaign}`,
              value: c.visits,
              note: deQuien ? nombreDeCuenta(deQuien) : post ? networkLabel(post.network) : undefined,
              // Una etiqueta de mensaje privado o escrita a mano no es de ninguna publicación.
              href: post ? numerosHref(`${RUTA}/publicaciones/${post.id}`, params, { de: 'numeros' }) : undefined,
            }
          })}
          color={seriesColor(1)}
          emptyLabel="Ninguna visita llegó todavía por el link de una publicación."
        />
      </Panel>

      {abierta ? (
        <PaginaEnDetalle filters={filters} params={params} kpis={kpis} anterior={anterior} cuentas={cuentas} />
      ) : null}
    </section>
  )
}

async function PaginaEnDetalle({
  filters,
  params,
  kpis,
  anterior,
  cuentas,
}: {
  filters: Filters
  params: Params
  kpis: Kpis
  anterior: Kpis
  cuentas: CuentaRow[]
}) {
  const serie = await getTimeSeries(filters)
  const campanas = await getCampaigns(filters)
  const posts = await getCampaignPosts(filters.ownerId, campanas.map((c) => c.campaign))
  const redes = await getNetworks(filters)
  const links = await getTopLinks(filters, kpis.visits)

  return (
    <div className="mt-3 grid grid-cols-1 gap-3">
      {filters.includeBots ? null : (
        <div className="flex flex-wrap items-center gap-2">
          <BotonBots />
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Únicos" value={formatNumber(kpis.uniques)} delta={delta(kpis.uniques, anterior.uniques)} />
        <StatTile label="CTR" value={formatPercent(kpis.ctr)} delta={delta(kpis.ctr, anterior.ctr)} />
      </div>

      <Panel title="Visitas y clicks en el tiempo" hint="Comparables en la misma escala">
        <TrafficChart data={serie} />
      </Panel>

      <Panel
        title="Todas las etiquetas"
        hint="Cada etiqueta ?s= es un link etiquetado: el de una publicación, el de un mensaje privado (dm-…) o uno escrito a mano. Ordena por CTR para ver cuál convierte."
      >
        <CampaignTable
          rows={campanas}
          posts={Object.fromEntries(posts)}
          cuentas={Object.fromEntries(cuentas.map((c) => [c.id, nombreDeCuenta(c)]))}
          consulta={numerosHref('', params, { de: 'numeros' })}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Links más clickeados" hint="CTR calculado sobre las visitas del período">
          <BarList
            items={links.map((link) => ({
              key: link.linkId ?? link.label,
              label: link.label,
              value: link.clicks,
              note: formatPercent(link.ctr),
              href: link.url || undefined,
            }))}
            color={seriesColor(1)}
            emptyLabel="Nadie ha hecho click todavía."
          />
        </Panel>

        <Panel title="De dónde vienen" hint="Red de origen inferida del referrer y de utm_source">
          <Donut slices={redes.map((n) => ({ key: n.key, label: networkLabel(n.key), value: n.visits }))} />
        </Panel>
      </div>

      <Suspense
        fallback={
          <Cargando className="grid grid-cols-1 gap-3">
            <PanelSkeleton />
            <PanelSkeleton orden={2} />
          </Cargando>
        }
      >
        <Audiencia filters={filters} kpis={kpis} />
      </Suspense>
    </div>
  )
}

/** Quién es y cuándo llega: geografía, equipo, hora, embudo, idioma y las últimas visitas. */
async function Audiencia({ filters, kpis }: { filters: Filters; kpis: Kpis }) {
  const [countries, cities, devices, systems, browsers, languages, heatmap, funnel, recent] = [
    await getCountries(filters),
    await getCities(filters),
    await getDevices(filters),
    await getOperatingSystems(filters),
    await getBrowsers(filters),
    await getLanguages(filters),
    await getHeatmap(filters),
    await getFunnel(filters, kpis),
    await getRecentVisits(filters),
  ]

  return (
    <>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Países">
          <BarList
            items={countries.map((c) => ({
              key: c.key,
              label: `${flagEmoji(c.key)}  ${countryName(c.key)}`,
              value: c.visits,
            }))}
          />
        </Panel>

        <Panel title="Ciudades">
          <BarList items={cities.map((c) => ({ key: c.key, label: c.key, value: c.visits }))} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Panel title="Dispositivo">
          <BarList
            items={devices.map((d) => ({
              key: d.key,
              label: DEVICE_LABELS[d.key] ?? d.key,
              value: d.visits,
            }))}
          />
        </Panel>
        <Panel title="Sistema">
          <BarList items={systems.map((s) => ({ key: s.key, label: s.key, value: s.visits }))} />
        </Panel>
        <Panel title="Navegador">
          <BarList items={browsers.map((b) => ({ key: b.key, label: b.key, value: b.visits }))} />
        </Panel>
      </div>

      <Panel title="Cuándo te visitan" hint={`Hora local de ${filters.zone}`}>
        <Heatmap cells={heatmap} />
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="Embudo" hint="De llegar a la página a hacer click">
          <Funnel data={funnel} />
        </Panel>

        <Panel title="Idioma del navegador">
          <BarList items={languages.map((l) => ({ key: l.key, label: l.key, value: l.visits }))} />
        </Panel>
      </div>

      <Panel title="Últimas visitas" hint="Las 40 más recientes del período">
        {recent.length === 0 ? (
          <Empty>Nada todavía.</Empty>
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {recent.map((visit) => (
              <li key={visit.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-[0.82rem]">
                <span aria-hidden>{flagEmoji(visit.country)}</span>
                <span className="text-fg">
                  {visit.city ?? countryName(visit.country)}
                  {visit.city && visit.country ? (
                    <span className="text-fg-faint">, {countryName(visit.country)}</span>
                  ) : null}
                </span>
                <span className="text-fg-muted">
                  {DEVICE_LABELS[visit.deviceType ?? ''] ?? visit.deviceType ?? '—'}
                  {visit.os ? ` · ${visit.os}` : ''}
                  {visit.browser ? ` · ${visit.browser}` : ''}
                </span>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.68rem] text-fg-muted">
                  {networkLabel(visit.referrerNetwork)}
                </span>
                {visit.campaign ? (
                  <span
                    className="rounded-md px-1.5 py-0.5 font-mono text-[0.68rem]"
                    style={{ background: `${seriesColor(0)}25`, color: seriesColor(0) }}
                  >
                    ?s={visit.campaign}
                  </span>
                ) : null}
                {visit.isBot ? (
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.68rem] text-fg-faint">
                    bot
                  </span>
                ) : null}
                <span className="ml-auto font-mono text-[0.7rem] text-fg-faint">{timeAgo(visit.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}
