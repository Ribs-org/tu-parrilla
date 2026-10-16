import { NextResponse } from 'next/server'
import { delta } from '@/components/charts/stat-tile'
import { buildAccountCards } from '@/lib/account-stats'
import { getCampaigns, getKpis, localDay, previousPeriod } from '@/lib/analytics'
import { parseFilters } from '@/lib/filters'
import { lecturasDeCuentas } from '@/lib/lecturas-cuentas'
import { buildMetricPost } from '@/lib/metrics-api'
import { RANGO_DEL_PANEL, leerRango } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { attributesFor } from '@/lib/post-attributes'
import { getCampaignPosts, getCuentas, getPostRows, postKpisFrom } from '@/lib/posts'
import { topPostsByGain, type CuentaRow } from '@/lib/posts-kpis'
import { seguidoresGanados } from '@/lib/tablero'

export const dynamic = 'force-dynamic'

// Lo mismo que lee el tablero del panel para «En las redes».
const PUBLICACIONES_LEIDAS = 500

/** La cuenta como la nombra la app: su id, su red y su nombre en la red. */
function cuentaMovil(c: Pick<CuentaRow, 'id' | 'network' | 'handle'>) {
  return { id: c.id, red: c.network, nombre: c.handle }
}

/**
 * Los Números del teléfono: las dos mitades del tablero del panel, con sus dos cifras y su
 * lista corta cada una, y las mismas reglas —son las mismas funciones—. El período es uno de
 * los cinco del panel (`?rango=`, por defecto 30 días); la cuenta (`?cuenta=<id>`) filtra
 * «En las redes», como en el panel. Lo que el panel guarda detrás de «⋯ Más» no viaja acá:
 * las tarjetas de cada cuenta siguen en `/api/mobile/accounts`.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const ownerId = usuario.id
  const zone = usuario.zona

  const url = new URL(request.url)
  const rango = leerRango(url.searchParams.get('rango'), '30d')
  // La página y los bots son filtros que el teléfono no ofrece: todas las páginas, sin bots.
  const filters = { ...parseFilters({ range: RANGO_DEL_PANEL[rango] }, ownerId, zone), profileId: null, includeBots: false }

  // En serie: más consultas a la vez que conexiones en el pool se colgaron una vez contra el
  // pooler de Supabase (`docs/pendientes.md`).
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentas.find((c) => c.id === url.searchParams.get('cuenta')) ?? null

  const filas = await getPostRows(filters, false, {
    limit: PUBLICACIONES_LEIDAS,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const lecturas = (await lecturasDeCuentas(ownerId)).filter((l) => cuenta === null || l.accountId === cuenta.id)
  const tarjetas = buildAccountCards(lecturas, localDay(filters.from, zone), localDay(filters.to, zone), 'cuenta')
  const top = topPostsByGain(filas, 5)
  const atributos = await attributesFor(ownerId, top)
  const nombres = new Map(cuentas.map((c) => [c.id, cuentaMovil(c)]))

  const kpis = await getKpis(filters)
  const anterior = await getKpis(previousPeriod(filters))
  const campanas = await getCampaigns(filters, 6)
  const conEtiqueta = campanas.filter((c) => c.campaign !== '(sin etiqueta)').slice(0, 5)
  const deEtiqueta = await getCampaignPosts(ownerId, conEtiqueta.map((c) => c.campaign))

  return NextResponse.json({
    rango,
    cuenta: cuenta?.id ?? null,
    cuentas: cuentas.map((c) => cuentaMovil(c)),
    redes: {
      // «—» y no «0» cuando ninguna publicación tiene lo ganado: no se sabe no es cero.
      viewsGanadas: filas.some((f) => f.viewsChange !== null) ? postKpisFrom(filas).views : null,
      seguidoresGanados: seguidoresGanados(tarjetas),
      loQueMasCrecio: top.map((fila) => ({
        ...buildMetricPost(fila, atributos.get(`${fila.network}:${fila.externalId}`) ?? null, zone),
        cuenta: nombres.get(fila.accountId) ?? null,
        miniatura: fila.thumbnailUrl,
      })),
    },
    pagina: {
      visitas: kpis.visits,
      cambioVisitas: delta(kpis.visits, anterior.visits),
      clicks: kpis.clicks,
      cambioClicks: delta(kpis.clicks, anterior.clicks),
      queTeTrajoGente: conEtiqueta.map((c) => {
        const post = deEtiqueta.get(c.campaign)
        return {
          etiqueta: c.campaign,
          visitas: c.visits,
          texto: post?.caption ?? null,
          red: post?.network ?? null,
          cuenta: post ? (nombres.get(post.accountId) ?? null) : null,
        }
      }),
    },
  })
}
