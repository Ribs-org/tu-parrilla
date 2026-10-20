import Link from 'next/link'
import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { fondoDeRed } from '@/lib/color-de-red'
import { NOMBRE_COCCION, NOMBRE_FORMATO } from '@/lib/parrilla'
import { dayKey, dayLabel, groupByDay, hourLabel, weekDays } from '@/lib/schedule-week'
import { cn } from '@/lib/utils'
import { CLASE_FILA, CabezaDeDia, CambiarSemana, PonerAlgo, type BorradorEnCalendario } from './calendar'
import { dibujoDe, type Dibujo } from './dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { PX_POR_MINUTO, minutoDelDia, rangoDeLaReja } from './horas'
import { RejaDeHoras } from './reja-de-horas'
import { SIGNO } from './redes'
import { estadoDeFila, selloQueManda, type EstadoDeFila } from './semana'

type Item = {
  post: ScheduledPost
  targets: Array<ScheduledPostTarget & { handle: string | null }>
  media: Array<{ blobUrl: string; mediaType: string }>
}

/** El alto de un bloque: la hora, y nada más; con decenas al día, no cabe otra cosa. */
const ALTO_DE_BLOQUE = 18
/** Cuántos minutos tapa un bloque: los que caen más cerca que eso van lado a lado. */
const DURA = Math.ceil(ALTO_DE_BLOQUE / PX_POR_MINUTO)

/**
 * «Por hora»: la misma semana que el calendario, como Google Calendar —siete columnas con las
 * horas hacia abajo, cada corte a la altura de su hora—. Todo calza: lo que sale a la misma hora
 * queda a la misma altura en todos los días, y se ven los huecos y los choques. Lo que ya pasó
 * va rayado, y hoy lo cruza la línea de «ahora».
 *
 * Cada corte es un bloque chico: una franja con el color de cada red a la que sale, la hora y el
 * signo del destino que más pide (`selloQueManda`). El dibujo y el texto no caben; van al dejar
 * el mouse encima y en el editor. Los que se juntan van lado a lado, en carriles. Arriba de cada
 * día, lo mismo que en el calendario: su nombre, su calor, el «+», la mezcla de redes y cuánto
 * salió.
 */
export function SemanaPorHora({
  monday,
  items,
  borradores = [],
  zone,
  volver,
  prevHref,
  nextHref,
  nuevoEnDia,
  verDia,
  frias,
  recien = null,
  ahora = new Date(),
}: {
  monday: string
  items: Item[]
  borradores?: BorradorEnCalendario[]
  zone: string
  volver: string
  prevHref: string
  nextHref: string
  nuevoEnDia: (dia: string) => string
  verDia: (dia: string) => string
  frias: ReadonlySet<string>
  recien?: string | null
  ahora?: Date
}) {
  const days = weekDays(monday)
  const today = dayKey(ahora, zone)
  const week = new Set(days)
  const grouped = groupByDay(
    items.map((item) => ({ ...item, scheduledAt: item.post.scheduledAt })).filter((item) => week.has(dayKey(item.scheduledAt, zone))),
    zone,
  )
  const borradoresPorDia = groupByDay(
    borradores.map((b) => ({ ...b, scheduledAt: b.fecha })).filter((b) => week.has(dayKey(b.scheduledAt, zone))),
    zone,
  )
  const dias = days.map((day) => ({
    day,
    cortes: (grouped.get(day) ?? []).map((item) => {
      const dibujo = dibujoDe(item.targets, item.media, frias, item.post.videosLiberados)
      return { ...item, dibujo, estado: estadoDeFila(dibujo.coccion, dibujo.sellos) }
    }),
    enBorrador: borradoresPorDia.get(day) ?? [],
  }))
  const rango = rangoDeLaReja(
    dias.flatMap(({ cortes, enBorrador }) => [
      ...cortes.map((c) => minutoDelDia(c.post.scheduledAt, zone)),
      ...enBorrador.map((b) => minutoDelDia(b.fecha, zone)),
    ]),
    DURA,
    week.has(today) ? minutoDelDia(ahora, zone) : null,
  )

  return (
    <div>
      <CambiarSemana monday={monday} prevHref={prevHref} nextHref={nextHref} />
      <RejaDeHoras
        rango={rango}
        dura={DURA}
        altoDeBloque={ALTO_DE_BLOQUE}
        anchoMinimo="7.5rem"
        desde={ahora.getTime()}
        zona={zone}
        hoy={week.has(today) ? today : null}
        cabezas={dias.map(({ day, cortes }, index) => (
          <CabezaDeDia
            key={day}
            dia={day}
            indice={index}
            hoy={today}
            cortes={cortes}
            verDia={verDia(day)}
            nuevo={day >= today ? nuevoEnDia(day) : null}
          />
        ))}
        columnas={dias.map(({ day, cortes, enBorrador }, index) => ({
          clave: day,
          nombre: dayLabel(day, index),
          tiempo: day < today ? 'pasado' : day === today ? 'hoy' : 'futuro',
          bloques: [
            ...cortes.map((corte) => ({
              clave: corte.post.id,
              minuto: minutoDelDia(corte.post.scheduledAt, zone),
              contenido: <BloqueDeCorte corte={corte} zone={zone} volver={volver} recien={recien} />,
            })),
            ...enBorrador.map((b) => ({
              clave: `borrador-${b.id}`,
              minuto: minutoDelDia(b.fecha, zone),
              contenido: <BloqueDeBorrador borrador={b} zone={zone} />,
            })),
          ].sort((a, b) => a.minuto - b.minuto),
          vacia:
            day >= today ? (
              <PonerAlgo href={nuevoEnDia(day)} vacio="No hay nada puesto." />
            ) : (
              <p className="sr-only">No hay nada puesto.</p>
            ),
        }))}
      />
    </div>
  )
}

