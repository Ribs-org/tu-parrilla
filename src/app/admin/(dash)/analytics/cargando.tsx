import { PanelSkeleton } from '@/components/charts/panel'
import { StatTileSkeleton } from '@/components/charts/stat-tile'
import { Brasa, Cargando, Renglon } from '@/components/esqueleto'

/**
 * Una mitad del tablero mientras sus consultas viajan: el título, dos cifras y un panel. La
 * usan la pantalla, para cada mitad que se transmite aparte, y su carga entera. `orden` corre
 * el pulso, para que la segunda mitad se caliente después de la primera.
 */
export function SeccionCargando({ orden = 0 }: { orden?: number }) {
  return (
    <Cargando className="grid grid-cols-1 gap-3">
      <Renglon orden={orden} className="h-10 w-64 max-w-full" />
      <div className="grid grid-cols-2 gap-3">
        <StatTileSkeleton orden={orden + 1} />
        <StatTileSkeleton orden={orden + 2} />
      </div>
      <PanelSkeleton orden={orden + 3} />
    </Cargando>
  )
}

/**
 * Las páginas de adentro de Los Números —Tus publicaciones, Comparar por atributo, Tu mejor
 * 10 % y el detalle de un post—: el enlace de vuelta, el título, su bajada, el filtro y filas.
 * El título no se sabe de antemano en todas, así que va en renglones.
 */
export function SubpaginaCargando() {
  return (
    <>
      <header className="mb-4" aria-hidden>
        <Renglon className="h-4 w-28" />
        <Renglon orden={1} className="mt-3 h-8 w-72 max-w-[80%]" />
        <Renglon orden={2} className="mt-1.5 h-4 w-full max-w-2xl" />
      </header>
      <Cargando className="space-y-3">
        <Brasa className="h-9 w-[19rem] max-w-full" />
        <div className="chapa overflow-hidden rounded-xl">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-acero-700 px-4 py-3 last:border-0">
              <Brasa orden={i} className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1 space-y-2">
                <Renglon orden={i} className="h-3.5 w-3/4" />
                <Renglon orden={i} className="h-2.5 w-1/3" />
              </div>
              <Renglon orden={i} className="h-3.5 w-12 shrink-0" />
            </div>
          ))}
        </div>
      </Cargando>
    </>
  )
}
