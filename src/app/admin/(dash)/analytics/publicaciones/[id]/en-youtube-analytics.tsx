import { nombreDestino } from '@/app/admin/(dash)/schedule/etiqueta'
import { Panel } from '@/components/charts/panel'
import { analiticaDeVideos, canalesDeYoutube } from '@/lib/analitica-youtube-lectura'
import type { VersionDePieza } from '@/lib/piezas'
import { etiquetaDeFechas } from '@/lib/rango'
import { duracion } from '@/lib/social/analitica-youtube'
import { formatNumber } from '@/lib/utils'
import { AvisoReconectarYoutube } from '../../tu-canal-de-youtube'

function cifra(n: number | null | undefined): string {
  return n === null || n === undefined ? '—' : formatNumber(n)
}

/**
 * «En YouTube Analytics», debajo de las versiones de la pieza: lo que YouTube Analytics cuenta de
 * cada versión publicada en YouTube, desde que salió —tiempo visto, retención, suscriptores—, tal
 * como lo cuenta. Solo para quien `analiticaDeYoutubeAbiertaPara` deja (lo decide la página) y
 * solo si la pieza tiene una versión en YouTube.
 */
export async function EnYoutubeAnalytics({
  ownerId,
  versiones,
  hoy,
}: {
  ownerId: string
  versiones: VersionDePieza[]
  hoy: string
}) {
  const deYoutube = versiones.filter((v) => v.network === 'youtube' && v.socialPostId)
  if (deYoutube.length === 0) return null

  const canales = await canalesDeYoutube(ownerId)
  const cuentas = new Set(deYoutube.map((v) => v.accountId))
  const sinPermiso = canales.filter((c) => cuentas.has(c.id) && !c.conAnalitica)
  const analitica = await analiticaDeVideos(ownerId, deYoutube.map((v) => v.socialPostId!))

  return (
    <section aria-label="En YouTube Analytics" className="mt-3">
      <Panel
        title="En YouTube Analytics"
        hint="Desde que se publicó, como lo cuenta YouTube Analytics; se actualiza con la sincronización diaria. Duración media y porcentaje visto son los promedios que da YouTube por reproducción."
      >
        {sinPermiso.length > 0 ? (
          <div className="mb-3">
            <AvisoReconectarYoutube canales={sinPermiso} />
          </div>
        ) : null}
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[46rem] border-collapse text-[0.85rem]">
            <thead>
              <tr className="font-mono text-[0.6rem] uppercase tracking-[0.12em] text-fg-faint">
                <th scope="col" className="py-2 pr-3 text-left font-normal">Versión</th>
                <th scope="col" className="py-2 text-right font-normal">Views</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Views con interacción</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Minutos vistos</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Duración media</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Porcentaje visto</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Me gusta</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Comentarios</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Compartidos</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Suscriptores ganados</th>
                <th scope="col" className="py-2 pl-3 text-right font-normal">Suscriptores perdidos</th>
              </tr>
            </thead>
            <tbody>
              {deYoutube.map((v) => {
                const a = analitica.get(v.socialPostId!)
                return (
                  <tr key={v.clave} className="border-t border-velo/[0.06] align-top">
                    <td className="py-2 pr-3">
                      <span className="text-fg">{nombreDestino(v)}</span>
                      <span className="block font-mono text-[0.65rem] text-fg-faint">
                        {a
                          ? `Hasta el ${etiquetaDeFechas({ desde: a.hasta, hasta: a.hasta }, hoy)}`
                          : 'Sin números de YouTube Analytics todavía: llegan con la sincronización diaria.'}
                      </span>
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">{cifra(a?.views)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.engagedViews)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.minutosVistos)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{a ? duracion(a.duracionMedia) : '—'}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">
                      {a?.porcentajeVisto === null || a?.porcentajeVisto === undefined ? '—' : `${a.porcentajeVisto.toFixed(1)}%`}
                    </td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.likes)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.comments)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.shares)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.suscriptoresGanados)}</td>
                    <td className="py-2 pl-3 text-right font-mono tabular-nums">{cifra(a?.suscriptoresPerdidos)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
    </section>
  )
}
