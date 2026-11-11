import Link from 'next/link'
import { Corte } from '@/components/corte'
import { DeNocheYDeDia } from '@/components/de-noche-y-de-dia'
import { Llamita } from '@/components/llamita'
import { hitoMasAlto, hitosDeLosCortes, porCelebrar } from '@/lib/hitos'
import { filaDeLoQueTrajo } from '@/lib/lo-que-trajo'
import {
  VER_EL_CORTE,
  altoDeLaLlama,
  circulito,
  diaDeLaBurbuja,
  etiquetaDeLaBurbuja,
  fraseDeLaRacha,
  tituloDelHito,
  totalDe,
  umbralCorto,
} from '@/lib/lo-que-trajo-frases'
import { leerRacha } from '@/lib/racha'
import { dayKey } from '@/lib/schedule-week'
import { cn } from '@/lib/utils'
import { CelebracionDeHitos } from './celebracion'
import { dibujoDe } from './dibujo'

/**
 * «Lo que trajo», en La Parrilla del panel: lo mismo que la app del teléfono pone arriba de su
 * agenda (`docs/superpowers/specs/2026-11-10-lo-que-trajo-design.md`, «En el panel»). La racha al
 * lado del título y, debajo, una burbuja por corte que salió en los últimos siete días, del más
 * nuevo al más viejo, con su circulito de lo nuevo y su llamita del hito más alto. Tocar una abre
 * su detalle en el panel lateral (`?corte=<id>`, `detalle-del-corte.tsx`).
 *
 * Carga aparte, detrás de un `<Suspense>` en la página: son unas diez consultas más, y el
 * calendario no las espera. No obedece el filtro por red, como «Se quemó». Sin cortes en la semana
 * no existe. Si algo falla, tampoco: es lo que menos falta hace de la pantalla, y no la tumba.
 *
 * `abierto`, el corte cuyo detalle está abierto: su burbuja va sin circulito, porque mirarlo ya lo
 * puso en cero. `celebrar`, si toca celebrar los hitos: no con un panel lateral abierto, que la
 * celebración taparía a mitad de escribir.
 */
export async function LoQueTrajo({
  ownerId,
  zona,
  frias,
  abierto,
  celebrar,
  hrefDelCorte,
}: {
  ownerId: string
  zona: string
  frias: ReadonlySet<string>
  abierto: string | null
  celebrar: boolean
  hrefDelCorte: (id: string) => string
}) {
  const ahora = new Date()
  let datos
  try {
    const cortes = await filaDeLoQueTrajo(ownerId, ahora)
    const hitos = await hitosDeLosCortes(
      ownerId,
      cortes.map((c) => c.corte.post.id),
    )
    const racha = await leerRacha(ownerId, ahora, zona)
    const celebraciones = celebrar ? await porCelebrar(ownerId, ahora) : []
    datos = { cortes, hitos, racha, celebraciones }
  } catch (error) {
    console.error('[lo-que-trajo] No se pudo leer la fila del panel:', String(error).slice(0, 300))
    return null
  }

  const { cortes, hitos, racha, celebraciones } = datos
  const hoy = dayKey(ahora, zona)
  const deNoche = fraseDeLaRacha(racha, 'noche')
  const deDia = fraseDeLaRacha(racha, 'dia')

  return (
    <>
      {cortes.length > 0 ? (
        <section aria-labelledby="lo-que-trajo" className="chapa rounded-xl px-4 pt-3.5 pb-2">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
            <h2 id="lo-que-trajo" className="font-titulo text-[0.95rem] font-semibold uppercase tracking-[0.08em]">
              Lo que trajo
            </h2>
            {deNoche && deDia ? (
              <p className="flex items-end gap-2 text-sm text-fg">
                <Llamita style={{ height: altoDeLaLlama(racha.dias) * 0.75 }} />
                <span>
                  <DeNocheYDeDia noche={deNoche.titulo} dia={deDia.titulo} />
                </span>
              </p>
            ) : null}
          </div>
          {deNoche?.aviso ? <p className="mt-1 text-right text-[0.78rem] text-caution">{deNoche.aviso}</p> : null}
          {/* La fila se desliza de lado; la página no. El aire de arriba y de abajo es para el
              circulito y la llamita, que asoman de la burbuja. */}
          <ul className="-mx-4 mt-1 flex gap-1 overflow-x-auto px-3 pt-3 pb-2">
            {cortes.map(({ corte, nuevo }) => {
              const id = corte.post.id
              const total = id === abierto ? 0 : totalDe(nuevo)
              const hito = hitoMasAlto(hitos.get(id))
              const dia = diaDeLaBurbuja(dayKey(corte.post.scheduledAt, zona), hoy)
              return (
                <li key={id} className="shrink-0">
                  <Link
                    href={hrefDelCorte(id)}
                    scroll={false}
                    aria-label={etiquetaDeLaBurbuja(dia, corte.post.caption, total, hito)}
                    className="group flex w-[4.5rem] flex-col items-center rounded-lg py-1 focus-visible:outline-2"
                  >
                    <span
                      className={cn(
                        'relative grid h-16 w-16 place-items-center rounded-full border-[2.5px] bg-acero-900 transition-[filter] group-hover:brightness-110',
                        total > 0 ? 'border-brasa' : 'border-acero-700',
                      )}
                    >
                      <Corte {...dibujoDe(corte.targets, corte.media, frias, corte.post.videosLiberados)} chico className="w-11" />
                      {total > 0 ? (
                        <span className="absolute -top-1.5 -right-2.5 flex h-[1.375rem] min-w-6 items-center justify-center rounded-full border-2 border-acero-950 bg-negative px-1.5 text-[0.68rem] font-bold text-white tabular-nums">
                          {circulito(total)}
                        </span>
                      ) : null}
                      {hito ? (
                        // La llamita del hito, montada sobre el borde de abajo, como el «EN VIVO» de una historia.
                        <span className="absolute -bottom-2.5 flex h-[1.125rem] items-center gap-0.5 rounded-full border border-acero-950 bg-acero-900 px-1.5 text-[0.62rem] font-bold text-fg">
                          <Llamita className="h-[0.7rem]" />
                          {umbralCorto(hito)}
                        </span>
                      ) : null}
                    </span>
                    <span className={cn('mt-3 text-[0.7rem]', total > 0 ? 'text-fg' : 'text-fg-faint')}>{dia}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}

      {celebraciones.length > 0 ? (
        <CelebracionDeHitos
          hitos={celebraciones.map((h) => ({
            id: h.id,
            titulo: { noche: tituloDelHito(h.umbral, 'noche'), dia: tituloDelHito(h.umbral, 'dia') },
            texto: h.corte.post.caption,
            corte: <Corte {...dibujoDe(h.corte.targets, h.corte.media, frias, h.corte.post.videosLiberados)} className="w-36" />,
            verHref: hrefDelCorte(h.corte.post.id),
            ver: VER_EL_CORTE,
          }))}
        />
      ) : null}
    </>
  )
}
