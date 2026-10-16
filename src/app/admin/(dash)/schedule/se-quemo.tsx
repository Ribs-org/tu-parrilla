import Link from 'next/link'
import { Corte } from '@/components/corte'
import { horaConDia } from '@/lib/fuego'
import type { CorteCargado } from '@/lib/social/publish/cortes'
import { dibujoDe } from './dibujo'
import { nombreDestino } from './etiqueta'
import { Redes } from './redes'
import { Reprogramar } from './reprogramar'

/**
 * Lo que se quemó, arriba del calendario: es lo único de La Parrilla que pide una acción
 * sin que nadie la busque. Una fila por destino que falló, del más reciente al más viejo,
 * con el corte en chico —cuál de sus marcas se quemó—, su motivo y «Reprogramar». Sin nada
 * quemado la sección no existe: un «no se quemó nada» sería una fila que hay que leer todos
 * los días para enterarse de que no pasa nada.
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
      <h2 className="mb-3 font-titulo text-sm font-semibold uppercase tracking-[0.03em] text-negative">Se quemó</h2>
      <ul className="divide-y divide-white/[0.06]">
        {filas.map(({ corte, destino }) => (
          <li key={destino.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            {/* Todas las marcas del corte, para ver que lo demás salió: solo esta se quemó. */}
            <Corte {...dibujoDe(corte.targets, corte.media, frias)} chico className="mt-1.5 w-12 shrink-0" />
            {/* Con el día delante si no es de hoy: esta lista no tiene ventana de fecha y
                un fallo viejo se leería igual que uno de esta mañana. */}
            <span className="font-mono text-[0.8rem] text-fg-muted">{horaConDia(corte.post.scheduledAt, now, zone)}</span>
            <Redes targets={[destino]} />
            {/* `basis-full` a ancho de teléfono lo baja a su propia línea: es el único trozo
                que puede encogerse, y compartiendo línea con la hora se estrechaba hasta
                quince caracteres. */}
            <Link
              href={`/admin/schedule/${corte.post.id}?volver=${encodeURIComponent(volver)}`}
              prefetch={false}
              className="line-clamp-1 min-w-0 basis-full text-[0.85rem] text-fg hover:underline sm:flex-1 sm:basis-auto"
            >
              {corte.post.caption || '(sin texto)'}
            </Link>
            {/* El motivo, una de nuestras frases fijas —`lastError` nunca trae texto de la
                red; ver `scheduledPostTargets` en `db/schema.ts`—. `w-full` lo baja a su
                propia línea, que a 360 px es la única forma de que se lea entero. */}
            {destino.lastError ? <span className="w-full text-[0.78rem] text-negative">{destino.lastError}</span> : null}
            <Reprogramar targetId={destino.id} titulo={nombreDestino(destino)} />
          </li>
        ))}
      </ul>
    </section>
  )
}
