import { retraso } from '@/components/esqueleto'
import { cn } from '@/lib/utils'

/**
 * Un panel de Los Números: título, bajada, una acción opcional a la derecha y su contenido.
 *
 * En el teléfono la acción baja debajo del título: al lado, con `shrink-0`, se quedaba con el
 * ancho y el título se apretaba a una palabra por renglón («Lo que más creció» con sus tres
 * enlaces).
 */
export function Panel({
  title,
  hint,
  action,
  className,
  children,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn('chapa rounded-xl p-5', className)}>
      <header className="mb-4 flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 grow basis-full sm:basis-0">
          <h2 className="font-titulo text-[0.95rem] font-semibold uppercase tracking-[0.08em]">{title}</h2>
          {hint ? <p className="mt-0.5 text-[0.78rem] text-fg-faint">{hint}</p> : null}
        </div>
        {action ? <div className="shrink-0 sm:ml-auto">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-8 text-center text-sm text-fg-faint">{children}</p>
}

/**
 * El hueco que deja un `Panel` mientras sus consultas viajan. Misma `.chapa` y
 * mismas medidas que el de verdad, para que nada salte cuando llega el contenido, con
 * el pulso tibio de toda carga del panel (`src/components/esqueleto.tsx`): el lugar del
 * gráfico, en brasa. `orden` corre el pulso respecto de los de al lado.
 */
export function PanelSkeleton({ className, orden = 0 }: { className?: string; orden?: number }) {
  return (
    <div className={cn('chapa tibio rounded-xl p-5', className)} style={retraso(orden)} aria-hidden>
      <div className="mb-4">
        <div className="h-[1.4rem] w-40 max-w-[60%] rounded bg-velo/[0.06]" />
        <div className="mt-0.5 h-[1.15rem] w-72 max-w-full rounded bg-velo/[0.035]" />
      </div>
      <div className="brasa-tibia h-40 rounded-xl" />
    </div>
  )
}
