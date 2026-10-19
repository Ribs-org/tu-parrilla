import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, ArrowUpRight } from 'lucide-react'
import { CurvaChart } from '@/components/charts/curva-chart'
import { Empty, Panel } from '@/components/charts/panel'
import { SERIES } from '@/components/charts/theme'
import { InterruptorEnUrl, RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import { DIAS_A_IGUAL_EDAD, cierreDe, contraSuCuenta } from '@/lib/igual-edad'
import { DIAS_DE_LA_CURVA, PORTADAS_POR_LADO, atributosLadoALado, curvaLadoALado, idPedido } from '@/lib/lado-a-lado'
import {
  METRICAS,
  METRICA_POR_DEFECTO,
  ORDEN_METRICAS,
  PERCENTILES,
  PERCENTIL_POR_DEFECTO,
  esMetrica,
  leerPercentil,
  tajada,
} from '@/lib/mejores'
import { networkLabel } from '@/lib/networks'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getCuentas, getLecturasDe, getPostRows, type CuentaRow, type PostRow } from '@/lib/posts'
import type { Atributos } from '@/lib/social/publish/atributos'
import { sinMetricasDerivadas } from '@/lib/social/politica-youtube'
import { cuentaElegida, numerosHref, type Params } from '@/lib/tablero'
import { cn, formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const RUTA = '/admin/analytics/lado-a-lado'

function conteo(valor: number | null): string {
  return valor === null ? '—' : formatNumber(Math.round(valor))
}

function porcentaje(valor: number | null): string {
  return valor === null ? '—' : `${valor.toFixed(2)}%`
}

function veces(valor: number | null): string {
  return valor === null ? '—' : `×${valor.toFixed(valor < 1 ? 2 : 1).replace('.', ',')}`
}

const FORMATO = { conteo, porcentaje, veces } as const

function nombreDeCuenta(cuenta: Pick<CuentaRow, 'network' | 'handle'>): string {
  return cuenta.handle ? `${networkLabel(cuenta.network)} · ${cuenta.handle}` : networkLabel(cuenta.network)
}

/** El texto de una publicación en un selector: corto, para que el selector no ensanche la fila. */
function corto(fila: PostRow): string {
  const texto = (fila.caption || `?s=${fila.campaign}`).replace(/\s+/g, ' ').trim()
  return texto.length > 60 ? `${texto.slice(0, 59)}…` : texto
}

/** Una de las dos: su portada, el link a la red, su pieza y sus números. */
function Ficha({
  letra,
  color,
  fila,
  cuenta,
  relativo,
  puesto,
  pieza,
}: {
  letra: 'A' | 'B'
  color: string
  fila: PostRow
  cuenta: CuentaRow | undefined
  /** Su «contra su cuenta», o null si no se sabe. */
  relativo: number | null
  /** Dónde quedó: en qué tajada y en qué puesto. */
  puesto: string
  /** El link a su pieza, con la vuelta a esta pantalla. */
  pieza: string
}) {
  const numeros = [
    { nombre: 'Contra su cuenta', valor: veces(relativo) },
    { nombre: `Views a los ${DIAS_A_IGUAL_EDAD} días`, valor: conteo(fila.viewsA7Dias) },
    { nombre: 'Views ganadas', valor: conteo(fila.viewsChange) },
    { nombre: 'Views en total', valor: conteo(fila.views) },
    { nombre: 'Visitas a tu página', valor: conteo(fila.visits) },
    { nombre: 'Arrastre', valor: porcentaje(fila.pull) },
  ]
  return (
    <section className="chapa rounded-xl p-4">
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[0.75rem] font-semibold text-acero-950"
          style={{ background: color }}
        >
          {letra}
        </span>
        <span className="truncate text-[0.75rem] text-fg-faint">{puesto}</span>
      </div>
      <div className="mt-3 flex gap-4">
        <div className="w-28 shrink-0 sm:w-32">
          {fila.thumbnailUrl ? (
            <Image
              src={fila.thumbnailUrl}
              alt=""
              width={128}
              height={228}
              unoptimized
              className="aspect-[9/16] w-full rounded-lg bg-white/[0.06] object-cover"
            />
          ) : (
            <div className="flex aspect-[9/16] w-full items-center justify-center rounded-lg bg-white/[0.06] px-2 text-center text-[0.7rem] text-fg-faint">
              Sin portada
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-3 text-[0.88rem] text-fg">{fila.caption || `?s=${fila.campaign}`}</p>
          <p className="mt-1 truncate text-[0.72rem] text-fg-faint">
            {cuenta ? nombreDeCuenta(cuenta) : networkLabel(fila.network)} · {fila.publishedLabel}
          </p>
          {fila.permalink ? (
            <a
              href={fila.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[0.82rem] text-brasa hover:underline"
            >
              Ver en {networkLabel(fila.network)}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </a>
          ) : null}
          {/* Sin prefetch, como en Tus publicaciones (ver `docs/pendientes.md`). */}
          <Link
            prefetch={false}
            href={pieza}
            className="mt-1 block text-[0.78rem] text-fg-muted transition-colors hover:text-fg"
          >
            Abrir su pieza
          </Link>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
        {numeros.map((n) => (
          <div key={n.nombre}>
            <dt className="text-[0.7rem] text-fg-faint">{n.nombre}</dt>
            <dd className="font-mono text-[0.88rem] tabular-nums text-fg">{n.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/**
 * Lado a lado: dos publicaciones con su portada, el link para verlas en la red, sus números,
 * sus atributos y cómo crecieron sus views a la misma edad; debajo, las portadas de las de
 * arriba y las de abajo. Para ver con los ojos si fue el color, la letra o el corte. El video
 * no se guarda: se ve en la red (decisión del dueño, para que el almacenamiento no crezca).
 *
 * Las dos tajadas salen de lo mismo que «Tu mejor 10 %» —el período, la cuenta, la métrica,
 * el porcentaje y las recientes viajan en la URL—, y A y B entran como la mejor y la peor. Se
 * cambian con sus selectores, apretando una portada, o llegando con `a=` desde una pieza.
 */
export default async function LadoALadoPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)

  // En serie: ver la nota del pool en `docs/pendientes.md`.
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentaElegida(params, cuentas)
  const metrica = esMetrica(params.metrica) ? params.metrica : METRICA_POR_DEFECTO
  const conRecientes = params.recientes === '1'
  const pedido = leerPercentil(typeof params.percentil === 'string' ? params.percentil : null)
  const percentil = pedido !== null && PERCENTILES.includes(pedido) ? pedido : PERCENTIL_POR_DEFECTO
  const def = METRICAS[metrica]
  const formato = FORMATO[def.formato]

  const filas = await getPostRows({ ...filters, profileId: null, includeBots: false }, false, {
    publishedFrom: filters.from,
    publishedTo: filters.to,
    limit: MAX_PUBLICACIONES_LEIDAS,
    aLos7Dias: true,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const atributosDe = await attributesFor(ownerId, filas)
  const entradas = filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null }))
  const opciones = { conRecientes, cierre: cierreDe(filters.to) }
  const arriba = tajada(entradas, metrica, percentil, zona, { ...opciones, lado: 'mejor' })
  const abajo = tajada(entradas, metrica, percentil, zona, { ...opciones, lado: 'peor' })
  const relativos = contraSuCuenta(filas)

  // A y B pueden venir de fuera del período (desde una pieza vieja): se leen por su id.
  const deId = new Map(filas.map((f) => [f.id, f]))
  const pedidaA = idPedido(params.a)
  const pedidaB = idPedido(params.b)
  const faltan = [pedidaA, pedidaB].filter((id): id is string => id !== null && !deId.has(id))
  const extra =
    faltan.length > 0
      ? await getPostRows({ ...filters, profileId: null, includeBots: false }, true, { ids: faltan, aLos7Dias: true })
      : []
  for (const fila of extra) deId.set(fila.id, fila)
  const atributosExtra = extra.length > 0 ? await attributesFor(ownerId, extra) : new Map<string, Atributos>()
  const atributosDeFila = (fila: PostRow) => {
    const llave = `${fila.network}:${fila.externalId}`
    return atributosDe.get(llave) ?? atributosExtra.get(llave) ?? null
  }

  const elegida = (pedida: string | null, porDefecto: string | undefined) =>
    (pedida !== null ? deId.get(pedida) : undefined) ?? (porDefecto ? deId.get(porDefecto) : undefined) ?? null
  const filaA = elegida(pedidaA, arriba.grupo[0]?.fila.id)
  const filaB = elegida(pedidaB, abajo.grupo[0]?.fila.id)
  const lecturas = await getLecturasDe(
    ownerId,
    [filaA?.id, filaB?.id].filter((id): id is string => id !== undefined),
  )
  const curva = curvaLadoALado(filaA, filaB, lecturas)
  const atributos = atributosLadoALado(filaA ? atributosDeFila(filaA) : null, filaB ? atributosDeFila(filaB) : null)

  const deQuien = new Map(cuentas.map((c) => [c.id, c]))
  const puesto = (fila: PostRow): string => {
    const deArriba = arriba.grupo.find((m) => m.fila.id === fila.id)
    if (deArriba) return `Puesto ${deArriba.puesto} del mejor ${percentil} %`
    const deAbajo = abajo.grupo.find((m) => m.fila.id === fila.id)
    if (deAbajo) return `Puesto ${deAbajo.puesto} del peor ${percentil} %`
    return def.valor(fila, relativos) === null ? `No compite en «${def.nombre}»` : 'Ni arriba ni abajo'
  }

  // Los selectores: las de arriba y las de abajo, cada una una vez; la elegida que no está en
  // ninguna de las dos (una pieza vieja) va primero, suelta.
  const enArriba = new Set(arriba.grupo.map((m) => m.fila.id))
  const opcionesDeGrupos = [
    ...arriba.grupo.map((m) => ({ valor: m.fila.id, texto: `${m.puesto}. ${corto(m.fila)}`, grupo: `Arriba · el mejor ${percentil} %` })),
    ...abajo.grupo
      .filter((m) => !enArriba.has(m.fila.id))
      .map((m) => ({ valor: m.fila.id, texto: `${m.puesto}. ${corto(m.fila)}`, grupo: `Abajo · el peor ${percentil} %` })),
  ]
  const opcionesPara = (fila: PostRow | null) =>
    fila && !opcionesDeGrupos.some((o) => o.valor === fila.id)
      ? [{ valor: fila.id, texto: corto(fila) }, ...opcionesDeGrupos]
      : opcionesDeGrupos

  const tituloVuelta = `Tu ${params.lado === 'peor' ? 'peor' : 'mejor'} ${percentil} %`
  const conYouTube = [filaA, filaB].some((f) => f !== null && sinMetricasDerivadas(f.network))

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref('/admin/analytics/mejores', params, { a: null, b: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {tituloVuelta}
        </Link>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">Lado a lado</h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Dos publicaciones con su portada, sus números, sus atributos y cómo crecieron a la misma
          edad. Para ver el video, «Ver en» su red: acá no se guarda.
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
          opciones={ORDEN_METRICAS.map((m) => ({ valor: m, texto: METRICAS[m].opcion }))}
        />
        <SelectorEnUrl
          clave="percentil"
          etiqueta="Porcentaje"
          porDefecto={String(PERCENTIL_POR_DEFECTO)}
          opciones={PERCENTILES.map((p) => ({ valor: String(p), texto: `El ${p} % de arriba y de abajo` }))}
        />
        {def.igualEdad ? null : (
          <InterruptorEnUrl
            clave="recientes"
            texto={`Con las de menos de ${DIAS_A_IGUAL_EDAD} días`}
            titulo={`Lo publicado hace menos de ${DIAS_A_IGUAL_EDAD} días casi no tuvo tiempo de sumar: apagado, no compite.`}
          />
        )}
      </div>

      {!filaA || !filaB ? (
        <Panel className="mt-4" title="Lado a lado">
          <Empty>
            {filas.length === 0
              ? 'No publicaste nada en este período. Amplía el período.'
              : `Ninguna publicación del período compite en «${def.nombre}», así que no hay una de arriba ni una de abajo. Amplía el período o elige otra métrica.`}
          </Empty>
        </Panel>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {(
              [
                { clave: 'a', letra: 'A', color: SERIES[0], fila: filaA },
                { clave: 'b', letra: 'B', color: SERIES[1], fila: filaB },
              ] as const
            ).map((lado) => (
              <span key={lado.clave} className="flex min-w-0 max-w-full items-center gap-1.5">
                <span className="font-mono text-[0.78rem] font-semibold" style={{ color: lado.color }} aria-hidden>
                  {lado.letra}
                </span>
                <SelectorEnUrl
                  clave={lado.clave}
                  etiqueta={`Publicación ${lado.letra}`}
                  porDefecto={lado.fila.id}
                  opciones={opcionesPara(lado.fila)}
                />
              </span>
            ))}
          </div>

          {filaA.id === filaB.id ? (
            <p className="chapa mt-4 rounded-xl px-4 py-3 text-[0.82rem] text-fg-muted">
              A y B son la misma publicación: compite una sola. Elige otra en el selector, o amplía el período.
            </p>
          ) : null}

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {(
              [
                { letra: 'A', color: SERIES[0], fila: filaA },
                { letra: 'B', color: SERIES[1], fila: filaB },
              ] as const
            ).map((lado) => (
              <Ficha
                key={lado.letra}
                letra={lado.letra}
                color={lado.color}
                fila={lado.fila}
                cuenta={deQuien.get(lado.fila.accountId)}
                relativo={relativos.get(lado.fila.id) ?? null}
                puesto={puesto(lado.fila)}
                pieza={numerosHref(`/admin/analytics/publicaciones/${lado.fila.id}`, params, { de: 'lado' })}
              />
            ))}
          </div>

          <Panel
            className="mt-4"
            title="Cómo crecieron"
            hint={`Las views de cada una por días cumplidos desde que se publicó, hasta los ${DIAS_DE_LA_CURVA}: así se comparan a la misma edad aunque hayan salido en semanas distintas. La raya marca los ${DIAS_A_IGUAL_EDAD} días. Después de los 10 días se lee cada vez más espaciado, y la línea une lecturas sueltas.`}
          >
            {curva.length === 0 ? (
              <Empty>
                {conYouTube && [filaA, filaB].every((f) => sinMetricasDerivadas(f.network))
                  ? 'YouTube no entra en la curva: sus reglas no permiten comparar sus números.'
                  : 'Todavía no hay lecturas de estas dos: llegan con la sincronización diaria.'}
              </Empty>
            ) : (
              <>
                <CurvaChart puntos={curva} nombres={{ a: corto(filaA), b: corto(filaB) }} marca={DIAS_A_IGUAL_EDAD} />
                {conYouTube ? (
                  <p className="mt-3 text-[0.75rem] text-fg-faint">
                    YouTube no entra en la curva: sus reglas no permiten comparar sus números.
                  </p>
                ) : null}
              </>
            )}
          </Panel>

          <Panel
            className="mt-4"
            title="Sus atributos"
            hint="Lo que se le anotó a cada una al programarla. Los que cambian de una a otra van en naranjo: ahí puede estar la diferencia."
          >
            {atributos.length === 0 ? (
              <Empty>Ninguna de las dos tiene atributos. Se anotan en el editor de un post de La Parrilla, o por la API.</Empty>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[18rem] border-collapse text-[0.85rem]">
                  <thead>
                    <tr className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                      <th className="py-2 pr-3 text-left font-normal">Atributo</th>
                      <th className="py-2 pl-3 text-left font-normal">A</th>
                      <th className="py-2 pl-3 text-left font-normal">B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {atributos.map((fila) => (
                      <tr key={fila.clave} className="border-t border-white/[0.06]">
                        <td className="py-2 pr-3 text-fg-muted">{fila.clave}</td>
                        <td className={cn('py-2 pl-3 font-mono text-[0.8rem]', fila.igual ? 'text-fg' : 'text-brasa')}>{fila.a}</td>
                        <td className={cn('py-2 pl-3 font-mono text-[0.8rem]', fila.igual ? 'text-fg' : 'text-brasa')}>{fila.b}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel
            className="mt-4"
            title="Las portadas"
            hint={`Las de arriba y las de abajo en «${def.nombre}», para ver de un vistazo si algo se repite: un color, una letra, una cara. Apretar una de arriba la pone de A; una de abajo, de B.`}
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {(
                [
                  { clave: 'a', titulo: `Arriba · el mejor ${percentil} %`, grupo: arriba.grupo, elegida: filaA.id },
                  { clave: 'b', titulo: `Abajo · el peor ${percentil} %`, grupo: abajo.grupo, elegida: filaB.id },
                ] as const
              ).map((lado) => (
                <div key={lado.clave}>
                  <h3 className="mb-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">{lado.titulo}</h3>
                  <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {lado.grupo.slice(0, PORTADAS_POR_LADO).map((m) => (
                      <li key={m.fila.id}>
                        <Link
                          href={numerosHref(RUTA, params, { [lado.clave]: m.fila.id })}
                          scroll={false}
                          title={m.fila.caption || `?s=${m.fila.campaign}`}
                          className={cn(
                            'block overflow-hidden rounded-lg border-2 transition-colors',
                            m.fila.id === lado.elegida ? 'border-brasa' : 'border-transparent hover:border-white/20',
                          )}
                        >
                          {m.fila.thumbnailUrl ? (
                            <Image
                              src={m.fila.thumbnailUrl}
                              alt=""
                              width={120}
                              height={150}
                              unoptimized
                              className="aspect-[4/5] w-full bg-white/[0.06] object-cover"
                            />
                          ) : (
                            <span className="block aspect-[4/5] w-full bg-white/[0.06]" aria-hidden />
                          )}
                        </Link>
                        <p className="mt-1 text-center font-mono text-[0.7rem] tabular-nums text-fg-muted">
                          {formato(m.valor)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  {lado.grupo.length > PORTADAS_POR_LADO ? (
                    <p className="mt-2 text-[0.75rem] text-fg-faint">
                      Y {formatNumber(lado.grupo.length - PORTADAS_POR_LADO)} más: se ven en «{tituloVuelta}».
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}

      <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-fg-faint">
        {filas.length >= MAX_PUBLICACIONES_LEIDAS
          ? `Se leyeron las ${formatNumber(MAX_PUBLICACIONES_LEIDAS)} más recientes: acorta el período para verlas todas.`
          : ''}
      </p>
    </>
  )
}