/**
 * Un corte en «Por hora»: la franja con el color de cada red a la que sale, la hora y el signo
 * de cómo va. Se ve como una fila de la semana (`CLASE_FILA`).
 */
function BloqueDeCorte({
  corte,
  zone,
  volver,
  recien,
}: {
  corte: Item & { dibujo: Dibujo; estado: EstadoDeFila }
  zone: string
  volver: string
  recien: string | null
}) {
  const { post, targets, dibujo, estado } = corte
  const hora = hourLabel(post.scheduledAt, zone)
  const texto = post.caption || '(sin texto)'
  const sello = selloQueManda(dibujo.sellos)
  const redes = [...new Set(targets.map((t) => t.network))]
  const destinos = targets.map((t) => {
    const motivo = motivoDestino(t)
    return `${nombreDestino(t)}: ${etiquetaDestino(t)}${motivo ? ` — ${motivo}` : ''}`
  })
  return (
    <Link
      href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
      prefetch={false}
      title={[`${hora} · ${texto}`, ...destinos].join('\n')}
      data-recien={post.id === recien ? '' : undefined}
      className={cn(
        'relative flex h-full items-center gap-0.5 overflow-hidden rounded-[3px] border pl-[0.4rem] pr-0.5 transition-colors',
        CLASE_FILA[estado],
        post.id === recien && 'recien',
      )}
    >
      {/* La franja: un tramo por red, en su color. */}
      <span aria-hidden className="absolute inset-y-0 left-0 flex w-[3px] flex-col">
        {redes.map((red) => (
          <span key={red} className={cn('flex-1', fondoDeRed(red))} />
        ))}
      </span>
      <span className={cn('font-mono text-[0.58rem] leading-none tabular-nums', estado === 'servida' ? 'text-fg-muted' : 'text-fg')}>
        {hora}
      </span>
      {sello && SIGNO[sello].signo ? (
        <span aria-hidden className={cn('ml-auto text-[0.58rem] leading-none', SIGNO[sello].color)}>
          {SIGNO[sello].signo}
        </span>
      ) : null}
      <span className="sr-only">
        {' · '}
        {NOMBRE_FORMATO[dibujo.formato]} · {NOMBRE_COCCION[dibujo.coccion]} · {texto} · {destinos.join(', ')}
      </span>
    </Link>
  )
}

/** Un borrador con fecha, a su hora: punteado y sin franja, porque todavía no va a ninguna red. */
function BloqueDeBorrador({ borrador, zone }: { borrador: BorradorEnCalendario; zone: string }) {
  const hora = hourLabel(borrador.fecha, zone)
  return (
    <Link
      href={borrador.href}
      scroll={false}
      prefetch={false}
      title={`Borrador · ${hora} · ${borrador.texto || '(sin texto)'}`}
      className="flex h-full items-center overflow-hidden rounded-[3px] border border-dashed border-velo/30 bg-acero-900 px-1 transition-colors hover:border-velo/60"
    >
      <span className="font-mono text-[0.58rem] leading-none text-fg-muted">{hora}</span>
      <span className="sr-only"> · Borrador: {borrador.texto || '(sin texto)'}</span>
    </Link>
  )
}
