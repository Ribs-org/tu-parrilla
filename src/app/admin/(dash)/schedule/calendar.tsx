import Image from 'next/image'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { dayLabel, dayKey, groupByDay, hourLabel, weekDays, weekLabel } from '@/lib/schedule-week'
import { NOMBRE_COCCION, calorDelDia, coccionDe, type Coccion } from '@/lib/parrilla'
import { cn } from '@/lib/utils'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { Redes } from './redes'

/** Un borrador con fecha, ya con su enlace: el calendario solo lo pone en su día. */
export type BorradorEnCalendario = { id: string; href: string; fecha: Date; texto: string }

type Item = {
  post: ScheduledPost
  targets: Array<ScheduledPostTarget & { handle: string | null }>
  media: Array<{ blobUrl: string; mediaType: string }>
}

/** Lo que dice la grilla de cada día, arriba a la derecha. */
const ROTULO_CALOR = {
  apagada: 'Apagada',
  prendida: 'Prendida',
  llena: 'Parrilla llena',
} as const

const CLASE_COCCION: Record<Coccion, string> = {
  cruda: 'corte-cruda',
  sellada: 'corte-sellada',
  punto: 'corte-punto',
  quemada: 'corte-quemada',
}

/**
 * La semana de lunes a domingo: la vista con que abre La Parrilla.
 *
 * Además de los cortes, cada día que no pasó trae un «+» que abre el compositor con ese día
 * puesto (`nuevoEnDia`), y los borradores con fecha aparecen en el suyo con borde punteado.
 * Los borradores no cuentan para el calor del día: todavía no van a salir.
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
        de su scroll y estiraban la página entera al ancho de la semana en el teléfono.
      */}
      <div className="relative -mx-1 overflow-x-auto px-1">
        <div className="grid min-w-[52rem] grid-cols-7 gap-2">
          {days.map((day, index) => {
            const cortes = grouped.get(day) ?? []
            const enBorrador = borradoresPorDia.get(day) ?? []
            const calor = calorDelDia(cortes.length)
            // En un día que ya pasó no se programa: ni el «+» ni la invitación a prenderlo.
            const abierto = day >= today
            return (
              <div key={day} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-2">
                  <p
                    className={cn(
                      'font-titulo text-[0.65rem] uppercase tracking-[0.14em]',
                      day === today ? 'text-fg' : 'text-fg-faint',
                    )}
                  >
                    {dayLabel(day, index)}
                  </p>
                  <span
                    // `text-fg-muted` y no `text-fg-faint`: a 0.55rem el tenue da 3.56:1
                    // sobre el panel y este rótulo es copy nuevo, así que entra al
                    // mínimo de 4.5:1 que el spec puso para esta entrega.
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
                      <Link
                        href={nuevoEnDia(day)}
                        scroll={false}
                        className="text-center text-[0.72rem] italic text-fg-muted underline-offset-2 hover:text-fg hover:underline"
                      >
                        No hay nada puesto. Préndela.
                      </Link>
                    ) : (
                      <p className="text-center text-[0.72rem] italic text-fg-muted">No hay nada puesto.</p>
                    )
                  ) : (
                    cortes.map(({ post, targets, media }) => {
                      // Misma precedencia que antes, solo que ahora vestida: un fallo en
                      // cualquier destino gana, todos publicados es «a punto», algo en
                      // curso es «sellada», el resto queda cruda.
                      const coccion = coccionDe(targets.map((t) => t.status))
                      // Los destinos que fallaron y esperan otro intento. La cocción no los
                      // distingue de uno que nunca se intentó —los dos quedan crudos—, así
                      // que el motivo va escrito en la tarjeta.
                      const reintentos = targets.filter((t) => t.status === 'scheduled' && motivoDestino(t))
                      return (
                        <Link
                          key={post.id}
                          href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
                          // Sin prefetch: una semana cargada son decenas de tarjetas, y cada
                          // una pedía su editor por adelantado (ver `docs/pendientes.md`).
                          prefetch={false}
                          // El detalle por red, que antes vivía en el `title` de cada
                          // punto de color. La cocción dice que algo falló; esto dice
                          // cuál, sin tener que entrar al editor.
                          title={targets
                            .map((t) => {
                              const motivo = motivoDestino(t)
                              return `${nombreDestino(t)}: ${etiquetaDestino(t)}${motivo ? ` — ${motivo}` : ''}`
                            })
                            .join(' · ')}
                          className={cn(
                            'corte block p-2 transition-transform hover:-translate-y-0.5',
                            CLASE_COCCION[coccion],
                          )}
                        >
                          {/*
                            A opacidad plena y no al 70%: sobre la cruda, que es la
                            cocción más clara, un 70% cae a 3.12:1 y no llega al mínimo.
                            La jerarquía la hace el tamaño, no el desteñido.
                          */}
                          <p className="font-titulo text-[0.6rem] tracking-[0.12em] text-fg">
                            {hourLabel(post.scheduledAt, zone)}
                            {coccion === 'sellada' ? (
                              // En `text-fg` y no en brasa: la brasa sobre la carne
                              // sellada da 2.15:1. Lo que llama la atención acá es el
                              // humo, no el color.
                              <span className="humo ml-1.5 inline-block">saliendo</span>
                            ) : null}
                          </p>
                          <Redes targets={targets} />
                          {media[0] ? (
                            <span className="corte-media mt-1 block">
                              {media[0].mediaType === 'image' ? (
                                <Image
                                  src={media[0].blobUrl}
                                  alt=""
                                  width={120}
                                  height={64}
                                  unoptimized
                                  className="h-16 w-full rounded object-cover"
                                />
                              ) : post.coverUrl ? (
                                // The designed cover IS the video's preview when there is one.
                                <Image
                                  src={post.coverUrl}
                                  alt=""
                                  width={120}
                                  height={64}
                                  unoptimized
                                  className="h-16 w-full rounded object-cover"
                                />
                              ) : (
                                // No controls (the whole card is a link); preload="metadata"
                                // paints the first frame without pulling the file.
                                <video
                                  src={media[0].blobUrl}
                                  preload="metadata"
                                  muted
                                  playsInline
                                  className="h-16 w-full rounded bg-black object-cover"
                                />
                              )}
                            </span>
                          ) : null}
                          <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-fg">
                            {post.caption || '(sin texto)'}
                          </p>
                          {reintentos.map((t) => (
                            <p key={t.id} className="mt-1 text-[0.68rem] leading-snug text-fg">
                              Reintentando {nombreDestino(t)}: {motivoDestino(t)}
                            </p>
                          ))}
                          {/*
                            El estado en palabras, una sola vez. El `title` no sirve para
                            esto: sobre un enlace con contenido es descripción y no
                            nombre, así que un lector de pantalla puede no leerlo. Los
                            destinos ya no van aquí: `Redes` trae su propio `sr-only`, y
                            decirlos dos veces sería un lector de pantalla repitiéndose.
                          */}
                          <span className="sr-only">{NOMBRE_COCCION[coccion]}</span>
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
      </div>
    </div>
  )
}
