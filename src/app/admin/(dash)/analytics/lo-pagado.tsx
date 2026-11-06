import Image from 'next/image'
import Link from 'next/link'
import { Empty, Panel } from '@/components/charts/panel'
import { StatTile } from '@/components/charts/stat-tile'
import { NombreDe } from '@/components/de-noche-y-de-dia'
import { Icon } from '@/components/icon'
import type { Periodo } from '@/lib/filters'
import { leerLoPagado, tieneAnuncios } from '@/lib/lo-pagado'
import { networkLabel } from '@/lib/networks'
import { etiquetaDeFechas } from '@/lib/rango'
import { formatearGasto, resumirLoPagado, type PublicacionPagada } from '@/lib/social/anuncios'
import { numerosHref, type Params } from '@/lib/tablero'
import { formatNumber } from '@/lib/utils'

const RUTA = '/admin/analytics'

/** «—» cuando Meta no lo dio: no se sabe no es cero. */
function cifra(n: number | null): string {
  return n === null ? '—' : formatNumber(n)
}

function fechas(p: PublicacionPagada, hoy: string): string {
  if (!p.desde && !p.hasta) return '—'
  return etiquetaDeFechas({ desde: p.desde ?? p.hasta!, hasta: p.hasta ?? p.desde! }, hoy)
}

/**
 * «Lo pagado»: cómo les fue a los anuncios de Meta del dueño y, sobre todo, a sus publicaciones
 * promocionadas. Solo leer: Tu Parrilla no crea ni promociona anuncios. La abre
 * `anunciosAbiertosPara` (la página decide si se muestra); los números los guarda la
 * sincronización diaria (`social/anuncios-sync.ts`).
 */
export async function LoPagado({
  ownerId,
  periodo,
  params,
  nombres,
}: {
  ownerId: string
  periodo: Periodo
  params: Params
  /** «Red · cuenta» por id de cuenta, el mismo patrón del resto del tablero. */
  nombres: Record<string, string>
}) {
  const filas = await leerLoPagado(ownerId, periodo.desde, periodo.hasta)
  const { totales, publicaciones, sueltos } = resumirLoPagado(filas)
  const algunaVez = filas.length > 0 || (await tieneAnuncios(ownerId))

  return (
    <section aria-label="Lo pagado">
      <div className="mb-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.04em]">Lo pagado</h2>
        <p className="text-[0.8rem] text-fg-muted">
          Lo que hicieron tus anuncios de Instagram y Facebook, y las publicaciones que promocionaste. Lo cuenta Meta.
        </p>
      </div>

      {filas.length === 0 ? (
        <div className="chapa rounded-xl px-5">
          <Empty>
            {algunaVez ? (
              'Ningún anuncio tuyo corrió en este período.'
            ) : (
              <>
                Todavía no hay anuncios leídos. Si promocionaste una publicación, vuelve a conectar Instagram en{' '}
                <NombreDe ruta="/admin/accounts" /> y acepta el permiso para ver tus anuncios: los números llegan con
                la sincronización diaria.
              </>
            )}
          </Empty>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Gastado"
              value={formatearGasto(totales.gasto)}
              hint={`En ${totales.anuncios} ${totales.anuncios === 1 ? 'anuncio' : 'anuncios'}, de principio a fin`}
            />
            <StatTile label="Alcance pagado" value={cifra(totales.alcance)} hint="Cuentas a las que llegaron" />
            <StatTile label="Impresiones" value={cifra(totales.impresiones)} hint="Veces que se mostraron" />
            <StatTile label="Clics" value={cifra(totales.clics)} hint="En cualquier parte del anuncio" />
          </div>

          <Panel
            className="mt-3"
            title="Tus publicaciones promocionadas"
            hint="Cada una con lo de todos sus anuncios, de principio a fin, aunque hayan empezado antes del período. Con dos anuncios, el alcance se suma y puede contar dos veces a la misma cuenta."
          >
            {publicaciones.length === 0 ? (
              <Empty>Ninguno de estos anuncios promociona una publicación de tus cuentas conectadas.</Empty>
            ) : (
              <div className="-mx-1 overflow-x-auto px-1">
                <table className="w-full min-w-[36rem] border-collapse text-[0.85rem]">
                  <thead>
                    <tr className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-fg-faint">
                      <th scope="col" className="pb-2 text-left font-normal">Publicación</th>
                      <th scope="col" className="pb-2 text-right font-normal">Anuncios</th>
                      <th scope="col" className="pb-2 text-right font-normal">Gastado</th>
                      <th scope="col" className="pb-2 text-right font-normal">Alcance</th>
                      <th scope="col" className="pb-2 text-right font-normal">Impresiones</th>
                      <th scope="col" className="pb-2 text-right font-normal">Clics</th>
                      <th scope="col" className="pb-2 pl-3 text-left font-normal">Fechas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {publicaciones.map((p) => (
                      <tr key={p.postId} className="border-t border-velo/[0.06]">
                        <td className="max-w-[14rem] py-2 pr-3">
                          <span className="flex items-center gap-2">
                            {p.thumbnailUrl ? (
                              <Image
                                src={p.thumbnailUrl}
                                alt=""
                                width={20}
                                height={20}
                                unoptimized
                                className="h-5 w-5 shrink-0 rounded object-cover"
                              />
                            ) : null}
                            <span className="min-w-0">
                              <Link
                                prefetch={false}
                                href={numerosHref(`${RUTA}/publicaciones/${p.postId}`, params, { de: 'numeros', mas: null })}
                                className="block truncate text-[0.8rem] transition-colors hover:text-fg-muted"
                              >
                                {p.caption || p.campaign || 'Publicación sin texto'}
                              </Link>
                              <span className="flex items-center gap-1 text-[0.68rem] text-fg-faint">
                                {p.network ? <Icon name={p.network} className="h-3 w-3 shrink-0" /> : null}
                                <span className="truncate">
                                  {(p.accountId && nombres[p.accountId]) ?? (p.network ? networkLabel(p.network) : '')}
                                </span>
                              </span>
                            </span>
                          </span>
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-fg-muted">{p.anuncios}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{formatearGasto(p.gasto)}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-fg-muted">{cifra(p.alcance)}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-fg-muted">{cifra(p.impresiones)}</td>
                        <td className="py-2 text-right font-mono tabular-nums text-fg-muted">{cifra(p.clics)}</td>
                        <td className="whitespace-nowrap py-2 pl-3 text-[0.78rem] text-fg-muted">{fechas(p, periodo.hoy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {sueltos > 0 ? (
              <p className="mt-3 text-[0.78rem] text-fg-faint">
                {sueltos === 1
                  ? 'Además, 1 anuncio que no sale de una publicación de tus cuentas conectadas: suma arriba, pero no tiene fila.'
                  : `Además, ${sueltos} anuncios que no salen de una publicación de tus cuentas conectadas: suman arriba, pero no tienen fila.`}
              </p>
            ) : null}
          </Panel>
        </>
      )}
    </section>
  )
}
