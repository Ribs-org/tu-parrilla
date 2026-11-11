import { Brasa } from '@/components/esqueleto'
import { cn } from '@/lib/utils'

/**
 * La forma de «Lo que trajo» mientras carga (`lo-que-trajo.tsx`): el título y cinco burbujas
 * tibias. La usan la carga de toda la pantalla (`loading.tsx`) y la de la fila sola, que llega
 * después del calendario. Casi siempre hay cortes en la semana, así que el calendario no salta
 * cuando la fila llega; si no los hay, la forma se va. Sin nada de servidor: la carga de la
 * pantalla es de cliente.
 */
export function FilaCargando({ className }: { className?: string }) {
  return (
    <div className={cn('chapa rounded-xl px-4 pt-3.5 pb-2', className)}>
      <p className="font-titulo text-[0.95rem] font-semibold uppercase tracking-[0.08em]">Lo que trajo</p>
      <div className="mt-1 flex gap-1 overflow-hidden pt-3 pb-2" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex w-[4.5rem] shrink-0 flex-col items-center py-1">
            <Brasa orden={i} className="h-16 w-16 rounded-full" />
            <span className="mt-3 h-[1.05rem]" />
          </div>
        ))}
      </div>
    </div>
  )
}
