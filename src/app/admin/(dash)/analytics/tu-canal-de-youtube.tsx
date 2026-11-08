import { BarList } from '@/components/charts/bar-list'
import { Empty, Panel } from '@/components/charts/panel'
import { seriesColor } from '@/components/charts/theme'
import { TrafficChart } from '@/components/charts/traffic-chart'
import { describe } from '@/lib/analytics'
import {
  canalesDeYoutube,
  desglosesDelCanal,
  diasDelCanal,
  type CanalDeYoutube,
  type DesgloseDelCanal,
  type DiaDelCanal,
} from '@/lib/analitica-youtube-lectura'
import type { Periodo } from '@/lib/filters'
import { etiquetaDeFechas } from '@/lib/rango'
import { DIAS_DE_DESGLOSE, RECONECTA_YOUTUBE, nombreDeAudiencia, nombreDeFuente } from '@/lib/social/analitica-youtube'
import { countryName, flagEmoji, formatNumber } from '@/lib/utils'

/**
 * La ventana de Google, como el «Reconectar» de Los Fierros: un enlace de verdad y no un `Link`,
 * porque la ruta redirige afuera.
 */
const RECONECTAR = '/api/social/youtube/connect'

/**
 * «Reconecta YouTube para ver sus números completos.»: para quien tiene la analítica abierta y un
 * canal conectado sin su permiso —conectado antes de que se pidiera, o con la casilla destildada
 * en la ventana de Google—. Lo usan esta sección y la pieza.
 */
export function AvisoReconectarYoutube({ canales }: { canales: Pick<CanalDeYoutube, 'handle'>[] }) {
  const nombres = canales.map((c) => `«${c.handle ?? 'tu canal'}»`)
  return (
    <div className="chapa rounded-xl px-4 py-3 text-[0.8rem]">
      <p className="text-fg">{RECONECTA_YOUTUBE}</p>
      <p className="mt-1 text-fg-muted">
        {nombres.length > 1 ? `${nombres.join(' y ')} se conectaron` : `${nombres[0] ?? 'Tu canal'} se conectó`} sin el
        permiso para leer YouTube Analytics. Vuelve a conectarlo y, en la ventana de Google, deja marcado ese permiso:
        los números llegan con la sincronización diaria.{' '}
        <a href={RECONECTAR} className="whitespace-nowrap text-fg transition-colors hover:text-fg-muted">
          Reconectar YouTube →
        </a>
      </p>
    </div>
  )
}

/**
 * «Tu canal de YouTube»: lo que YouTube Analytics cuenta de los canales del dueño, tal como lo
 * cuenta —sin sumar días ni restar nada (`politica-youtube.ts`)—. La abre
 * `analiticaDeYoutubeAbiertaPara` (la página decide si se muestra); los números los guarda la
 * sincronización diaria (`social/analitica-youtube-sync.ts`). Con una cuenta elegida arriba, solo
 * ese canal; con una de otra red, no se muestra.
 */
export async function TuCanalDeYoutube({
  ownerId,
  periodo,
  cuentaId,
}: {
  ownerId: string
  periodo: Periodo
  /** La cuenta elegida en «En las redes», si hay una. */
  cuentaId: string | null
}) {
  const todos = await canalesDeYoutube(ownerId)
  const canales = cuentaId ? todos.filter((c) => c.id === cuentaId) : todos
  if (canales.length === 0) return null

  const conAnalitica = canales.filter((c) => c.conAnalitica)
  const sinPermiso = canales.filter((c) => !c.conAnalitica)
  const ids = conAnalitica.map((c) => c.id)
  const dias = await diasDelCanal(ownerId, ids, periodo.desde, periodo.hasta)
  const desgloses = await desglosesDelCanal(ownerId, ids)

  return (
    <section aria-label="Tu canal de YouTube">
      <div className="mb-3">
        <h2 className="font-titulo text-lg font-semibold uppercase tracking-[0.04em]">Tu canal de YouTube</h2>
        <p className="text-[0.8rem] text-fg-muted">
          Lo que YouTube Analytics cuenta de tu canal: cuánto se vio, de dónde llegó la gente y quién mira. Las cifras van
          tal como las da YouTube.
        </p>
      </div>

      {sinPermiso.length > 0 ? <AvisoReconectarYoutube canales={sinPermiso} /> : null}

      <div className="mt-3 space-y-6">
        {conAnalitica.map((canal) => (
          <Canal
            key={canal.id}
            canal={canal}
            titulo={conAnalitica.length > 1}
            periodo={periodo}
            dias={dias.filter((d) => d.accountId === canal.id)}
            desgloses={desgloses.filter((d) => d.accountId === canal.id)}
          />
        ))}
      </div>
    </section>
  )
}

