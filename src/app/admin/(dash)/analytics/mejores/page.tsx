import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Empty, Panel } from '@/components/charts/panel'
import { StatTile } from '@/components/charts/stat-tile'
import { RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import {
  METRICAS,
  METRICA_POR_DEFECTO,
  MIN_MEJORES_PARA_COMPARAR,
  ORDEN_METRICAS,
  PERCENTILES,
  PERCENTIL_POR_DEFECTO,
  POCAS_PARA_CONCLUIR,
  esMetrica,
  leerPercentil,
  mejores,
  type Medianas,
} from '@/lib/mejores'
import { networkLabel } from '@/lib/networks'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getCuentas, getPostRows, type CuentaRow } from '@/lib/posts'
import { cuentaElegida, numerosHref, type Params } from '@/lib/tablero'
import { formatNumber } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'

export const dynamic = 'force-dynamic'

function nombreDeCuenta(cuenta: Pick<CuentaRow, 'network' | 'handle'>): string {
  return cuenta.handle ? `${networkLabel(cuenta.network)} · ${cuenta.handle}` : networkLabel(cuenta.network)
}

function conteo(valor: number | null): string {
  return valor === null ? '—' : formatNumber(Math.round(valor))
}

function porcentaje(valor: number | null): string {
  return valor === null ? '—' : `${valor.toFixed(2)}%`
}

function veces(valor: number): string {
  return `×${valor.toFixed(1).replace('.', ',')}`
}

/**
 * Tu mejor X %: de lo publicado en el período, las publicaciones que más rindieron en una
 * métrica, cuánto había que sacar para entrar, cuánto más rinden que el resto y qué tienen
 * en común. Cuenta lo publicado en el período, como Comparar por atributo y la API: medir
 * por lo ganado este mes un reel de hace seis meses contra el de ayer no dice qué funciona.
 */
