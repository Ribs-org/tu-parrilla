import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Corte } from '@/components/corte'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Icon } from '@/components/icon'
import type { ScheduledPost, ScheduledPostTarget } from '@/db/schema'
import { colorDeRed, fondoDeRed } from '@/lib/color-de-red'
import { dayLabel, dayKey, groupByDay, hourLabel, weekDays, weekLabel } from '@/lib/schedule-week'
import { networkLabel } from '@/lib/networks'
import { NOMBRE_COCCION, NOMBRE_FORMATO, calorDelDia, type Calor, type Coccion } from '@/lib/parrilla'
import type { Tema } from '@/lib/tema'
import { cn } from '@/lib/utils'
import { ROTULO_CALOR, servidos } from '@/lib/vocabulario'
import { DesplazarAHoy } from './desplazar-a-hoy'
import { dibujoDe, type Borde, type Dibujo } from './dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { FilasConAhora } from './linea-de-ahora'
import { Redes } from './redes'
import { estadoDeFila, mezclaDeRedes, resumenDelDia, type EstadoDeFila } from './semana'

/** Un borrador con fecha, ya con su enlace: el calendario solo lo pone en su día. */
export type BorradorEnCalendario = { id: string; href: string; fecha: Date; texto: string }

type Item = {
  post: ScheduledPost
  targets: Array<ScheduledPostTarget & { handle: string | null }>
  media: Array<{ blobUrl: string; mediaType: string }>
}

/**
 * Lo que dice la grilla de cada día, arriba a la derecha: su calor, en los dos modos
 * (`ROTULO_CALOR`, en el vocabulario). También la vista «Día» y la portada.
 */
export function RotuloCalor({ calor }: { calor: Calor }) {
  return <DeNocheYDeDia noche={ROTULO_CALOR.noche[calor]} dia={ROTULO_CALOR.dia[calor]} />
}

/**
 * La tarjeta de un corte: chapa, y no carne. La carne es el dibujo de arriba; la tarjeta solo
 * cambia de borde cuando necesita algo del dueño (`bordeDe`, en `dibujo.ts`). La comparten la
 * vista «Día» y la portada.
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
 * La fila de un corte en la semana, según cómo va (`estadoDeFila`). Lo que ya salió deja la
 * chapa: sin borde y hundida (`.fila-servida`), con el dibujo apagado, porque ya no está en la
 * parrilla. Lo que viene sigue en la chapa. Lo quemado lleva el tinte rojo (`.fila-quemada`), y
 * lo que pide atención, el borde ámbar de siempre. Los dos fondos van en globals.css porque
 * cambian distinto de noche y de día, y una utilidad de fondo los pisaría.
 */
