import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { Corte } from '@/components/corte'
import { Icon } from '@/components/icon'
import { Llamita } from '@/components/llamita'
import { GroupLabel } from '@/components/ui'
import { colorDeRed } from '@/lib/color-de-red'
import { hitosDeLosCortes } from '@/lib/hitos'
import { CORTE_NO_ESTA, leerCorte, seguidoresDe } from '@/lib/lo-que-trajo'
import {
  cifrasDeUnaRed,
  fraseDelNuevo,
  renglonDelHito,
  seguidoresDeUnaRed,
  tituloDelNuevo,
  totalDe,
  type Momento,
} from '@/lib/lo-que-trajo-frases'
import { sinMetricasDerivadas } from '@/lib/social/politica-youtube'
import { dayKey, diaYHora, hourLabel } from '@/lib/schedule-week'
import { cn, formatNumber } from '@/lib/utils'
import { dibujoDe } from './dibujo'
import { nombreDestino } from './etiqueta'
import { PanelDelCorte } from './panel-del-corte'

/**
 * «Lo que trajo» de un corte, en el panel lateral de La Parrilla (`?corte=<id>`): lo mismo que el
 * detalle de la app del teléfono (`mobile/src/app/corte/[id].tsx`). Lo nuevo desde que se miró,
 * los hitos que pasó, lo que lleva cada red tal como la red lo da y las visitas a tu página; y,
 * propio del panel, el enlace a la pieza de Los Números de cada red y al editor del post.
 *
 * Se lee aquí, en el servidor, y la marca la deja después el navegador (`PanelDelCorte`), con la
 * pestaña a la vista: así lo nuevo alcanza a mostrarse, y un `prefetch` del enlace no lo pone en
 * cero sin que nadie lo vea. Un corte que no es del dueño, no existe o no salió dice
 * `CORTE_NO_ESTA`, sin distinguir.
 */
export async function DetalleDelCorte({
  ownerId,
  postId,
  zona,
  frias,
  cerrarHref,
  volver,
}: {
  ownerId: string
  postId: string
  zona: string
  frias: ReadonlySet<string>
  cerrarHref: string
  volver: string
}) {
  const leido = await leerCorte(ownerId, postId)
  if (!leido) {
    return (
      <PanelDelCorte cerrarHref={cerrarHref} postId={null}>
        <p className="px-5 py-8 text-center text-sm text-fg-faint">{CORTE_NO_ESTA}</p>
      </PanelDelCorte>
    )
  }

  // En serie, como el resto de La Parrilla (ver el comentario de la página).
  const seguidores = await seguidoresDe(ownerId, leido.servidos)
  const hitos = (await hitosDeLosCortes(ownerId, [leido.corte.post.id])).get(leido.corte.post.id) ?? []
  const { corte, nuevo, marca, servidos, visitas } = leido
  const visto: Momento | null = marca ? { dia: dayKey(marca.vistoEn, zona), hora: hourLabel(marca.vistoEn, zona) } : null
  const hayNuevo = totalDe(nuevo) > 0

  return (
    <PanelDelCorte cerrarHref={cerrarHref} postId={corte.post.id}>
      <div className="space-y-6 px-5 py-5">
        <div className="flex items-start gap-4">
          <Corte {...dibujoDe(corte.targets, corte.media, frias, corte.post.videosLiberados)} className="w-28 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.72rem] text-fg-faint">{diaYHora(corte.post.scheduledAt, zona)}</p>
            <p className="mt-1 line-clamp-6 text-sm whitespace-pre-line text-fg">{corte.post.caption || '(sin texto)'}</p>
            <Link
              href={`/admin/schedule/${corte.post.id}?volver=${encodeURIComponent(volver)}`}
              className="mt-2 inline-block text-[0.78rem] text-brasa hover:underline"
            >
              Abrir el post →
            </Link>
          </div>
        </div>

        <section>
          <GroupLabel>{tituloDelNuevo(visto)}</GroupLabel>
          <p className={cn(hayNuevo ? 'text-lg font-semibold text-brasa' : 'text-sm text-fg-muted')}>{fraseDelNuevo(nuevo, visto)}</p>
        </section>

        {hitos.length > 0 ? (
          <section>
            <GroupLabel>Los hitos</GroupLabel>
            {/* Del más alto al más bajo: el que manda, arriba. */}
            <ul className="space-y-1.5">
              {[...hitos].reverse().map((h) => (
                <li key={h.umbral} className="flex items-center gap-2 text-sm">
                  <Llamita className="h-4" />
                  {renglonDelHito(h.umbral, h.alcanzadoEn ? dayKey(h.alcanzadoEn, zona) : null)}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section>
          <GroupLabel>Lo que lleva en cada red</GroupLabel>
          <ul className="space-y-2">
            {servidos.map((s) => {
              const cifras = cifrasDeUnaRed(s.lectura)
              const mas = seguidoresDeUnaRed(s.red, seguidores.get(s.id) ?? null)
              return (
                <li key={s.id} className="chapa rounded-lg px-3.5 py-2.5">
                  <p className="flex items-center gap-1.5 text-sm font-medium">
                    <Icon name={s.red} className={cn('h-3.5 w-3.5 shrink-0', colorDeRed(s.red))} />
                    {nombreDestino({ network: s.red, handle: s.handle })}
                  </p>
                  {cifras ? (
                    <p className="mt-0.5 text-[0.82rem] text-fg">{cifras}</p>
                  ) : (
                    <p className="mt-0.5 text-[0.82rem] text-fg-muted">Todavía sin números de esta red: llegan con la próxima lectura.</p>
                  )}
                  {mas ? <p className="mt-0.5 text-[0.82rem] font-semibold text-positive">{mas}</p> : null}
                  {sinMetricasDerivadas(s.red) && cifras ? <p className="mt-0.5 text-[0.7rem] text-fg-faint">Según YouTube.</p> : null}
                  {s.socialPostId ? (
                    <Link
                      href={`/admin/analytics/publicaciones/${s.socialPostId}`}
                      className="mt-1 inline-flex items-center gap-0.5 text-[0.75rem] text-brasa hover:underline"
                    >
                      Ver en Los Números
                      <ArrowUpRight className="h-3 w-3" aria-hidden />
                    </Link>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </section>

        <section>
          <GroupLabel>Visitas a tu página</GroupLabel>
          <p className="text-xl font-semibold tabular-nums">{formatNumber(visitas)}</p>
          <p className="text-[0.75rem] text-fg-faint">Las cuenta Tu Parrilla: las que llegaron por el enlace de estas publicaciones.</p>
        </section>
      </div>
    </PanelDelCorte>
  )
}
