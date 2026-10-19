import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Corte } from '@/components/corte'
import { Icon } from '@/components/icon'
import { networkLabel } from '@/lib/networks'
import { NOMBRE_COCCION, NOMBRE_FORMATO, calorDelDia } from '@/lib/parrilla'
import { hourLabel } from '@/lib/schedule-week'
import { cn } from '@/lib/utils'
import { CLASE_BORDE, CLASE_ESTADO, PonerAlgo, ROTULO_CALOR } from './calendar'
import { SIN_CUENTA, cortesDelDia, rotuloDelDia, type Columna, type CorteDelDia } from './dia'
import { bordeDe, dibujoDe, estadoCorto } from './dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { Redes } from './redes'

/**
 * La vista «Día»: un solo día, en una columna por cuenta. Lo que la semana junta en una
 * casilla —todo lo de ese día, a todas las cuentas— acá se separa, y cada columna tiene su
 * propio fuego: cuántas veces sale una misma cuenta en un día es lo que la semana no deja ver.
 *
 * Un post que sale a tres cuentas son tres tarjetas, cada una con el corte cocido según **su**
 * destino y una sola marca, la suya; los otros dos van abajo, en «También en». En el teléfono
 * las columnas van una debajo de otra.
 */
export function VistaDia({
  dia,
  hoy,
  columnas,
  zone,
  volver,
  prevHref,
  nextHref,
  hoyHref,
  nuevoEnDia,
  frias,
  recien = null,
}: {
  dia: string
  hoy: string
  columnas: Columna[]
  zone: string
  volver: string
  prevHref: string
  nextHref: string
  hoyHref: string
  /** El compositor en ese día; con una cuenta, con esa cuenta marcada. */
  nuevoEnDia: (dia: string, cuenta: string | null) => string
  /** Las cuentas con el fierro frío: lo programado ahí lleva la marca fría. */
  frias: ReadonlySet<string>
  /** El post recién programado: sus tarjetas caen en su columna, encendidas una vez. */
  recien?: string | null
}) {
  // En un día que ya pasó no se programa: ni el «+» ni la invitación a prenderlo.
  const abierto = dia >= hoy
  const calor = calorDelDia(cortesDelDia(columnas))

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2 text-sm">
        <Link href={prevHref} className="inline-flex shrink-0 items-center gap-1 text-fg-faint transition-colors hover:text-fg">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {/* En el teléfono no cabe entero al lado del día: queda «Anterior». */}
          <span className="hidden sm:inline">Día anterior</span>
          <span className="sm:hidden">Anterior</span>
        </Link>
        <span className="flex flex-wrap items-center justify-center gap-x-2 text-center">
          <span className="font-mono text-[0.8rem] text-fg">{rotuloDelDia(dia, hoy)}</span>
          <span
            className={cn(
              'font-titulo text-[0.55rem] uppercase tracking-[0.12em]',
              calor === 'llena' ? 'text-brasa' : 'text-fg-muted',
            )}
          >
            {ROTULO_CALOR[calor]}
          </span>
          {dia === hoy ? null : (
            <Link href={hoyHref} className="font-mono text-[0.68rem] text-fg-faint underline-offset-2 hover:text-fg hover:underline">
              Ir a hoy
            </Link>
          )}
        </span>
        <Link href={nextHref} className="inline-flex shrink-0 items-center gap-1 text-fg-faint transition-colors hover:text-fg">
          <span className="hidden sm:inline">Día siguiente</span>
          <span className="sm:hidden">Siguiente</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {columnas.length === 0 ? (
        <p className="text-sm italic text-fg-muted">No tienes cuentas conectadas, y ese día no hay nada puesto.</p>
      ) : (
        <div className="relative -mx-1 overflow-x-auto px-1 pb-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {columnas.map((columna) => (
              <ColumnaDeCuenta
                key={columna.clave}
                columna={columna}
                abierto={abierto}
                zone={zone}
                volver={volver}
                frias={frias}
                recien={recien}
                nuevo={columna.cuenta?.connected && abierto ? nuevoEnDia(dia, columna.cuenta.id) : null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** El nombre que encabeza una columna, en palabras: también es lo que lee el lector de pantalla. */
function nombreDeColumna(columna: Columna): string {
  if (columna.cuenta) return nombreDestino(columna.cuenta)
  if (columna.red) return `${networkLabel(columna.red)} · cuenta que ya no está`
  return 'Sin cuenta elegida'
}

function ColumnaDeCuenta({
  columna,
  abierto,
  zone,
  volver,
  frias,
  recien,
  nuevo,
}: {
  columna: Columna
  abierto: boolean
  zone: string
  volver: string
  frias: ReadonlySet<string>
  recien: string | null
  /** El compositor con esta cuenta marcada; null si no se puede programar en ella ese día. */
  nuevo: string | null
}) {
  const calor = calorDelDia(columna.cortes.length)
  const red = columna.cuenta?.network ?? columna.red
  const vacia = columna.cortes.length === 0 && columna.borradores.length === 0

  return (
    <section aria-label={nombreDeColumna(columna)} className="flex flex-col gap-2 sm:w-64 sm:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 text-[0.8rem] text-fg">
          {red ? <Icon name={red} className="h-3.5 w-3.5 shrink-0" /> : null}
          <span className="truncate">
            {columna.cuenta ? (columna.cuenta.handle ?? networkLabel(columna.cuenta.network)) : nombreDeColumna(columna)}
          </span>
          {columna.cuenta && !columna.cuenta.connected ? (
            <span className="shrink-0 text-[0.68rem] text-fg-faint">reconéctala</span>
          ) : null}
        </p>
        <span className="flex shrink-0 items-center gap-1.5">
          {columna.clave === SIN_CUENTA ? null : (
            <span
              className={cn(
                'font-titulo text-[0.55rem] uppercase tracking-[0.12em]',
                calor === 'llena' ? 'text-brasa' : 'text-fg-muted',
              )}
            >
              {ROTULO_CALOR[calor]}
            </span>
          )}
          {nuevo ? (
            <Link
              href={nuevo}
              scroll={false}
              className="rounded p-0.5 text-fg-faint transition-colors hover:bg-white/[0.08] hover:text-fg"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Programar en {nombreDeColumna(columna)}</span>
            </Link>
          ) : null}
        </span>
      </div>

      <div
        className={cn(
          'grilla flex min-h-[4.5rem] flex-col gap-2 p-2',
          calor === 'apagada' && 'grilla-apagada justify-center',
          calor === 'prendida' && 'grilla-prendida',
          calor === 'llena' && 'grilla-llena',
        )}
      >
        {/* Vacía es una parrilla fría, como en la semana: la frase, solo para el lector de pantalla. */}
        {vacia ? (
          nuevo ? (
            <PonerAlgo href={nuevo} vacio="Nada para esta cuenta." />
          ) : (
            <p className="sr-only">{abierto ? 'Nada para esta cuenta.' : 'No salió nada en esta cuenta.'}</p>
          )
        ) : null}
        {columna.cortes.map((corte) => (
          <TarjetaDeDestino key={corte.destino.id} corte={corte} zone={zone} volver={volver} frias={frias} recien={recien} />
        ))}
        {/* Los borradores, después de los cortes y con borde punteado, como en la semana. */}
        {columna.borradores.map((b) => (
          <Link
            key={b.id}
            href={b.href}
            scroll={false}
            prefetch={false}
            className="block rounded-md border border-dashed border-white/30 p-2 transition-colors hover:border-white/60"
          >
            <p className="font-titulo text-[0.6rem] tracking-[0.12em] text-fg-muted">Borrador · {hourLabel(b.fecha, zone)}</p>
            <p className="mt-1 line-clamp-2 text-[0.75rem] leading-snug text-fg-muted">{b.texto || '(sin texto)'}</p>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Un destino de ese día: el corte cocido según este destino solo, con su única marca, y al
 * lado la hora, el texto y cómo le fue en palabras.
 */
function TarjetaDeDestino({
  corte,
  zone,
  volver,
  frias,
  recien,
}: {
  corte: CorteDelDia
  zone: string
  volver: string
  frias: ReadonlySet<string>
  recien: string | null
}) {
  const { post, destino, otros, media } = corte
  const dibujo = dibujoDe([destino], media, frias, post.videosLiberados)
  const deLosOtros = dibujoDe(otros, media, frias).sellos
  const estado = estadoCorto(dibujo.coccion, dibujo.sellos)
  const motivo = motivoDestino(destino)
  return (
    <Link
      href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
      // Sin prefetch, como en la semana: un día cargado son muchas tarjetas.
      prefetch={false}
      data-recien={post.id === recien ? '' : undefined}
      className={cn(
        'flex gap-2 rounded-md border bg-acero-900 p-2 transition-transform hover:-translate-y-0.5',
        CLASE_BORDE[bordeDe(dibujo.coccion, dibujo.sellos)],
        post.id === recien && 'recien',
      )}
    >
      {/* El humo y la banderita se asoman por arriba: el margen les deja lugar. */}
      <Corte
        {...dibujo}
        className={cn(
          'w-20 shrink-0',
          (dibujo.sellos.includes('saliendo') || dibujo.coccion === 'quemada') && 'mt-2.5',
        )}
      />
      <span className="block min-w-0 flex-1">
        <span className="block font-titulo text-[0.6rem] tracking-[0.12em] text-fg">
          {hourLabel(post.scheduledAt, zone)}
          {estado ? <span className={CLASE_ESTADO[dibujo.coccion]}> · {estado}</span> : null}
        </span>
        <span className="mt-1 line-clamp-3 block text-[0.75rem] leading-snug text-fg">{post.caption || '(sin texto)'}</span>
        <span className="mt-1 block text-[0.68rem] leading-snug text-fg">
          {dibujo.sellos[0] === 'frio' ? 'Su fierro está frío: reconéctala' : etiquetaDestino(destino)}
          {motivo ? `: ${motivo}` : ''}
        </span>
        {otros.length > 0 ? (
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.68rem] text-fg">
            También en <Redes targets={otros} sellos={deLosOtros} />
          </span>
        ) : null}
      </span>
      <span className="sr-only">
        {NOMBRE_FORMATO[dibujo.formato]} · {NOMBRE_COCCION[dibujo.coccion]}
      </span>
    </Link>
  )
}
