import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Corte } from '@/components/corte'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Icon } from '@/components/icon'
import { colorDeRed } from '@/lib/color-de-red'
import { networkLabel } from '@/lib/networks'
import { NOMBRE_COCCION, NOMBRE_FORMATO, calorDelDia } from '@/lib/parrilla'
import { hourLabel } from '@/lib/schedule-week'
import { cn } from '@/lib/utils'
import { FIERRO_FRIO } from '@/lib/vocabulario'
import { CLASE_FILA, PonerAlgo, RotuloCalor } from './calendar'
import { SIN_CUENTA, cortesDelDia, rotuloDelDia, type BorradorDelDia, type Columna, type CorteDelDia } from './dia'
import { dibujoDe } from './dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from './etiqueta'
import { PX_POR_MINUTO, minutoDelDia, rangoDeLaReja } from './horas'
import { RejaDeHoras } from './reja-de-horas'
import { SIGNO } from './redes'
import { estadoDeFila } from './semana'

/** El alto de un bloque: la hora, el texto en un renglón y el corte en chico. */
const ALTO_DE_BLOQUE = 26
/** Cuántos minutos tapa un bloque: los que caen más cerca que eso en una cuenta van lado a lado. */
const DURA = Math.ceil(ALTO_DE_BLOQUE / PX_POR_MINUTO)