export const CLASE_FILA: Record<EstadoDeFila, string> = {
  servida: 'fila-servida border-transparent hover:border-acero-700',
  'por-salir': 'border-acero-700 bg-acero-900 hover:border-acero-600',
  saliendo: 'border-brasa/60 bg-acero-900',
  atencion: 'border-caution/75 bg-acero-900',
  quemada: 'fila-quemada border-negative/80',
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
 * Cada corte es una fila de una línea —el dibujo en chico, la hora, sus redes con su signo— y
 * no una tarjeta: con decenas al día, la tarjeta hacía de cada día una columna de miles de
 * píxeles (ver `docs/superpowers/specs/2026-10-20-parrilla-en-el-tiempo-design.md`). El texto
 * va al pasar el mouse y en el editor. Bajo el nombre de cada día, la mezcla de redes y cuánto
 * salió, cuánto se quemó y cuánto viene; en el de hoy, la línea de «ahora» entre lo que ya tuvo
 * su hora y lo que viene, y se corre sola.
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
  ahora = new Date(),
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
  /** El post recién programado: su fila cae en su día, encendida una vez. */
  recien?: string | null
  /** La hora con que se arma la página: la de la línea de «ahora» hasta que el navegador la corre. */
  ahora?: Date
}) {
  const days = weekDays(monday)
  const today = dayKey(ahora, zone)
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
      <CambiarSemana monday={monday} prevHref={prevHref} nextHref={nextHref} />
      {/*
        `relative` no es decorativo: los textos `sr-only` de adentro (el «+» de cada día) se
        posicionan en absoluto, y sin un ancestro posicionado dentro de esta caja se escapaban
        de su scroll y estiraban la página entera al ancho de la semana en el teléfono. Es
        también lo que deja a `DesplazarAHoy` medir dónde está hoy.
      */}
      <DesplazarAHoy className="relative -mx-1 overflow-x-auto px-1">
        {/* 60rem: una fila de una red cabe entera al lado de la hora; en el teléfono la semana se
            desliza de lado, como siempre. */}
        <div className="grid min-w-[60rem] grid-cols-7 gap-2">
          {days.map((day, index) => {
            const cortes = (grouped.get(day) ?? []).map((item) => {
              const dibujo = dibujoDe(item.targets, item.media, frias, item.post.videosLiberados)
              return { ...item, dibujo, estado: estadoDeFila(dibujo.coccion, dibujo.sellos) }
            })
            const enBorrador = borradoresPorDia.get(day) ?? []
            const calor = calorDelDia(cortes.length)
            // En un día que ya pasó no se programa: ni el «+» ni la invitación a prenderlo.
            const abierto = day >= today
            const filas = cortes.map((corte) => (
              <FilaDeCorte key={corte.post.id} corte={corte} zone={zone} volver={volver} recien={recien} />
            ))
            return (
              <div key={day} className="flex flex-col gap-1.5" data-hoy={day === today ? '' : undefined}>
                <CabezaDeDia
                  dia={day}
                  indice={index}
                  hoy={today}
                  cortes={cortes}
                  verDia={verDia(day)}
                  nuevo={abierto ? nuevoEnDia(day) : null}
                />

                <div
                  className={cn(
                    'grilla flex min-h-[4.5rem] flex-col gap-1 p-1.5',
                    calor === 'apagada' && 'grilla-apagada justify-center',
                    calor === 'prendida' && 'grilla-prendida',
                    calor === 'llena' && 'grilla-llena',
                    // El día de hoy se marca con el borde y no con el fondo: el fondo ya
                    // lo está usando el fuego para contar el volumen.
                    day === today && 'ring-1 ring-inset ring-velo/25',
                  )}
                >
                  {cortes.length === 0 && enBorrador.length === 0 ? (
                    abierto ? (
                      <PonerAlgo href={nuevoEnDia(day)} vacio="No hay nada puesto." />
                    ) : (
                      <p className="sr-only">No hay nada puesto.</p>
                    )
                  ) : day === today && cortes.length > 0 ? (
                    <FilasConAhora horas={cortes.map((c) => c.post.scheduledAt.getTime())} desde={ahora.getTime()} zona={zone}>
                      {filas}
                    </FilasConAhora>
                  ) : (
                    filas
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
                      title={b.texto || '(sin texto)'}
                      className="flex items-center gap-1.5 rounded-[4px] border border-dashed border-velo/30 px-1.5 py-1 transition-colors hover:border-velo/60"
                    >
                      <span className="font-titulo text-[0.58rem] uppercase tracking-[0.12em] text-fg-muted">Borrador</span>
                      <span className="font-mono text-[0.66rem] text-fg-muted">{hourLabel(b.fecha, zone)}</span>
                      <span className="sr-only">: {b.texto || '(sin texto)'}</span>
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

/** «Semana anterior», el rango de la semana y «Semana siguiente»: la semana en filas y «Por hora». */
export function CambiarSemana({ monday, prevHref, nextHref }: { monday: string; prevHref: string; nextHref: string }) {
  return (
    <div className="mb-3 flex items-center justify-between text-sm">
      <Link href={prevHref} className="inline-flex items-center gap-1 text-fg-faint transition-colors hover:text-fg">
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Semana anterior
      </Link>
      <span className="font-mono text-[0.8rem] text-fg-muted">{weekLabel(monday)}</span>
      <Link href={nextHref} className="inline-flex items-center gap-1 text-fg-faint transition-colors hover:text-fg">
        Semana siguiente
        <ChevronRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  )
}

/**
 * Lo de arriba de cada día, en la semana en filas y en «Por hora»: su nombre —que abre ese día,
 * cuenta por cuenta—, su calor, el «+» si todavía no pasó, la mezcla de redes y el renglón de
 * cuánto salió y cuánto viene.
 */
export function CabezaDeDia({
  dia,
  indice,
  hoy,
  cortes,
  verDia,
  nuevo,
}: {
  dia: string
  /** La posición en la semana (0 = lunes): `dayLabel` la pide. */
  indice: number
  hoy: string
  cortes: ReadonlyArray<{ targets: ReadonlyArray<{ network: string }>; dibujo: Dibujo }>
  verDia: string
  /** El compositor en ese día; null si el día ya pasó. */
  nuevo: string | null
}) {
  const calor = calorDelDia(cortes.length)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Link
          href={verDia}
          className={cn(
            'font-titulo text-[0.65rem] uppercase tracking-[0.14em] underline-offset-2 transition-colors hover:text-fg hover:underline',
            dia === hoy ? 'text-fg' : 'text-fg-faint',
          )}
        >
          {dayLabel(dia, indice)}
          <span className="sr-only">: ver por cuenta</span>
        </Link>
        <span
          // En el secundario y no en el tenue: a 0.55rem es el texto más chico de la pantalla, y
          // el secundario es el que más le sobra sobre el mínimo de 4.5:1 (5,85 contra 5,03 sobre
          // la chapa).
          className={cn('font-titulo text-[0.55rem] uppercase tracking-[0.12em]', calor === 'llena' ? 'text-brasa' : 'text-fg-muted')}
        >
          <RotuloCalor calor={calor} />
        </span>
        {nuevo ? (
          <Link
            href={nuevo}
            scroll={false}
            className="-my-1 rounded p-0.5 text-fg-faint transition-colors hover:bg-velo/[0.08] hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Programar el {dayLabel(dia, indice)}</span>
          </Link>
        ) : null}
      </div>
      <MezclaDelDia items={cortes} />
      <ResumenDelDia cocciones={cortes.map((c) => c.dibujo.coccion)} />
    </div>
  )
}

/**
 * Un corte en la semana: una fila de una línea. El texto no cabe en una columna de un séptimo
 * de pantalla; va en el `title`, con cómo le fue a cada red y su motivo, y en el editor, que
 * abre la fila.
 */
function FilaDeCorte({
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
  return (
    <Link
      href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
      // Sin prefetch: una semana cargada son cientos de filas, y cada una pedía su editor por
      // adelantado (ver `docs/pendientes.md`).
      prefetch={false}
      title={[
        `${hora} · ${texto}`,
        ...targets.map((t) => {
          const motivo = motivoDestino(t)
          return `${nombreDestino(t)}: ${etiquetaDestino(t)}${motivo ? ` — ${motivo}` : ''}`
        }),
      ].join('\n')}
      data-recien={post.id === recien ? '' : undefined}
      // `flex-wrap`: en el teléfono la columna de un día mide poco más de cien píxeles, y las redes
      // de un corte que sale a dos, o la de uno quemado, no caben al lado de la hora. Bajan a un
      // segundo renglón en vez de taparla.
      className={cn(
        'flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-[4px] border py-0.5 pl-0.5 pr-1 transition-colors',
        CLASE_FILA[estado],
        post.id === recien && 'recien',
      )}
    >
      <Corte {...dibujo} chico className={cn('w-[1.85rem] shrink-0', estado === 'servida' && 'opacity-55')} />
      <span className={cn('font-mono text-[0.66rem] tabular-nums', estado === 'servida' ? 'text-fg-muted' : 'text-fg')}>{hora}</span>
      {estado === 'servida' ? (
        // Salió en todas: los íconos solos y un ✓ para todos. Un chip con su ✓ por red hacía que
        // lo ya servido se viera más cargado que lo que viene, y es lo que menos hay que mirar.
        <span className="ml-auto flex shrink-0 items-center gap-1">
          {targets.map((t) => (
            <Icon key={t.id} name={t.network} className={cn('h-3 w-3 shrink-0', colorDeRed(t.network))} />
          ))}
          <span aria-hidden className="text-[0.66rem] text-positive">
            ✓
          </span>
          <span className="sr-only">{targets.map((t) => `${nombreDestino(t)}: ${etiquetaDestino(t)}`).join(', ')}</span>
        </span>
      ) : (
        <span className="ml-auto flex shrink-0 justify-end">
          <Redes targets={targets} sellos={dibujo.sellos} />
        </span>
      )}
      {/* Lo que el dibujo dice, en palabras, y el texto, que a la vista no cabe. Los destinos ya
          los dice `Redes` en su propio `sr-only`. */}
      <span className="sr-only">
        {NOMBRE_FORMATO[dibujo.formato]} · {NOMBRE_COCCION[dibujo.coccion]} · {texto}
      </span>
    </Link>
  )
}

/**
 * A qué red va lo del día: una barra fina con un tramo por red, del largo de sus destinos, en
 * su color (`fondoDeRed`). Sin nada, la barra vacía, para que los días sigan alineados.
 */
export function MezclaDelDia({ items }: { items: ReadonlyArray<{ targets: ReadonlyArray<{ network: string }> }> }) {
  const mezcla = mezclaDeRedes(items)
  const total = mezcla.reduce((suma, m) => suma + m.destinos, 0)
  const enPalabras = mezcla.map((m) => `${networkLabel(m.red)} ${m.destinos}`)
  return (
    <span
      className="relative flex h-1 overflow-hidden rounded-full bg-acero-700"
      title={total > 0 ? enPalabras.join(' · ') : undefined}
    >
      {mezcla.map((m) => (
        <span key={m.red} className={fondoDeRed(m.red)} style={{ width: `${(m.destinos / total) * 100}%` }} />
      ))}
      {total > 0 ? <span className="sr-only">A qué red va: {enPalabras.join(', ')}.</span> : null}
    </span>
  )
}

/**
 * Cuánto salió, cuánto se quemó y cuánto viene, bajo el nombre del día, con los signos de los
 * chips: «42 ✓ · 2 ✕», «30 ✓ · 14 por salir», «44 por salir». Un renglón siempre, aunque esté
 * vacío: si no, la grilla de ese día bajaría y dejaría de alinearse con la del lado.
 */
export function ResumenDelDia({ cocciones }: { cocciones: readonly Coccion[] }) {
  const { servidos: salieron, fallaron, porSalir } = resumenDelDia(cocciones)
  const enPalabras = (tema: Tema) =>
    [
      salieron > 0 ? servidos(salieron, tema) : null,
      fallaron > 0 ? (fallaron === 1 ? '1 falló' : `${fallaron} fallaron`) : null,
      porSalir > 0 ? `${porSalir} por salir` : null,
    ]
      .filter(Boolean)
      .join(', ')
  const partes = [
    salieron > 0 ? <span key="s" className="text-positive">{salieron} ✓</span> : null,
    fallaron > 0 ? <span key="f" className="text-negative">{fallaron} ✕</span> : null,
    porSalir > 0 ? <span key="p">{porSalir} por salir</span> : null,
  ].filter(Boolean)
  return (
    <p className="h-3.5 truncate text-[0.66rem] leading-[0.875rem] tabular-nums text-fg-muted">
      {partes.length > 0 ? (
        <>
          <span aria-hidden>
            {partes.map((parte, i) => (
              <span key={i}>
                {i > 0 ? ' · ' : null}
                {parte}
              </span>
            ))}
          </span>
          <span className="sr-only">
            <DeNocheYDeDia noche={enPalabras('noche')} dia={enPalabras('dia')} />
          </span>
        </>
      ) : null}
    </p>
  )
}
