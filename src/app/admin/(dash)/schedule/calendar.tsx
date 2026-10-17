import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Corte } from '@/components/corte'
import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { dayLabel, dayKey, groupByDay, hourLabel, weekDays, weekLabel } from '@/lib/schedule-week'
import { networkLabel } from '@/lib/networks'
import { NOMBRE_COCCION, NOMBRE_FORMATO, calorDelDia, type Coccion } from '@/lib/parrilla'
import { cn } from '@/lib/utils'
import { DesplazarAHoy } from './desplazar-a-hoy'
import { bordeDe, dibujoDe, estadoCorto, type Borde } from './dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { Redes } from './redes'

/** Un borrador con fecha, ya con su enlace: el calendario solo lo pone en su día. */
export type BorradorEnCalendario = { id: string; href: string; fecha: Date; texto: string }

type Item = {
  post: ScheduledPost
  targets: Array<ScheduledPostTarget & { handle: string | null }>
  media: Array<{ blobUrl: string; mediaType: string }>
}

/** Lo que dice la grilla de cada día, arriba a la derecha. También la vista «Día». */
export const ROTULO_CALOR = {
  apagada: 'Apagada',
  prendida: 'Prendida',
  llena: 'Parrilla llena',
} as const

/**
 * La tarjeta de un corte: chapa, y no carne. La carne es el dibujo de arriba; la tarjeta solo
 * cambia de borde cuando necesita algo del dueño (`bordeDe`, en `dibujo.ts`). La comparten la
 * semana y la vista «Día».
 */
export const CLASE_BORDE: Record<Borde, string> = {
  cuenta: 'border-acero-700',
  atencion: 'border-caution/75',
  mano: 'border-negative/80',
}

/** El color del estado en palabras, al lado de la hora. */
export const CLASE_ESTADO: Record<Coccion, string> = {
  cruda: 'text-fg',
  sellada: 'text-fg',
  punto: 'text-positive',
  parcial: 'text-negative',
  quemada: 'text-negative',
}

/**
 * La invitación de una parrilla fría en la que todavía se puede programar: «+ Poner algo».
 * Con mouse aparece al pasar por el día (`.poner-algo`, en globals.css). La frase de que no
 * hay nada va adelante, solo para el lector de pantalla: la parrilla fría, que es lo que lo
 * dice a la vista, no la ve. La comparten la semana y la vista «Día».
 */
export function PonerAlgo({ href, vacio }: { href: string; vacio: string }) {
  return (
    <Link
      href={href}
      scroll={false}
      // La transición en la utilidad y no en `.poner-algo`: `transition-colors` la pisaría.
      // Sin corte de línea y con poco aire a los lados: en el teléfono la columna de un día mide
      // menos de cien píxeles, y «Poner algo» se partía en dos renglones.
      className="poner-algo inline-flex items-center gap-1 self-center whitespace-nowrap rounded-md border border-dashed border-acero-600 px-2 py-1 text-[0.72rem] text-fg-muted transition-[opacity,color,border-color] duration-150 hover:border-brasa hover:text-fg"
    >
      <span className="sr-only">{vacio} </span>
      <Plus className="h-3 w-3" aria-hidden />
      Poner algo
    </Link>
  )
}

/**
 * La semana de lunes a domingo: la vista con que abre La Parrilla.
 *
 * Además de los cortes, cada día que no pasó trae un «+» que abre el compositor con ese día
 * puesto (`nuevoEnDia`), y los borradores con fecha aparecen en el suyo con borde punteado.
 * Los borradores no cuentan para el calor del día: todavía no van a salir. Un día sin nada es
 * una parrilla fría, con «Poner algo» si todavía no pasó.
 */