/**
 * La vista «Día»: un solo día, en una columna por cuenta y con las horas hacia abajo, como
 * Google Calendar (`RejaDeHoras`). Lo que la semana junta en una columna —todo lo de ese día, a
 * todas las cuentas— acá se separa, y a la misma hora le toca la misma altura en todas las
 * columnas: se ve qué sale a la vez y dónde hay huecos. Lo que ya pasó va rayado, y hoy lo cruza
 * la línea de «ahora».
 *
 * Un post que sale a tres cuentas son tres bloques, cada uno con el corte cocido según **su**
 * destino; los íconos de los otros dos van al final del bloque. Con mucho volumen, el texto va
 * en un renglón y entero al dejar el mouse encima.
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
  sinColumnas = 'No tienes cuentas conectadas, y ese día no hay nada puesto.',
  ahora = new Date(),
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
  /** El post recién programado: sus bloques caen en su columna, encendidos una vez. */
  recien?: string | null
  /** Lo que dice el día sin ninguna columna: con un filtro por red, que esa red no tiene ninguna. */
  sinColumnas?: string
  /** La hora con que se arma la página: la de la línea de «ahora» hasta que el navegador la corre. */
  ahora?: Date
}) {
  // En un día que ya pasó no se programa: ni el «+» ni la invitación a prenderlo.
  const abierto = dia >= hoy
  const calor = calorDelDia(cortesDelDia(columnas))
  const tiempo = dia < hoy ? 'pasado' : dia === hoy ? 'hoy' : 'futuro'
  const rango = rangoDeLaReja(
    columnas.flatMap((c) => [
      ...c.cortes.map((corte) => minutoDelDia(corte.post.scheduledAt, zone)),
      ...c.borradores.map((b) => minutoDelDia(b.fecha, zone)),
    ]),
    DURA,
    tiempo === 'hoy' ? minutoDelDia(ahora, zone) : null,
  )

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
            <RotuloCalor calor={calor} />
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
        <p className="text-sm italic text-fg-muted">{sinColumnas}</p>
      ) : (
        <RejaDeHoras
          rango={rango}
          dura={DURA}
          altoDeBloque={ALTO_DE_BLOQUE}
          anchoMinimo="9.5rem"
          desde={ahora.getTime()}
          zona={zone}
          cabezas={columnas.map((columna) => {
            const nuevo = columna.cuenta?.connected && abierto ? nuevoEnDia(dia, columna.cuenta.id) : null
            return <CabezaDeCuenta key={columna.clave} columna={columna} nuevo={nuevo} />
          })}
          columnas={columnas.map((columna) => {
            const nuevo = columna.cuenta?.connected && abierto ? nuevoEnDia(dia, columna.cuenta.id) : null
            return {
              clave: columna.clave,
              nombre: nombreDeColumna(columna),
              tiempo,
              bloques: [
                ...columna.cortes.map((corte) => ({
                  clave: corte.destino.id,
                  minuto: minutoDelDia(corte.post.scheduledAt, zone),
                  contenido: <BloqueDeDestino corte={corte} zone={zone} volver={volver} frias={frias} recien={recien} />,
                })),
                ...columna.borradores.map((b) => ({
                  clave: `borrador-${b.id}`,
                  minuto: minutoDelDia(b.fecha, zone),
                  contenido: <BloqueDeBorrador borrador={b} zone={zone} />,
                })),
              ].sort((a, b) => a.minuto - b.minuto),
              // Vacía, como una parrilla fría: la invitación si se puede programar, y si no, la
              // frase solo para el lector de pantalla.
              vacia: nuevo ? (
                <PonerAlgo href={nuevo} vacio="Nada para esta cuenta." />
              ) : (
                <p className="sr-only">{abierto ? 'Nada para esta cuenta.' : 'No salió nada en esta cuenta.'}</p>
              ),
            }
          })}
        />
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

/**
 * Lo de arriba de cada columna: el ícono de la red en su color y el usuario, el «+» que abre el
 * compositor con esa cuenta, y en un segundo renglón cuántas tiene y su calor.
 */
function CabezaDeCuenta({ columna, nuevo }: { columna: Columna; nuevo: string | null }) {
  const red = columna.cuenta?.network ?? columna.red
  const cuantas = columna.cortes.length
  return (
    <div className="border-b-2 border-acero-700 pb-1">
      <div className="flex items-center justify-between gap-1.5">
        <p className="flex min-w-0 items-center gap-1.5 text-[0.8rem] text-fg">
          {red ? <Icon name={red} className={cn('h-3.5 w-3.5 shrink-0', colorDeRed(red))} /> : null}
          <span className="truncate">
            {columna.cuenta ? (columna.cuenta.handle ?? networkLabel(columna.cuenta.network)) : nombreDeColumna(columna)}
          </span>
        </p>
        {nuevo ? (
          <Link
            href={nuevo}
            scroll={false}
            className="shrink-0 rounded p-0.5 text-fg-faint transition-colors hover:bg-velo/[0.08] hover:text-fg"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            <span className="sr-only">Programar en {nombreDeColumna(columna)}</span>
          </Link>
        ) : null}
      </div>
      <p className="mt-0.5 flex h-3.5 items-center gap-1.5">
        {columna.clave === SIN_CUENTA ? null : (
          <>
            <span className="font-mono text-[0.66rem] text-fg-muted">
              {cuantas}
              <span className="sr-only"> {cuantas === 1 ? 'publicación' : 'publicaciones'}</span>
            </span>
            <span
              className={cn(
                'font-titulo text-[0.55rem] uppercase tracking-[0.12em]',
                calorDelDia(cuantas) === 'llena' ? 'text-brasa' : 'text-fg-muted',
              )}
            >
              <RotuloCalor calor={calorDelDia(cuantas)} />
            </span>
          </>
        )}
        {columna.cuenta && !columna.cuenta.connected ? (
          <span className="truncate text-[0.66rem] text-fg-faint">reconéctala</span>
        ) : null}
      </p>
    </div>
  )
}

/**
 * Un destino de ese día, a su hora: el corte cocido según este destino solo, la hora, el texto en
 * un renglón, los íconos de las otras redes a las que sale y el signo de cómo le fue. Se ve como
 * una fila de la semana (`CLASE_FILA`): lo que ya salió, hundido; lo quemado, teñido.
 */
function BloqueDeDestino({
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
  const estado = estadoDeFila(dibujo.coccion, dibujo.sellos)
  const sello = dibujo.sellos[0]!
  const motivo = motivoDestino(destino)
  const hora = hourLabel(post.scheduledAt, zone)
  const texto = post.caption || '(sin texto)'
  const tenue = estado === 'servida'
  return (
    <Link
      href={`/admin/schedule/${post.id}?volver=${encodeURIComponent(volver)}`}
      // Sin prefetch, como en la semana: un día cargado son muchos bloques.
      prefetch={false}
      title={[
        `${hora} · ${texto}`,
        `${nombreDestino(destino)}: ${etiquetaDestino(destino)}${sello === 'frio' ? ' — reconéctala' : ''}${motivo ? ` — ${motivo}` : ''}`,
        ...(otros.length > 0 ? [`También en: ${otros.map((o) => `${nombreDestino(o)}: ${etiquetaDestino(o)}`).join(' · ')}`] : []),
      ].join('\n')}
      data-recien={post.id === recien ? '' : undefined}
      className={cn(
        'flex h-full items-center gap-1 overflow-hidden rounded-[4px] border pl-0.5 pr-1 transition-colors',
        CLASE_FILA[estado],
        post.id === recien && 'recien',
      )}
    >
      <Corte {...dibujo} chico className={cn('w-6 shrink-0', tenue && 'opacity-55')} />
      <span className={cn('font-mono text-[0.62rem] tabular-nums', tenue ? 'text-fg-muted' : 'text-fg')}>{hora}</span>
      <span className={cn('min-w-0 flex-1 truncate text-[0.7rem]', tenue ? 'text-fg-muted' : 'text-fg')}>{texto}</span>
      {otros.length > 0 ? (
        <span aria-hidden className="flex shrink-0 items-center gap-0.5">
          {otros.map((o) => (
            <Icon key={o.id} name={o.network} className={cn('h-2.5 w-2.5', colorDeRed(o.network))} />
          ))}
        </span>
      ) : null}
      {SIGNO[sello].signo ? (
        <span aria-hidden className={cn('shrink-0 text-[0.66rem]', SIGNO[sello].color)}>
          {SIGNO[sello].signo}
        </span>
      ) : null}
      {/* Lo que el dibujo y el signo dicen, en palabras. */}
      <span className="sr-only">
        {' · '}
        {NOMBRE_FORMATO[dibujo.formato]} · {NOMBRE_COCCION[dibujo.coccion]} ·{' '}
        {sello === 'frio' ? <DeNocheYDeDia noche={FIERRO_FRIO.noche} dia={FIERRO_FRIO.dia} /> : etiquetaDestino(destino)}
        {motivo ? `: ${motivo}` : ''}
        {otros.length > 0 ? ` · También en ${otros.map((o) => nombreDestino(o)).join(', ')}` : ''}
      </span>
    </Link>
  )
}

/** Un borrador con fecha, a su hora: con borde punteado, porque todavía no está en la parrilla. */
function BloqueDeBorrador({ borrador, zone }: { borrador: BorradorDelDia; zone: string }) {
  const hora = hourLabel(borrador.fecha, zone)
  const texto = borrador.texto || '(sin texto)'
  return (
    <Link
      href={borrador.href}
      scroll={false}
      prefetch={false}
      title={`Borrador · ${hora} · ${texto}`}
      className="flex h-full items-center gap-1 overflow-hidden rounded-[4px] border border-dashed border-velo/30 bg-acero-900 px-1.5 transition-colors hover:border-velo/60"
    >
      <span className="font-titulo text-[0.56rem] uppercase tracking-[0.12em] text-fg-muted">Borrador</span>
      <span className="font-mono text-[0.62rem] text-fg-muted">{hora}</span>
      <span className="min-w-0 flex-1 truncate text-[0.7rem] text-fg-muted">{texto}</span>
    </Link>
  )
}