function Canal({
  canal,
  titulo,
  periodo,
  dias,
  desgloses,
}: {
  canal: CanalDeYoutube
  titulo: boolean
  periodo: Periodo
  dias: DiaDelCanal[]
  desgloses: DesgloseDelCanal[]
}) {
  const serie = dias.map((d) => ({
    ...describe(d.day, 'day'),
    views: d.views ?? 0,
    minutos: d.minutosVistos ?? 0,
  }))
  const trafico = desgloses.filter((d) => d.tipo === 'trafico')
  const paises = desgloses.filter((d) => d.tipo === 'pais')
  const audiencia = desgloses.filter((d) => d.tipo === 'audiencia').sort((a, b) => (b.porcentaje ?? 0) - (a.porcentaje ?? 0))
  const rango = desgloses[0]
  const cuando = rango
    ? `En los últimos ${DIAS_DE_DESGLOSE} días (${etiquetaDeFechas({ desde: rango.desde, hasta: rango.hasta }, periodo.hoy)})`
    : `En los últimos ${DIAS_DE_DESGLOSE} días`

  return (
    <div className="space-y-3">
      {titulo ? <h3 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-fg-faint">{canal.handle ?? 'Tu canal'}</h3> : null}

      <Panel
        title="Día a día"
        hint="Views y minutos vistos de cada día del período, como los da YouTube. Los últimos días todavía pueden cambiar: YouTube tarda unos días en asentarlos."
      >
        {serie.length === 0 ? (
          <Empty>Todavía no hay días de YouTube Analytics en este período: llegan con la sincronización diaria.</Empty>
        ) : (
          <TrafficChart
            data={serie}
            separadas
            series={[
              { key: 'views', name: 'Views' },
              { key: 'minutos', name: 'Minutos vistos' },
            ]}
          />
        )}
      </Panel>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel title="De dónde llegó la gente" hint={`${cuando}, las views por fuente de tráfico, con los minutos vistos al lado.`}>
          <BarList
            items={trafico.map((t) => ({
              key: t.clave,
              label: nombreDeFuente(t.clave),
              value: t.views ?? 0,
              note: t.minutosVistos === null ? undefined : `${formatNumber(t.minutosVistos)} min`,
            }))}
            color={seriesColor(0)}
            emptyLabel="Todavía no hay fuentes de tráfico leídas: llegan con la sincronización diaria."
          />
        </Panel>

        <Panel
          title="Quién mira"
          hint={`${cuando}. Los países, por views; la edad y el género, en el porcentaje de espectadores que da YouTube.`}
        >
          <BarList
            items={paises.map((p) => ({
              key: p.clave,
              label: `${flagEmoji(p.clave)} ${countryName(p.clave)}`,
              value: p.views ?? 0,
            }))}
            color={seriesColor(1)}
            emptyLabel="Todavía no hay países leídos: llegan con la sincronización diaria."
          />
          {audiencia.length > 0 ? (
            <ul aria-label="Edad y género" className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[0.8rem]">
              {audiencia.map((a) => (
                <li key={a.clave} className="flex justify-between gap-2">
                  <span className="text-fg-muted">{nombreDeAudiencia(a.clave)}</span>
                  <span className="font-mono tabular-nums">{a.porcentaje === null ? '—' : `${a.porcentaje.toFixed(1)}%`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-[0.78rem] text-fg-faint">
              YouTube no entrega edad ni género de un canal con pocos espectadores en el período.
            </p>
          )}
        </Panel>
      </div>
    </div>
  )
}
