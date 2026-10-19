import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Empty, Panel } from '@/components/charts/panel'
import { StatTile } from '@/components/charts/stat-tile'
import { InterruptorEnUrl, RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import { DIAS_A_IGUAL_EDAD, MIN_DE_SU_CUENTA, cierreDe } from '@/lib/igual-edad'
import {
  LADO_POR_DEFECTO,
  METRICAS,
  METRICA_POR_DEFECTO,
  MIN_MEJORES_PARA_COMPARAR,
  ORDEN_METRICAS,
  PERCENTILES,
  PERCENTIL_POR_DEFECTO,
  POCAS_PARA_CONCLUIR,
  esLado,
  esMetrica,
  leerPercentil,
  tajada,
  type Medianas,
  type Metrica,
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

/** «×2,3»; debajo de uno, con dos decimales, para que lo de abajo no se lea todo «×0,1». */
function veces(valor: number | null): string {
  return valor === null ? '—' : `×${valor.toFixed(valor < 1 ? 2 : 1).replace('.', ',')}`
}

const FORMATO = { conteo, porcentaje, veces } as const

/** Quién compite en cada métrica: la aclaración de la cifra «Entran». */
const QUIEN_COMPITE: Record<Metrica, string> = {
  contraSuCuenta: `Con ${DIAS_A_IGUAL_EDAD} días cumplidos, de cuentas con ${MIN_DE_SU_CUENTA} o más · sin YouTube`,
  viewsA7Dias: `Publicaciones con ${DIAS_A_IGUAL_EDAD} días cumplidos · sin YouTube`,
  viewsGanadas: 'Publicaciones con views ganadas · sin YouTube',
  visitas: 'Publicaciones con visitas a tu página',
  clicks: 'Publicaciones con clicks en tus links',
  interacciones: 'Publicaciones con interacciones · sin YouTube',
  arrastre: 'Publicaciones con arrastre · sin YouTube',
}

/** Por qué no compite ninguna, para el panel vacío. */
function nadieCompite(metrica: Metrica, fueraPorRecientes: number): string {
  if (fueraPorRecientes > 0) {
    return `Todo lo del período que tiene ${METRICAS[metrica].nombre.toLowerCase()} se publicó hace menos de ${DIAS_A_IGUAL_EDAD} días. Prende «Con las de menos de ${DIAS_A_IGUAL_EDAD} días» para verlo, o amplía el período.`
  }
  switch (metrica) {
    case 'contraSuCuenta':
      return `Ninguna cuenta tiene ${MIN_DE_SU_CUENTA} publicaciones del período con ${DIAS_A_IGUAL_EDAD} días cumplidos, y con menos no hay contra qué compararlas. Amplía el período, o mira «Por views a los ${DIAS_A_IGUAL_EDAD} días».`
    case 'viewsA7Dias':
      return `Ninguna publicación del período tiene su lectura de los ${DIAS_A_IGUAL_EDAD} días: lo de la última semana todavía no los cumple. Amplía el período. YouTube no entra en esta métrica.`
    case 'visitas':
    case 'clicks':
      return `Ninguna publicación del período tiene ${METRICAS[metrica].nombre.toLowerCase()}. Las visitas y los clicks se cuentan cuando alguien entra por el link con la etiqueta de la publicación.`
    default:
      return `Ninguna publicación del período tiene ${METRICAS[metrica].nombre.toLowerCase()}. YouTube no entra en esta métrica.`
  }
}

/** Cómo se lee una métrica a igual edad, al pie. */
const A_IGUAL_EDAD: Partial<Record<Metrica, string>> = {
  viewsA7Dias: `«Views a los ${DIAS_A_IGUAL_EDAD} días» es el contador una semana después de publicar: así lo de hace un mes no le gana a lo de ayer solo por llevar más tiempo. Lo publicado en la última semana todavía no compite. `,
  contraSuCuenta: `«Contra su cuenta» divide las views a los ${DIAS_A_IGUAL_EDAD} días de cada publicación por la mediana de su cuenta en el período: ×2 es el doble de lo normal de esa cuenta, esté en la red que esté y tenga los seguidores que tenga. Una cuenta con menos de ${MIN_DE_SU_CUENTA} publicaciones con ${DIAS_A_IGUAL_EDAD} días cumplidos no compite, y lo de la última semana tampoco. `,
}

/**
 * Tu mejor X % (o tu peor): de lo publicado en el período, las publicaciones que más (o menos)
 * rindieron en una métrica, cuánto había que sacar para entrar, cuánto rinden contra el resto
 * y qué tienen en común. Cuenta lo publicado en el período, como Comparar por atributo y la
 * API: medir por lo ganado este mes un reel de hace seis meses contra el de ayer no dice qué
 * funciona. Por eso entra por defecto con «contra su cuenta», que además mide a igual edad.
 */
export default async function MejoresPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)

  // En serie: ver la nota del pool en `docs/pendientes.md`.
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentaElegida(params, cuentas)
  const metrica = esMetrica(params.metrica) ? params.metrica : METRICA_POR_DEFECTO
  const lado = esLado(params.lado) ? params.lado : LADO_POR_DEFECTO
  const conRecientes = params.recientes === '1'
  const pedido = leerPercentil(typeof params.percentil === 'string' ? params.percentil : null)
  const percentil = pedido !== null && PERCENTILES.includes(pedido) ? pedido : PERCENTIL_POR_DEFECTO
  const def = METRICAS[metrica]

  const filas = await getPostRows({ ...filters, profileId: null, includeBots: false }, false, {
    publishedFrom: filters.from,
    publishedTo: filters.to,
    limit: MAX_PUBLICACIONES_LEIDAS,
    aLos7Dias: true,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const atributosDe = await attributesFor(ownerId, filas)
  const r = tajada(
    filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null })),
    metrica,
    percentil,
    zona,
    { lado, conRecientes, cierre: cierreDe(filters.to) },
  )

  const formato = FORMATO[def.formato]
  const deQuien = new Map(cuentas.map((c) => [c.id, c]))
  const peor = lado === 'peor'
  const delGrupo = peor ? 'abajo' : 'arriba'
  const titulo = `Tu ${peor ? 'peor' : 'mejor'} ${percentil} %`

  const medianas: Array<{ nombre: string; campo: keyof Medianas; formato: (v: number | null) => string }> = [
    { nombre: 'Contra su cuenta', campo: 'contraSuCuenta', formato: veces },
    { nombre: `Views a los ${DIAS_A_IGUAL_EDAD} días`, campo: 'viewsA7Dias', formato: conteo },
    { nombre: 'Views ganadas', campo: 'viewsGanadas', formato: conteo },
    { nombre: 'Visitas a tu página', campo: 'visitas', formato: conteo },
    { nombre: 'Interacciones', campo: 'interacciones', formato: conteo },
    { nombre: 'Arrastre', campo: 'arrastre', formato: porcentaje },
  ]

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref('/admin/analytics', params, { metrica: null, percentil: null, lado: null, recientes: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {nombreDe('/admin/analytics')}
        </Link>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">{titulo}</h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          {peor
            ? 'Lo que publicaste en el período que menos rindió, cuánto sacó como mucho y qué tienen en común esas publicaciones frente al resto.'
            : 'Lo que publicaste en el período que más rindió, cuánto había que sacar para entrar y qué tienen en común esas publicaciones frente al resto.'}
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
          clave="lado"
          etiqueta="Lo mejor o lo peor"
          porDefecto={LADO_POR_DEFECTO}
          opciones={[
            { valor: 'mejor', texto: 'Lo mejor' },
            { valor: 'peor', texto: 'Lo peor' },
          ]}
        />
        <SelectorEnUrl
          clave="metrica"
          etiqueta="Métrica"
          porDefecto={METRICA_POR_DEFECTO}
          opciones={ORDEN_METRICAS.map((m) => ({ valor: m, texto: METRICAS[m].opcion }))}
        />
        <SelectorEnUrl
          clave="percentil"
          etiqueta="Porcentaje"
          porDefecto={String(PERCENTIL_POR_DEFECTO)}
          opciones={PERCENTILES.map((p) => ({ valor: String(p), texto: `El ${peor ? 'peor' : 'mejor'} ${p} %` }))}
        />
        {def.igualEdad ? null : (
          <InterruptorEnUrl
            clave="recientes"
            texto={`Con las de menos de ${DIAS_A_IGUAL_EDAD} días`}
            titulo={`Lo publicado hace menos de ${DIAS_A_IGUAL_EDAD} días casi no tuvo tiempo de sumar: apagado, no compite.`}
          />
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Entran"
          value={r.compiten === 0 ? '—' : `${formatNumber(r.grupo.length)} de ${formatNumber(r.compiten)}`}
          hint={QUIEN_COMPITE[metrica]}
        />
        <StatTile
          label="El corte"
          value={formato(r.corte)}
          hint={peor ? `${def.nombre}: entran las que no pasaron de esto` : `${def.nombre} para entrar`}
        />
        <StatTile
          label="Rinden"
          value={veces(r.rinden)}
          hint={`La mediana de ${delGrupo} contra la del resto`}
        />
      </div>

      {r.fueraPorRecientes > 0 && r.compiten > 0 ? (
        <p className="chapa mt-4 rounded-xl px-4 py-3 text-[0.82rem] text-fg-muted">
          {r.fueraPorRecientes === 1
            ? `1 publicación de menos de ${DIAS_A_IGUAL_EDAD} días no compite: casi no tuvo tiempo de sumar.`
            : `${formatNumber(r.fueraPorRecientes)} publicaciones de menos de ${DIAS_A_IGUAL_EDAD} días no compiten: casi no tuvieron tiempo de sumar.`}{' '}
          Para sumarlas, prende «Con las de menos de {DIAS_A_IGUAL_EDAD} días».
        </p>
      ) : null}

      {r.compiten > 0 && r.compiten < POCAS_PARA_CONCLUIR ? (
        <p className="chapa mt-4 rounded-xl px-4 py-3 text-[0.82rem] text-fg-muted">
          Compiten solo {formatNumber(r.compiten)} {r.compiten === 1 ? 'publicación' : 'publicaciones'}: con
          tan pocas, el {peor ? 'peor' : 'mejor'} {percentil} % sirve para mirarlas, no para sacar conclusiones.
          Amplía el período o sube el porcentaje.
        </p>
      ) : null}

      <Panel
        className="mt-4"
        title="Las publicaciones"
        hint={`De la más ${peor ? 'baja a la más alta' : 'alta a la más baja'} en «${def.nombre}». Cada una abre su pieza.`}
      >
        {filas.length === 0 ? (
          <Empty>No publicaste nada en este período. Amplía el período.</Empty>
        ) : r.compiten === 0 ? (
          <Empty>{nadieCompite(metrica, r.fueraPorRecientes)}</Empty>
        ) : r.grupo.length === 0 ? (
          <Empty>Ninguna publicación del período sumó {def.nombre.toLowerCase()}.</Empty>
        ) : (
          <ol className="space-y-2">
            {r.grupo.map((m) => {
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
                  <span className="shrink-0 text-right">
                    <span className="block font-mono text-[0.9rem] font-semibold tabular-nums text-fg">
                      {formato(m.valor)}
                    </span>
                    {metrica === 'contraSuCuenta' ? (
                      <span className="block font-mono text-[0.68rem] tabular-nums text-fg-faint">
                        {conteo(m.fila.viewsA7Dias)} views
                      </span>
                    ) : null}
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
        hint={`Lo que se repite más entre las de ${delGrupo} que entre todas las que compiten: los atributos, la red, el formato, el día y la hora de publicación. Que se repita no prueba que sea la causa.`}
      >
        {r.grupo.length < MIN_MEJORES_PARA_COMPARAR ? (
          <Empty>
            Con menos de {MIN_MEJORES_PARA_COMPARAR} publicaciones {delGrupo} no hay con qué comparar. Amplía
            el período o sube el porcentaje.
          </Empty>
        ) : r.enComun.length === 0 ? (
          <Empty>Nada se repite más entre las de {delGrupo} que en el resto.</Empty>
        ) : (
          <ul className="space-y-2">
            {r.enComun.map((rasgo) => (
              <li key={`${rasgo.rasgo}:${rasgo.valor}`} className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[0.88rem] text-fg">
                    <span className="text-fg-muted">{rasgo.rasgo}:</span> {rasgo.valor}
                  </p>
                  <p className="text-[0.75rem] text-fg-faint">
                    {rasgo.enElGrupo} de {rasgo.grupo} {delGrupo} · {rasgo.enTodas} de {rasgo.todas} entre todas
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
        title={peor ? 'Abajo y el resto' : 'Arriba y el resto'}
        hint={`Medianas: la publicación del medio de cada grupo. Cada una cuenta solo a quien tiene ese número; YouTube no entra en «Contra su cuenta», en las views (a los ${DIAS_A_IGUAL_EDAD} días o ganadas), en las interacciones ni en el arrastre.`}
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
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{fila.formato(r.medianas.grupo[fila.campo])}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{fila.formato(r.medianas.resto[fila.campo])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-fg-faint">
        {A_IGUAL_EDAD[metrica] ?? ''}
        {def.sinYouTube
          ? `YouTube no compite en «${def.nombre}»: sus reglas no permiten calcular métricas con sus datos. Sí compite en visitas y clicks, que mide Tu Parrilla. `
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
