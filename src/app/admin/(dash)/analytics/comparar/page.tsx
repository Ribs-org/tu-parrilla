import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Empty, Panel } from '@/components/charts/panel'
import { RangoBar, SelectorEnUrl } from '@/components/filter-bar'
import { requireUser } from '@/lib/auth'
import { parseFilters } from '@/lib/filters'
import { DIAS_A_IGUAL_EDAD, contraSuCuenta } from '@/lib/igual-edad'
import { networkLabel } from '@/lib/networks'
import { POCAS_PUBLICACIONES, claveElegida, clavesDeAtributos, compararPorAtributo } from '@/lib/pieza'
import { attributesFor } from '@/lib/post-attributes'
import { MAX_PUBLICACIONES_LEIDAS, getCuentas, getPostRows } from '@/lib/posts'
import { cuentaElegida, numerosHref, type Params } from '@/lib/tablero'
import { cn, formatNumber } from '@/lib/utils'
import { nombreDe } from '@/lib/vocabulario'

export const dynamic = 'force-dynamic'

function num(value: number | null): string {
  return value === null ? '—' : formatNumber(Math.round(value))
}

function pct(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(2)}%`
}

function veces(value: number | null): string {
  return value === null ? '—' : `×${value.toFixed(value < 1 ? 2 : 1).replace('.', ',')}`
}

/**
 * Comparar por atributo: para cada valor de un atributo (el hook, el tema, la serie), cuántas
 * publicaciones lo llevan y sus medianas: contra su cuenta y views a los 7 días (a igual
 * edad), views ganadas, visitas y arrastre. Cuenta lo publicado en el período, como la API de
 * métricas: comparar el reel de ayer con uno de hace seis meses por lo ganado este mes no
 * compara hooks. «Atributo» y no «etiqueta»: en el panel, la etiqueta es el `?s=` del link
 * de cada publicación.
 */
export default async function CompararPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams
  const { id: ownerId, zona } = await requireUser()
  const filters = parseFilters(params, ownerId, zona)

  // En serie: ver la nota del pool en `docs/pendientes.md`.
  const cuentas = await getCuentas(ownerId)
  const cuenta = cuentaElegida(params, cuentas)
  const filas = await getPostRows({ ...filters, profileId: null, includeBots: false }, false, {
    publishedFrom: filters.from,
    publishedTo: filters.to,
    limit: MAX_PUBLICACIONES_LEIDAS,
    aLos7Dias: true,
    ...(cuenta ? { accountId: cuenta.id } : {}),
  })
  const atributosDe = await attributesFor(ownerId, filas)
  const entradas = filas.map((fila) => ({ fila, atributos: atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null }))
  const conAtributos = entradas.filter((e) => e.atributos && Object.keys(e.atributos).length > 0).length

  const claves = clavesDeAtributos(entradas.map((e) => e.atributos))
  const clave = claveElegida(typeof params.atributo === 'string' ? params.atributo : undefined, claves)
  const comparadas = clave ? compararPorAtributo(entradas, clave, contraSuCuenta(filas)) : []
  // Un atributo pedido que no aparece en lo publicado del período (un enlace desde una
  // pieza vieja): se muestra otro, pero se dice.
  const pedido = typeof params.atributo === 'string' ? params.atributo : null
  const pedidoAusente = pedido !== null && clave !== null && pedido !== clave ? pedido : null

  return (
    <>
      <header className="mb-4">
        <Link
          href={numerosHref('/admin/analytics', params, { atributo: null })}
          className="inline-flex items-center gap-1 text-[0.8rem] text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          {nombreDe('/admin/analytics')}
        </Link>
        <h1 className="mt-2 font-titulo text-2xl font-semibold uppercase tracking-[0.03em]">Comparar por atributo</h1>
        <p className="mt-0.5 max-w-2xl text-[0.8rem] text-fg-muted">
          Los atributos son lo que le anotas a un post programado —el hook, el tema, la serie—, en
          su editor o por la API. Acá ves, para cada valor, cómo le fue a lo que publicaste en el
          período.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <RangoBar periodo={filters.periodo} />
        {cuentas.length > 1 ? (
          <SelectorEnUrl
            clave="cuenta"
            etiqueta="Cuenta"
            todas="Todas las cuentas"
            opciones={cuentas.map((c) => ({
              valor: c.id,
              texto: c.handle ? `${networkLabel(c.network)} · ${c.handle}` : networkLabel(c.network),
            }))}
          />
        ) : null}
        {claves.length > 0 && clave ? (
          <SelectorEnUrl
            clave="atributo"
            etiqueta="Atributo"
            porDefecto={clave}
            opciones={claves.map((c) => ({ valor: c, texto: `Por ${c}` }))}
          />
        ) : null}
      </div>

      {pedidoAusente ? (
        <p className="chapa mt-4 rounded-xl px-4 py-3 text-[0.82rem] text-fg-muted">
          Nada de lo publicado en este período lleva «{pedidoAusente}». Amplía el período, o mira
          otro atributo.
        </p>
      ) : null}

      <Panel
        className="mt-4"
        title={clave ? `Por ${clave}` : 'Por atributo'}
        hint={`Medianas de lo publicado en el período: la publicación del medio, para que un reel que se pasó no arrastre a todo su valor. «Contra su cuenta» compara cada publicación con lo normal de su cuenta a los ${DIAS_A_IGUAL_EDAD} días: ×1,5 es una vez y media lo normal. Cada mediana cuenta solo a quien tiene ese número; YouTube no entra en views, en «Contra su cuenta» ni en arrastre.`}
      >
        {filas.length === 0 ? (
          <Empty>No publicaste nada en este período. Amplía el período.</Empty>
        ) : !clave ? (
          <Empty>
            Ninguna publicación del período tiene atributos. Se anotan en el editor de un post de La
            Parrilla (el campo «Atributos»), desde «Editar atributos» en una pieza, o por la API.
          </Empty>
        ) : (
          <>
            <div className="-mx-1 overflow-x-auto px-1">
              <table className="w-full min-w-[42rem] border-collapse text-[0.85rem]">
                <thead>
                  <tr className="font-mono text-[0.6rem] uppercase tracking-[0.16em] text-fg-faint">
                    <th colSpan={2} />
                    <th colSpan={3} className="whitespace-nowrap pb-1 pl-4 text-center font-normal">
                      En la red
                    </th>
                    <th colSpan={2} className="whitespace-nowrap pb-1 pl-4 text-center font-normal">
                      En tu página · lo mide Tu Parrilla
                    </th>
                  </tr>
                  <tr className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                    <th className="py-2 pr-3 text-left font-normal normal-case tracking-normal">{clave}</th>
                    <th className="py-2 text-right font-normal">Publicaciones</th>
                    <th className="py-2 pl-4 text-right font-normal">Contra su cuenta</th>
                    <th className="py-2 pl-4 text-right font-normal">Views a los {DIAS_A_IGUAL_EDAD} días</th>
                    <th className="py-2 pl-4 text-right font-normal">Views ganadas</th>
                    <th className="py-2 pl-4 text-right font-normal">Visitas</th>
                    <th className="py-2 pl-4 text-right font-normal">Arrastre</th>
                  </tr>
                </thead>
                <tbody>
                  {comparadas.map((fila) => (
                    <tr
                      key={fila.valor ?? ''}
                      className={cn(
                        'border-t border-white/[0.06]',
                        fila.publicaciones < POCAS_PUBLICACIONES && 'opacity-60',
                      )}
                    >
                      <td className="py-2 pr-3">
                        {fila.valor === null ? (
                          <span className="text-fg-faint">sin {clave}</span>
                        ) : (
                          <span className="font-mono text-[0.8rem] text-fg">{fila.valor}</span>
                        )}
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-fg-muted">
                        {formatNumber(fila.publicaciones)}
                      </td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">{veces(fila.contraSuCuenta)}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">{num(fila.viewsA7Dias)}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">{num(fila.viewsGanadas)}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">{num(fila.visitas)}</td>
                      <td className="py-2 pl-4 text-right font-mono tabular-nums">{pct(fila.arrastre)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 max-w-2xl text-[0.78rem] leading-relaxed text-fg-faint">
              {formatNumber(filas.length)} {filas.length === 1 ? 'publicación' : 'publicaciones'} en el período,{' '}
              {formatNumber(conAtributos)} con atributos. Las filas tenues tienen menos de{' '}
              {POCAS_PUBLICACIONES} publicaciones: con tan pocas, la diferencia puede ser suerte.
              {filas.length >= MAX_PUBLICACIONES_LEIDAS
                ? ` Se leyeron las ${formatNumber(MAX_PUBLICACIONES_LEIDAS)} más recientes: acorta el período para verlas todas.`
                : ''}
            </p>
          </>
        )}
      </Panel>
    </>
  )
}
