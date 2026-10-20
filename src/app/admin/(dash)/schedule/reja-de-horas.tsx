import type { CSSProperties, ReactNode } from 'react'
import { DesplazarAHoy } from './desplazar-a-hoy'
import { PX_POR_MINUTO, carriles } from './horas'
import { CanalDeHoras, CapaDeAhora } from './linea-de-ahora'

/** Un bloque de la reja: lo que se dibuja (un enlace que llena su caja) y a qué minuto cae. */
export type BloqueDeLaReja = { clave: string; minuto: number; contenido: ReactNode }

export type ColumnaDeLaReja = {
  clave: string
  /** De qué es la columna, para el lector de pantalla: una cuenta, o un día. */
  nombre: string
  bloques: BloqueDeLaReja[]
  /** Lo que va en una columna sin nada: la invitación a poner algo, o una frase solo para el lector de pantalla. */
  vacia?: ReactNode
  /** Si es de un día que ya pasó entero (rayada), de hoy (rayada hasta ahora, con la línea) o de lo que viene. */
  tiempo: 'pasado' | 'hoy' | 'futuro'
}

/**
 * La reja de horas, como Google Calendar: las horas hacia abajo en un canal a la izquierda, una
 * columna por cuenta («Día») o por día («Por hora»), y cada bloque a la altura de su hora. Lo
 * que ya pasó va rayado; en la columna de hoy, la raya llega hasta ahora y ahí cruza la línea
 * de «ahora», que se corre sola (`CapaDeAhora`). Los bloques que se pisan van lado a lado
 * (`carriles`).
 *
 * En el teléfono la reja se desliza de lado, con el canal de las horas pegado a la izquierda,
 * y abre corrida hasta la columna marcada con `data-hoy`, como la semana. Las rayas de cada hora
 * son el fondo de cada columna (`.reja-horas`, en globals.css), no una línea por hora.
 */
export function RejaDeHoras({
  columnas,
  cabezas,
  rango,
  dura,
  altoDeBloque,
  anchoMinimo,
  desde,
  zona,
  hoy,
}: {
  columnas: ColumnaDeLaReja[]
  /** Lo que va arriba de cada columna, en el mismo orden. */
  cabezas: ReactNode[]
  rango: { desde: number; hasta: number }
  /** Cuántos minutos ocupa un bloque: los que se pisan en ese lapso van lado a lado. */
  dura: number
  altoDeBloque: number
  /** El ancho mínimo de una columna, en CSS: más angosta, la reja se desliza de lado. */
  anchoMinimo: string
  /** La hora con que se armó la página, en milisegundos: la de «ahora» hasta que el navegador la corre. */
  desde: number
  zona: string
  /** La clave de la columna de hoy, si está: la reja abre corrida hasta ella en el teléfono. */
  hoy?: string | null
}) {
  const px = PX_POR_MINUTO
  const alto = (rango.hasta - rango.desde) * px
  const plantilla = `3.25rem repeat(${columnas.length}, minmax(${anchoMinimo}, 1fr))`
  const hayHoy = columnas.some((c) => c.tiempo === 'hoy')
  return (
    <DesplazarAHoy className="relative -mx-1 overflow-x-auto px-1 pb-1" margen={72}>
      <div style={{ minWidth: `calc(3.25rem + ${columnas.length} * ${anchoMinimo})` }}>
        <div className="mb-1.5 grid items-end" style={{ gridTemplateColumns: plantilla }}>
          <div className="sticky left-0 z-[5] self-stretch bg-acero-950" />
          {cabezas.map((cabeza, i) => (
            <div key={columnas[i]!.clave} className="min-w-0 px-1.5">
              {cabeza}
            </div>
          ))}
        </div>
        {/* `overflow-clip` y no `overflow-hidden`: el segundo vuelve a esta caja la que se
            desliza, y el canal de las horas dejaría de quedarse pegado a la izquierda. */}
        <div className="relative grid overflow-clip rounded-lg border border-acero-700 bg-acero-900" style={{ gridTemplateColumns: plantilla }}>
          {/* El canal de las horas: pegado a la izquierda cuando la reja se desliza de lado. */}
          <div aria-hidden className="sticky left-0 z-[5] bg-acero-950" style={{ height: alto }}>
            <CanalDeHoras desde={desde} zona={zona} rango={rango} px={px} conAhora={hayHoy} />
          </div>
          {columnas.map((columna) => {
            const lugares = carriles(
              columna.bloques.map((b) => b.minuto),
              dura,
            )
            return (
              <section
                key={columna.clave}
                aria-label={columna.nombre}
                data-hoy={columna.clave === hoy ? '' : undefined}
                className="columna-por-hora reja-horas relative border-l border-acero-700"
                style={{ height: alto, '--hora': `${60 * px}px` } as CSSProperties}
              >
                {columna.tiempo === 'pasado' ? (
                  <div aria-hidden className="pasado-rayado pointer-events-none absolute inset-0 z-[1]" />
                ) : null}
                {columna.tiempo === 'hoy' ? <CapaDeAhora desde={desde} zona={zona} rango={rango} px={px} /> : null}
                {columna.bloques.map((bloque, i) => {
                  const { carril, de } = lugares[i]!
                  return (
                    <div
                      key={bloque.clave}
                      className="absolute z-[2]"
                      style={{
                        top: (bloque.minuto - rango.desde) * px,
                        height: altoDeBloque,
                        left: `calc(${(carril / de) * 100}% + 2px)`,
                        width: `calc(${100 / de}% - 4px)`,
                      }}
                    >
                      {bloque.contenido}
                    </div>
                  )
                })}
                {columna.bloques.length === 0 && columna.vacia ? (
                  <div className="absolute inset-x-0 top-2 z-[2] flex justify-center">{columna.vacia}</div>
                ) : null}
              </section>
            )
          })}
        </div>
      </div>
    </DesplazarAHoy>
  )
}
