import Link from 'next/link'
import { BOTON_CHICO, BOTON_CHICO_SECUNDARIO } from '@/components/boton'
import { Corte } from '@/components/corte'
import type { TargetStatus } from '@/db/schema'
import { cn } from '@/lib/utils'
import { RECONECTAR_EN, arregloDe } from '../arreglo'
import type { Dibujo } from '../dibujo'
import { etiquetaDestino, motivoDestino, nombreDestino } from '../etiqueta'
import { Redes } from '../redes'
import { Reprogramar } from '../reprogramar'

type Destino = {
  id: string
  accountId: string
  network: string
  handle: string | null
  status: TargetStatus
  lastError: string | null
  opciones: unknown
  externalId: string | null
}

/** El color del estado en palabras, por la marca del destino. */
const CLASE_ESTADO: Record<string, string> = {
  servido: 'text-positive',
  quemado: 'text-negative',
  reintento: 'text-caution',
  bandeja: 'text-caution',
  frio: 'text-caution',
}

/**
 * Cómo va el post en cada red, arriba del editor: su corte con todas las marcas y, al lado, una
 * línea por destino con su chip, su estado en palabras, el motivo si falló o reintenta, y lo
 * que se puede hacer —el arreglo exacto cuando lo hay (`arregloDe`) y «Reprogramar» si se
 * quemó, o «Reconectar» si su fierro está frío—.
 *
 * Antes el editor solo decía «Ya publicado en …» en verde: de un post que salió en Instagram y
 * se quemó en TikTok contaba lo que salió y callaba lo que falló, y había que volver al
 * calendario para saber por qué. «Cambiar el archivo» lleva a los archivos de este mismo
 * formulario (`#media`): guardar vuelve a poner en la parrilla el destino quemado.
 */
export function DestinosDelPost({ dibujo, destinos }: { dibujo: Dibujo; destinos: Destino[] }) {
  const enCurso = destinos.some((d) => d.status === 'publishing')
  const algoSalio = destinos.some((d) => d.status === 'published')
  return (
    <section aria-label="Cómo va en cada red" className="chapa mb-5 rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* El margen deja asomar el humo o la banderita sin taparlos. */}
        <Corte {...dibujo} className="mt-3 w-24 shrink-0 sm:w-32" />
        <ul className="min-w-0 flex-1 divide-y divide-white/[0.06]">
          {destinos.map((d, i) => {
            const sello = dibujo.sellos[i]!
            const motivo = motivoDestino(d)
            const arreglo = d.status === 'failed' ? arregloDe(motivo, '#media') : null
            return (
              <li key={d.id} className="py-2 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Redes targets={[d]} sellos={[sello]} />
                  <span className="text-sm text-fg">{nombreDestino(d)}</span>
                  <span className={cn('text-sm', CLASE_ESTADO[sello] ?? 'text-fg-muted')}>
                    · {sello === 'frio' ? 'Su fierro está frío: reconéctala' : etiquetaDestino(d)}
                  </span>
                </div>
                {motivo ? (
                  <p className={cn('mt-0.5 text-[0.8rem]', d.status === 'failed' ? 'text-negative' : 'text-caution')}>{motivo}</p>
                ) : null}
                {d.status === 'failed' || sello === 'frio' ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {arreglo ? (
                      <Link href={arreglo.href} className={BOTON_CHICO}>
                        {arreglo.texto}
                      </Link>
                    ) : sello === 'frio' ? (
                      <Link href={RECONECTAR_EN} className={BOTON_CHICO}>
                        Reconectar
                      </Link>
                    ) : null}
                    {d.status === 'failed' ? (
                      <Reprogramar targetId={d.id} titulo={nombreDestino(d)} className={BOTON_CHICO_SECUNDARIO} />
                    ) : null}
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      </div>
      {enCurso ? (
        <p className="mt-3 text-sm text-caution">Hay una publicación en curso. Vuelve en un minuto.</p>
      ) : algoSalio ? (
        <p className="mt-3 text-[0.8rem] text-fg-muted">Los cambios no tocan lo publicado.</p>
      ) : null}
    </section>
  )
}