export default async function MejoresPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)

  // En serie: ver la nota del pool en `docs/pendientes.md`.
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentaElegida(params, cuentas)
  const metrica = esMetrica(params.metrica) ? params.metrica : METRICA_POR_DEFECTO
  const pedido = leerPercentil(typeof params.percentil === 'string' ? params.percentil : null)
  const percentil = pedido !== null && PERCENTILES.includes(pedido) ? pedido : PERCENTIL_POR_DEFECTO
  const def = METRICAS[metrica]

  const filas = await getPostRows({ ...filters, profileId: null, includeBots: false }, false, {
    publishedFrom: filters.from,
    publishedTo: filters.to,
    limit: MAX_PUBLICACIONES_LEIDAS,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const atributosDe = await attributesFor(ownerId, filas)
  const r = mejores(
    filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null })),
    metrica,
    percentil,
    zona,
  )

  const formato = def.porcentaje ? porcentaje : conteo
  const deQuien = new Map(cuentas.map((c) => [c.id, c]))
  const nombreMetrica = def.nombre.toLowerCase()
  const titulo = `Tu mejor ${percentil} %`

  const medianas: Array<{ nombre: string; campo: keyof Medianas; formato: (v: number | null) => string }> = [
    { nombre: 'Views ganadas', campo: 'viewsGanadas', formato: conteo },
    { nombre: 'Visitas a tu página', campo: 'visitas', formato: conteo },
    { nombre: 'Interacciones', campo: 'interacciones', formato: conteo },
    { nombre: 'Arrastre', campo: 'arrastre', formato: porcentaje },
  ]

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref('/admin/analytics', params, { metrica: null, percentil: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {nombreDe('/admin/analytics')}
        </Link>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">{titulo}</h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Lo que publicaste en el período que más rindió, cuánto había que sacar para entrar y qué
          tienen en común esas publicaciones frente al resto.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <RangoBar periodo={filters.periodo} />
        {cuentas.length > 1 ? (
          <SelectorEnUrl
            clave="cuenta"
            etiqueta="Cuenta"
            todas="Todas las cuentas"
            opciones={cuentas.map((c) => ({ valor: c.id, texto: nombreDeCuenta(c) }))}
          />
        ) : null}
        <SelectorEnUrl
          clave="metrica"
          etiqueta="Métrica"
          porDefecto={METRICA_POR_DEFECTO}
          opciones={ORDEN_METRICAS.map((m) => ({ valor: m, texto: `Por ${METRICAS[m].nombre.toLowerCase()}` }))}
        />
        <SelectorEnUrl
          clave="percentil"
          etiqueta="Porcentaje"
          porDefecto={String(PERCENTIL_POR_DEFECTO)}
          opciones={PERCENTILES.map((p) => ({ valor: String(p), texto: `El mejor ${p} %` }))}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Entran"
          value={r.compiten === 0 ? '—' : `${formatNumber(r.mejores.length)} de ${formatNumber(r.compiten)}`}
          hint={`Publicaciones con ${nombreMetrica}${def.sinYouTube ? ' · sin YouTube' : ''}`}
        />
        <StatTile label="El corte" value={formato(r.corte)} hint={`${def.nombre} para entrar`} />
        <StatTile
          label="Rinden"
          value={r.rinden === null ? '—' : veces(r.rinden)}
          hint="La mediana de arriba contra la del resto"
        />
      </div>

      {r.compiten > 0 && r.compiten < POCAS_PARA_CONCLUIR ? (
        <p className="chapa mt-4 rounded-xl px-4 py-3 text-[0.82rem] text-fg-muted">
          Compiten solo {formatNumber(r.compiten)} {r.compiten === 1 ? 'publicación' : 'publicaciones'}: con
          tan pocas, el mejor {percentil} % sirve para mirarlas, no para sacar conclusiones. Amplía el
          período o sube el porcentaje.
        </p>
      ) : null}

      <Panel
        className="mt-4"
        title="Las publicaciones"
        hint={`De la que más ${nombreMetrica} sumó a la que menos. Cada una abre su pieza.`}
      >
        {filas.length === 0 ? (
          <Empty>No publicaste nada en este período. Amplía el período.</Empty>
        ) : r.compiten === 0 ? (
          <Empty>
            Ninguna publicación del período tiene {nombreMetrica}.
            {def.sinYouTube ? ' YouTube no entra en esta métrica.' : ' Las visitas y los clicks se cuentan cuando alguien entra por el link con la etiqueta de la publicación.'}
          </Empty>
        ) : r.mejores.length === 0 ? (
          <Empty>Ninguna publicación del período sumó {nombreMetrica}.</Empty>
        ) : (
          <ol className="space-y-2">
            {r.mejores.map((m) => {
              const cuentaDe = deQuien.get(m.fila.accountId)
              return (
                <li key={m.fila.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                  <span className="w-7 shrink-0 text-right font-mono text-[0.78rem] tabular-nums text-fg-faint">
                    {m.puesto}
                  </span>
                  {m.fila.thumbnailUrl ? (
                    <span className="corte-mini h-10 w-10 shrink-0">
                      <Image src={m.fila.thumbnailUrl} alt="" width={40} height={40} unoptimized className="h-10 w-10 object-cover" />
                    </span>
                  ) : (
                    <span className="corte-mini h-10 w-10 shrink-0 bg-white/[0.06]" aria-hidden />
                  )}
                  <div className="min-w-0 flex-1">
                    {/* Sin prefetch, como en Tus publicaciones (ver `docs/pendientes.md`). */}
                    <Link
                      prefetch={false}
                      href={numerosHref(`/admin/analytics/publicaciones/${m.fila.id}`, params, { de: 'mejores' })}
                      className="line-clamp-1 text-[0.88rem] text-fg transition-colors hover:text-brasa"
                    >
                      {m.fila.caption || `?s=${m.fila.campaign}`}
                    </Link>
                    <p className="truncate text-[0.72rem] text-fg-faint">
                      {cuentaDe ? nombreDeCuenta(cuentaDe) : networkLabel(m.fila.network)} · {m.fila.publishedLabel}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[0.9rem] font-semibold tabular-nums text-fg">
                    {formato(m.valor)}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </Panel>

      <Panel
        className="mt-4"
        title="Qué tienen en común"
        hint="Lo que se repite más entre las de arriba que entre todas las que compiten: los atributos, la red, el formato, el día y la hora de publicación. Que se repita no prueba que sea la causa."
      >
        {r.mejores.length < MIN_MEJORES_PARA_COMPARAR ? (
          <Empty>
            Con menos de {MIN_MEJORES_PARA_COMPARAR} publicaciones arriba no hay con qué comparar. Amplía
            el período o sube el porcentaje.
          </Empty>
        ) : r.enComun.length === 0 ? (
          <Empty>Nada se repite más entre las de arriba que en el resto.</Empty>
        ) : (
          <ul className="space-y-2">
            {r.enComun.map((rasgo) => (
              <li key={`${rasgo.rasgo}:${rasgo.valor}`} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.88rem] text-fg">
                    <span className="text-fg-muted">{rasgo.rasgo}:</span> {rasgo.valor}
                  </p>
                  <p className="text-[0.75rem] text-fg-faint">
                    {rasgo.enMejores} de {rasgo.mejores} arriba · {rasgo.enTodas} de {rasgo.todas} entre todas
                  </p>
                </div>
                <span className="shrink-0 font-mono text-[0.85rem] font-semibold tabular-nums text-brasa">
                  {veces(rasgo.veces)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel
        className="mt-4"
        title="Arriba y el resto"
        hint="Medianas: la publicación del medio de cada grupo. Cada una cuenta solo a quien tiene ese número; YouTube no entra en views ganadas, interacciones ni arrastre."
      >
        {r.compiten === 0 ? (
          <Empty>Sin publicaciones que comparar.</Empty>
        ) : (
          <div className="-mx-1 overflow-x-auto px-1">
            <table className="w-full min-w-[17rem] border-collapse text-[0.85rem]">
              <thead>
                <tr className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                  <th className="py-2 pr-3 text-left font-normal" />
                  <th className="py-2 pl-3 text-right font-normal">{titulo}</th>
                  <th className="py-2 pl-3 text-right font-normal">El resto</th>
                </tr>
              </thead>
              <tbody>
                {medianas.map((fila) => (
                  <tr key={fila.campo} className="border-t border-white/[0.06]">
                    <td className="py-2 pr-3 text-fg-muted">{fila.nombre}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{fila.formato(r.medianas.mejores[fila.campo])}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{fila.formato(r.medianas.resto[fila.campo])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-fg-faint">
        {def.sinYouTube
          ? `YouTube no compite en ${nombreMetrica}: sus reglas no permiten calcular métricas con sus datos. Sí compite en visitas y clicks, que mide Tu Parrilla. `
          : ''}
        {metrica === 'arrastre'
          ? 'En el arrastre solo compiten las que ganaron al menos la mediana de views del período: con pocas views, una visita ya es un porcentaje alto. '
          : ''}
        {filas.length >= MAX_PUBLICACIONES_LEIDAS
          ? `Se leyeron las ${formatNumber(MAX_PUBLICACIONES_LEIDAS)} más recientes: acorta el período para verlas todas.`
          : ''}
      </p>
    </>
  )
}
