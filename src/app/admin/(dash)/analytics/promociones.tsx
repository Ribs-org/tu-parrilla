import Link from 'next/link'
import { Panel } from '@/components/charts/panel'
import { Icon } from '@/components/icon'
import { networkLabel } from '@/lib/networks'
import { NOMBRE_OBJETIVO, accionesPosibles, etiquetaDeEstado, formatearMonto } from '@/lib/social/promocionar'
import { promocionesDe } from '@/lib/social/promocionar-meta'
import { BotonesPromocion } from './botones-promocion'

const FECHA = (zona: string) => new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', timeZone: zona })

/**
 * Las promociones que el dueño armó desde Tu Parrilla, con cómo van y sus botones. En la pieza,
 * las de esas publicaciones (`postIds`); en «Lo pagado», todas. Sin ninguna, no dibuja nada.
 */
export async function Promociones({
  ownerId,
  zona,
  postIds,
  conEnlace = false,
}: {
  ownerId: string
  zona: string
  postIds?: string[]
  /** En «Lo pagado» cada fila lleva a su pieza; en la pieza ya se está ahí. */
  conEnlace?: boolean
}) {
  const filas = await promocionesDe(ownerId, postIds)
  if (filas.length === 0) return null
  const ahora = new Date()
  const fecha = FECHA(zona)

  return (
    <Panel
      className="mt-3"
      title="Tus promociones desde Tu Parrilla"
      hint="Cómo va cada una, según Meta. Pausar la deja de mostrar sin gastar; detenerla es para siempre. Lo que logran llega a «Lo pagado» con la sincronización diaria."
    >
      <ul className="divide-y divide-velo/[0.06]">
        {filas.map((f) => {
          const estado = etiquetaDeEstado(f.efectivo, f.estado, f.hasta, ahora)
          const presupuesto = `${formatearMonto(f.presupuesto, f.moneda)} ${f.tipoPresupuesto === 'diario' ? 'al día' : 'en total'}`
          const maximo = formatearMonto(f.gastoMaximo, f.moneda)
          return (
            <li key={f.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 max-w-xl">
                <p className="flex items-center gap-1.5 text-[0.85rem]">
                  <Icon name={f.network} className="h-3.5 w-3.5 shrink-0" />
                  {conEnlace ? (
                    <Link prefetch={false} href={`/admin/analytics/publicaciones/${f.postId}`} className="truncate transition-colors hover:text-fg-muted">
                      {f.caption || `?s=${f.campaign}`}
                    </Link>
                  ) : (
                    <span className="truncate">{networkLabel(f.network)}</span>
                  )}
                </p>
                <p className="mt-0.5 text-[0.75rem] text-fg-muted">
                  <span className="font-medium text-fg">{estado}</span> · {NOMBRE_OBJETIVO[f.objetivo]} · {presupuesto} ·
                  hasta {maximo} · {fecha.format(f.desde)} – {fecha.format(f.hasta)}
                </p>
              </div>
              <BotonesPromocion id={f.id} acciones={accionesPosibles(f.estado, f.hasta, ahora)} gastoMaximo={maximo} />
            </li>
          )
        })}
      </ul>
    </Panel>
  )
}
