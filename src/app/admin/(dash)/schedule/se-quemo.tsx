import Link from 'next/link'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO } from '@/components/boton'
import { Corte } from '@/components/corte'
import { horaConDia } from '@/lib/fuego'
import type { CorteCargado } from '@/lib/social/publish/cortes'
import { Archivar } from './archivar'
import { arregloDe } from './arreglo'
import { dibujoDe } from './dibujo'
import { nombreDestino } from './etiqueta'
import { ListaQuemados } from './lista-quemados'
import { Redes } from './redes'
import { Reprogramar } from './reprogramar'

/**
 * Lo que se quemó, arriba del calendario: es lo único de La Parrilla que pide una acción
 * sin que nadie la busque. Una fila por destino que falló, del más reciente al más viejo,
 * con el corte en chico —cuál de sus marcas se quemó—, su motivo y, pegados al motivo, el
 * arreglo exacto cuando lo hay («Reconectar», «Cambiar el archivo»; ver `arregloDe`),
 * «Reprogramar» y «Archivar», para lo que ya no pide nada: se volvió a programar aparte, o era
 * una prueba. Sin nada quemado la sección no existe: un «no se quemó nada» sería una fila
 * que hay que leer todos los días para enterarse de que no pasa nada.
 *
 * Esta lista no tiene ventana de fecha, así que puede crecer: parte plegada en una línea —con
 * los cortes quemados en chico, para que se vea cuántos antes de leer el número— y abierta
 * muestra diez y el resto detrás de «Ver más»; se puede apagar una red para mirar las otras
 * (`ListaQuemados`). Las filas se dibujan acá, en el servidor; la lista solo elige cuáles se
 * ven. Los botones van debajo del motivo y no al costado de la fila: al costado quedaban
 * lejos de la frase que explica qué hacer.
 */
export function SeQuemo({
  filas,
  now,
  zone,
  volver,
  frias,
}: {
  filas: Array<{ corte: CorteCargado; destino: CorteCargado['targets'][number] }>
  now: Date
  zone: string
  volver: string
  frias: ReadonlySet<string>
}) {
  if (filas.length === 0) return null
  return (
    <section className="chapa rounded-xl p-4">
      <ListaQuemados
        filas={filas.map(({ corte, destino }) => {
          const dibujo = dibujoDe(corte.targets, corte.media, frias)
          const editor = `/admin/schedule/${corte.post.id}?volver=${encodeURIComponent(volver)}`
          const arreglo = arregloDe(destino.lastError, `${editor}#media`)
          return {
            id: destino.id,
            red: destino.network,
            corte: <Corte {...dibujo} chico className="w-9" />,
            fila: (
              <li key={destino.id} className="flex items-start gap-3 py-2">
                {/* Todas las marcas del corte, para ver que lo demás salió: solo esta se quemó. */}
                <Corte {...dibujo} chico className="mt-1.5 w-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {/* Con el día delante si no es de hoy: esta lista no tiene ventana de fecha y
                        un fallo viejo se leería igual que uno de esta mañana. */}
                    <span className="font-mono text-[0.78rem] text-fg-muted">{horaConDia(corte.post.scheduledAt, now, zone)}</span>
                    <Redes targets={[destino]} />
                    {/* `basis-full` a ancho de teléfono lo baja a su propia línea: es el único
                        trozo que puede encogerse, y compartiendo línea con la hora se estrechaba
                        hasta quince caracteres. */}
                    <Link
                      href={editor}
                      prefetch={false}
                      className="line-clamp-1 min-w-0 basis-full text-[0.85rem] text-fg hover:underline sm:flex-1 sm:basis-auto"
                    >
                      {corte.post.caption || '(sin texto)'}
                    </Link>
                  </div>
                  {/* El motivo, con nuestras palabras —y, en un rechazo de Instagram, también las
                      de Meta; ver `scheduledPostTargets` en `db/schema.ts`—. */}
                  {destino.lastError ? (
                    <p className="mt-0.5 line-clamp-2 text-[0.75rem] text-negative">{destino.lastError}</p>
                  ) : null}
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {arreglo ? (
                      <Link href={arreglo.href} prefetch={false} className={BOTON_CHICO}>
                        {arreglo.texto}
                      </Link>
                    ) : null}
                    <Reprogramar targetId={destino.id} titulo={nombreDestino(destino)} className={BOTON_CHICO_SECUNDARIO} />
                    <Archivar targetId={destino.id} className={BOTON_CHICO_SECUNDARIO} />
                  </div>
                </div>
              </li>
            ),
          }
        })}
      />
    </section>
  )
}
