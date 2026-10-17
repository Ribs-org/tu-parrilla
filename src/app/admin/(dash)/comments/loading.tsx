import { Brasa, Cargando, Renglon } from '@/components/esqueleto'
import { Encabezado } from '@/components/ui'

/**
 * La carga de La Mesa: el título de verdad, el renglón de cuántos esperan respuesta, las
 * instrucciones del modelo, los filtros y los comentarios agrupados por publicación. Ver
 * `src/components/esqueleto.tsx`.
 */
export default function Loading() {
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/comments" />
        <Renglon className="mt-2 h-4 w-60 max-w-full" />
      </header>
      <Cargando>
        <Brasa className="mb-6 h-40" />
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {['w-16', 'w-20', 'w-[4.5rem]', 'w-14'].map((ancho, i) => (
            <Renglon key={`estado-${i}`} orden={i} className={`h-6 rounded-full ${ancho}`} />
          ))}
          <span className="mx-1 text-fg-faint" aria-hidden>
            ·
          </span>
          {['w-14', 'w-[4.5rem]', 'w-[4.5rem]', 'w-16', 'w-16'].map((ancho, i) => (
            <Renglon key={`red-${i}`} orden={i + 4} className={`h-6 rounded-full ${ancho}`} />
          ))}
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }, (_, grupo) => (
            <div key={grupo} className="space-y-3">
              {/* La publicación: la miniatura, la red y el texto. */}
              <div className="flex items-start gap-3">
                <Brasa orden={grupo * 3} className="h-12 w-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-2 pt-0.5">
                  <Renglon orden={grupo * 3} className="h-2.5 w-32" />
                  <Renglon orden={grupo * 3} className="h-3.5 w-full max-w-sm" />
                </div>
              </div>
              {/* Lo que te dijeron, con el lugar de tu respuesta. */}
              {Array.from({ length: 2 }, (_, i) => (
                <div key={i} className="chapa space-y-2 rounded-xl p-4">
                  <Renglon orden={grupo * 3 + i + 1} className="h-3 w-40" />
                  <Renglon orden={grupo * 3 + i + 1} className="h-3.5 w-full max-w-lg" />
                  <Brasa orden={grupo * 3 + i + 1} className="mt-3 h-[4.75rem] rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Cargando>
    </>
  )
}
