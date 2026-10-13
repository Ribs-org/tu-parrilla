import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Empty, Panel } from '@/components/charts/panel'
import { RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { dominioProducto, esDominioDelProducto } from '@/lib/dominios'
import { parseFilters } from '@/lib/filters'
import { networkLabel } from '@/lib/networks'
import { getCuentas, getPostRows } from '@/lib/posts'
import { activeRows, unpastedCount, withPlatformMetrics, withoutPlatformMetricsCount } from '@/lib/posts-kpis'
import { getAllProfiles } from '@/lib/profiles'
import { cuentaElegida, numerosHref, type Params } from '@/lib/tablero'
import { adminId } from '@/lib/usuarios'
import { cn, formatNumber, urlPublicaDe } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'
import { PostTable } from './post-table'

export const dynamic = 'force-dynamic'

const RUTA = '/admin/analytics/publicaciones'

/**
 * Todas las publicaciones, una por fila: lo que fue la pantalla Los Cortes, ahora un clic
 * adentro de Los Números («Ver todas las publicaciones →»). Muestra poco al entrar —views y
 * visitas— y el resto de las columnas, «Solo con métricas» y «Ver borrados» esperan detrás
 * de «⋯ Más» (`?mas=1`). Se filtra por cuenta y no por red: con dos cuentas de Instagram,
 * la red sola no dice de cuál es cada fila.
 */
export default async function PublicacionesPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)
  const mas = params.mas === '1'
  const includeArchived = mas && params.archivados === '1'
  const onlyWithMetrics = mas && params.metricas === '1'
  // El período acota qué se publicó, que es lo que uno espera al decir «esta semana».
  // «Todas las recientes» es la otra lectura: también lo viejo, que puede seguir creciendo.
  const todas = params.anteriores === '1'

  // En serie: ver la nota del pool en `docs/pendientes.md`.
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentaElegida(params, cuentas)
  // La página y los bots son filtros de «En tu página» del tablero: acá no se ven, así que
  // tampoco cuentan. Las visitas de cada publicación son de todas tus páginas y sin bots.
  const filas = await getPostRows(
    { ...filters, profileId: null, includeBots: false },
    includeArchived,
    {
      ...(todas ? {} : { publishedFrom: filters.from, publishedTo: filters.to }),
      ...(cuenta ? { accountId: cuenta.id } : {}),
    },
  )
  const baseEnlace = await enlaceDeLaPaginaPrincipal(ownerId)

  const visibles = onlyWithMetrics ? withPlatformMetrics(filas) : filas

  // Los avisos describen lo que se ve sin «Solo con métricas»: las filas vivas de la cuenta.
  const activas = activeRows(filas).length
  const sinPegar = unpastedCount(filas)
  const sinMetricas = withoutPlatformMetricsCount(filas)
  const avisoSinPegar =
    sinPegar === activas
      ? 'Ninguna etiqueta está pegada todavía. Copia el link de una fila y pégalo en ese post de la red.'
      : sinPegar === 1
        ? '1 publicación aún no tiene su link pegado.'
        : `${formatNumber(sinPegar)} publicaciones aún no tienen su link pegado.`
  const avisoSinMetricas =
    sinMetricas === 1
      ? '1 publicación no tiene métricas de la red en este período (Instagram no las entrega para lo publicado antes de tu cuenta profesional).'
      : `${formatNumber(sinMetricas)} publicaciones no tienen métricas de la red en este período (Instagram no las entrega para lo publicado antes de tu cuenta profesional).`

  const nombres = Object.fromEntries(
    cuentas.map((c) => [c.id, c.handle ? `${networkLabel(c.network)} · ${c.handle}` : networkLabel(c.network)]),
  )

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref('/admin/analytics', params, { mas: null, anteriores: null, metricas: null, archivados: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {nombreDe('/admin/analytics')}
        </Link>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">Tus publicaciones</h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Cada publicación, con lo que hizo en la red y la gente que llevó a tu página. Las views
          las cuenta la red; las visitas, Tu Parrilla, cuando alguien entra por el link de esa
          publicación.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <RangoBar />
        {cuentas.length > 1 ? (
          <SelectorEnUrl
            clave="cuenta"
            etiqueta="Cuenta"
            todas="Todas las cuentas"
            opciones={cuentas.map((c) => ({ valor: c.id, texto: nombres[c.id]! }))}
          />
        ) : null}
        <div role="group" aria-label="Qué publicaciones" className="chapa flex items-center gap-0.5 rounded-xl p-1">
          {[
            { texto: 'Publicadas en el período', activa: !todas, href: numerosHref(RUTA, params, { anteriores: null }) },
            { texto: 'Todas las recientes', activa: todas, href: numerosHref(RUTA, params, { anteriores: '1' }) },
          ].map((opcion) => (
            <Link
              key={opcion.texto}
              href={opcion.href}
              scroll={false}
              aria-current={opcion.activa ? 'true' : undefined}
              className={cn(
                'rounded-lg px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors',
                opcion.activa ? 'bg-white/[0.14] text-fg' : 'text-fg-muted hover:text-fg',
              )}
            >
              {opcion.texto}
            </Link>
          ))}
        </div>
        <Link
          href={numerosHref(RUTA, params, mas ? { mas: null, metricas: null, archivados: null } : { mas: '1' })}
          scroll={false}
          aria-expanded={mas}
          className="ml-auto rounded-xl px-3 py-2 text-xs text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg"
        >
          {mas ? 'Menos' : '⋯ Más'}
        </Link>
      </div>

      {mas ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-[0.75rem]">
          <span className="text-fg-faint">Todas las columnas a la vista.</span>
          <Link
            href={numerosHref(RUTA, params, { metricas: onlyWithMetrics ? null : '1' })}
            scroll={false}
            className="text-fg-muted transition-colors hover:text-fg"
          >
            {onlyWithMetrics ? 'Mostrar todas' : 'Solo con métricas'}
          </Link>
          <Link
            href={numerosHref(RUTA, params, { archivados: includeArchived ? null : '1' })}
            scroll={false}
            className="text-fg-muted transition-colors hover:text-fg"
          >
            {includeArchived ? 'Ocultar borrados' : 'Ver borrados'}
          </Link>
        </div>
      ) : null}

      {sinPegar > 0 || sinMetricas > 0 ? (
        <div className="chapa mt-4 space-y-1 rounded-xl px-4 py-3 text-[0.82rem] leading-relaxed text-fg-muted">
          {sinPegar > 0 ? <p>{avisoSinPegar}</p> : null}
          {sinMetricas > 0 ? <p>{avisoSinMetricas}</p> : null}
        </div>
      ) : null}

      <Panel
        className="mt-4"
        title="Publicaciones"
        hint="Views: el total en la red, con lo ganado en el período al lado. Visitas: quienes entraron a tu página por el link de esa publicación. En YouTube solo van los contadores de la red, sin lo ganado: sus reglas no permiten calcular métricas nuevas con sus datos."
      >
        {/*
          Vacío por el filtro no es lo mismo que un catálogo vacío: el estado vacío de la tabla
          mandaría a conectar una red a alguien que ya la tiene.
        */}
        {visibles.length === 0 && filas.length > 0 ? (
          <Empty>
            {cuenta
              ? `Nada de ${nombres[cuenta.id]} con este filtro.`
              : 'El filtro dejó la lista vacía: ninguna publicación tiene métricas de la red en este período.'}
          </Empty>
        ) : filas.length === 0 && cuentas.some((c) => c.connected) ? (
          <Empty>
            {todas
              ? 'No hay publicaciones sincronizadas todavía.'
              : 'No publicaste nada en este período. Amplía el período, o mira «Todas las recientes».'}
          </Empty>
        ) : (
          <PostTable rows={visibles} columnas={mas ? 'todas' : 'pocas'} baseEnlace={baseEnlace} nombres={nombres} />
        )}
      </Panel>
    </>
  )
}

/**
 * La dirección pública de la página principal del dueño, ya resuelta contra el host: es a
 * la que tiene que llevar el link con `?s=` que se copia de cada fila (ver `urlPublicaDe`).
 */
async function enlaceDeLaPaginaPrincipal(ownerId: string): Promise<string> {
  const cabeceras = await headers()
  const host = cabeceras.get('host') ?? 'localhost:3000'
  const protocolo = cabeceras.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  const perfiles = await getAllProfiles(ownerId)
  const principal = perfiles.find((p) => p.isDefault) ?? perfiles[0]
  if (!principal) return `${protocolo}://${host}/`
  const admin = await adminId()
  return urlPublicaDe(
    principal,
    admin,
    { enElProducto: esDominioDelProducto(host), dominioProducto: dominioProducto() },
    `${protocolo}://${host}`,
  )
}