export function WeekCalendar({
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
}: {
  monday: string
  items: Item[]
  borradores?: BorradorEnCalendario[]
  zone: string
  volver: string
  prevHref: string
  nextHref: string
  /** El enlace que abre el compositor en ese día. */
  nuevoEnDia: (dia: string) => string
  /** El enlace a ese día en la vista «Día», desgranado por cuenta. */
  verDia: (dia: string) => string
  /** Las cuentas con el fierro frío: lo programado ahí lleva la marca fría. */
  frias: ReadonlySet<string>
  /** El post recién programado: su tarjeta cae en su día, encendida una vez. */
  recien?: string | null
}) {
  const days = weekDays(monday)
  const today = dayKey(new Date(), zone)
  const week = new Set(days)
  const grouped = groupByDay(
    items
      .map((item) => ({ ...item, scheduledAt: item.post.scheduledAt }))
      .filter((item) => week.has(dayKey(item.scheduledAt, zone))),
    zone,
  )
  const borradoresPorDia = groupByDay(
    borradores
      .map((b) => ({ ...b, scheduledAt: b.fecha }))
      .filter((b) => week.has(dayKey(b.scheduledAt, zone))),
    zone,
  )

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-sm">
        <Link
          href={prevHref}
          className="inline-flex items-center gap-1 text-fg-faint transition-colors hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Semana anterior
        </Link>
        <span className="font-mono text-[0.8rem] text-fg-muted">{weekLabel(monday)}</span>
        <Link
          href={nextHref}
          className="inline-flex items-center gap-1 text-fg-faint transition-colors hover:text-fg"
        >
          Semana siguiente
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      {/*
        `relative` no es decorativo: los textos `sr-only` de adentro (el «+» de cada día) se
        posicionan en absoluto, y sin un ancestro posicionado dentro de esta caja se escapaban
        de su scroll y estiraban la página entera al ancho de la semana en el teléfono. Es
        también lo que deja a `DesplazarAHoy` medir dónde está hoy.
      */}
      <DesplazarAHoy className="relative -mx-1 overflow-x-auto px-1">
        <div className="grid min-w-[52rem] grid-cols-7 gap-2">
          {days.map((day, index) => {
            const cortes = grouped.get(day) ?? []
            const enBorrador = borradoresPorDia.get(day) ?? []
            const calor = calorDelDia(cortes.length)
            // En un día que ya pasó no se programa: ni el «+» ni la invitación a prenderlo.
            const abierto = day >= today
            return (
              <div key={day} className="flex flex-col gap-2" data-hoy={day === today ? '' : undefined}>
                <div className="flex items-baseline justify-between gap-2">
                  {/* El nombre del día abre ese día, cuenta por cuenta. */}
                  <Link
                    href={verDia(day)}
                    className={cn(
                      'font-titulo text-[0.65rem] uppercase tracking-[0.14em] underline-offset-2 transition-colors hover:text-fg hover:underline',
                      day === today ? 'text-fg' : 'text-fg-faint',
                    )}
                  >
                    {dayLabel(day, index)}
                    <span className="sr-only">: ver por cuenta</span>
                  </Link>
                  <span
                    // En el secundario y no en el tenue: a 0.55rem es el texto más chico
                    // de la pantalla, y el secundario es el que más le sobra sobre el
                    // mínimo de 4.5:1 (5,85 contra 5,03 sobre la chapa).
                    className={cn(
                      'font-titulo text-[0.55rem] uppercase tracking-[0.12em]',
                      calor === 'llena' ? 'text-brasa' : 'text-fg-muted',
                    )}
                  >
                    {ROTULO_CALOR[calor]}
                  </span>
                  {abierto ? (
                    <Link
                      href={nuevoEnDia(day)}
                      scroll={false}
                      className="-my-1 rounded p-0.5 text-fg-faint transition-colors hover:bg-white/[0.08] hover:text-fg"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                      <span className="sr-only">Programar el {dayLabel(day, index)}</span>
                    </Link>
                  ) : null}
                </div>

                <div
                  className={cn(
                    'grilla flex min-h-[4.5rem] flex-col gap-2 p-2',
                    calor === 'apagada' && 'grilla-apagada justify-center',
                    calor === 'prendida' && 'grilla-prendida',
                    calor === 'llena' && 'grilla-llena',
                    // El día de hoy se marca con el borde y no con el fondo: el fondo ya
                    // lo está usando el fuego para contar el volumen.
                    day === today && 'ring-1 ring-inset ring-white/25',
                  )}
                >
                  {cortes.length === 0 && enBorrador.length === 0 ? (
                    abierto ? (
                      <PonerAlgo href={nuevoEnDia(day)} vacio="No hay nada puesto." />
                    ) : (
                      <p className="sr-only">No hay nada puesto.</p>
                    )
                  ) : (
                    cortes.map(({ post, targets, media }) => {
                      const dibujo = dibujoDe(targets, media, frias, post.videosLiberados)
                      const estado = estadoCorto(dibujo.coccion, dibujo.sellos)
                      // Las redes que fallaron y esperan otro intento, una vez cada una. Su marca
                      // ya va en ámbar; acá basta un renglón que las nombre, y el motivo de cada
                      // una sale al pasar el mouse (el `title` de la tarjeta) y en el editor.
                      // Antes iba el motivo entero por destino, y una tarjeta con un reintento
                      // quedaba el doble de alta que las demás.
                      const reintentos = [
                        ...new Set(targets.filter((t) => t.status === 'scheduled' && motivoDestino(t)).map((t) => networkLabel(t.network))),
                      ]
                      return (
                        <Link
                          key={post.id}
                          href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
                          // Sin prefetch: una semana cargada son decenas de tarjetas, y cada
                          // una pedía su editor por adelantado (ver `docs/pendientes.md`).
                          prefetch={false}
                          // El detalle por red, con el motivo si lo hay, sin entrar al editor.
                          title={targets
                            .map((t) => {
                              const motivo = motivoDestino(t)
                              return `${nombreDestino(t)}: ${etiquetaDestino(t)}${motivo ? ` — ${motivo}` : ''}`
                            })
                            .join(' · ')}
                          data-recien={post.id === recien ? '' : undefined}
                          className={cn(
                            'block rounded-md border bg-acero-900 p-1.5 transition-transform hover:-translate-y-0.5',
                            CLASE_BORDE[bordeDe(dibujo.coccion, dibujo.sellos)],
                            post.id === recien && 'recien',
                          )}
                        >
                          {/*
                            El humo y la banderita se asoman por arriba del dibujo: el margen
                            les deja lugar sin tapar la tarjeta de encima.
                          */}
                          <Corte
                            {...dibujo}
                            className={cn(
                              (dibujo.sellos.includes('saliendo') || dibujo.coccion === 'parcial' || dibujo.coccion === 'quemada') &&
                                'mt-2.5',
                            )}
                          />
                          <p className="mt-1.5 font-titulo text-[0.6rem] tracking-[0.12em] text-fg">
                            {hourLabel(post.scheduledAt, zone)}
                            {estado ? <span className={CLASE_ESTADO[dibujo.coccion]}> · {estado}</span> : null}
                          </p>
                          <span className="mt-1 block">
                            <Redes targets={targets} sellos={dibujo.sellos} />
                          </span>
                          <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-fg">
                            {post.caption || '(sin texto)'}
                          </p>
                          {reintentos.length > 0 ? (
                            <p className="mt-1 line-clamp-2 text-[0.68rem] leading-snug text-caution">
                              Reintentando · {reintentos.join(', ')}
                            </p>
                          ) : null}
                          {/*
                            Lo que el dibujo dice, en palabras: el formato y la cocción. Los
                            destinos ya no van aquí: `Redes` trae su propio `sr-only`, y
                            decirlos dos veces sería un lector de pantalla repitiéndose.
                          */}
                          <span className="sr-only">
                            {NOMBRE_FORMATO[dibujo.formato]} · {NOMBRE_COCCION[dibujo.coccion]}
                          </span>
                        </Link>
                      )
                    })
                  )}
                  {/*
                    Los borradores, después de los cortes y con borde punteado: no están en la
                    parrilla todavía, solo apartados para ese día. Abren el compositor, no el
                    editor.
                  */}
                  {enBorrador.map((b) => (
                    <Link
                      key={b.id}
                      href={b.href}
                      scroll={false}
                      prefetch={false}
                      className="block rounded-md border border-dashed border-white/30 p-2 transition-colors hover:border-white/60"
                    >
                      <p className="font-titulo text-[0.6rem] tracking-[0.12em] text-fg-muted">
                        Borrador · {hourLabel(b.fecha, zone)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-fg-muted">
                        {b.texto || '(sin texto)'}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </DesplazarAHoy>
    </div>
  )
}
