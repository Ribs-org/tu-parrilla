'use client'

import { usePathname } from 'next/navigation'
import { Cargando, Renglon, retraso } from '@/components/esqueleto'
import { Encabezado } from '@/components/ui'
import { CargaGeneral } from '../carga-general'

/**
 * La carga de Los Fierros: el título de verdad y la chapa con las redes, cada una con sus
 * cuentas, y cada cuenta con su fierro calentándose. Elegir las cuentas al conectar vive
 * adentro y carga con la general: esta carga la envuelve también, y de ahí que sea de
 * cliente. Ver `src/components/esqueleto.tsx`.
 */
export default function Loading() {
  if (usePathname() !== '/admin/accounts') return <CargaGeneral />
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/accounts" />
      </header>
      <Cargando className="max-w-3xl space-y-4">
        <div className="chapa divide-y divide-acero-700 rounded-xl">
          {[2, 1, 1].map((cuentas, red) => (
            <div key={red} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <Renglon orden={red} className="h-4 w-4 rounded-full" />
                <Renglon orden={red} className="h-3.5 w-24" />
                <Renglon orden={red} className="ml-auto h-3 w-24" />
              </div>
              <div className="mt-2 space-y-1">
                {Array.from({ length: cuentas }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 px-1 py-1.5">
                    {/* El fierro, que se calienta: brasa a media luz, con el mismo pulso. */}
                    <span aria-hidden className="tibio h-1 w-6 shrink-0 rounded-[2px] bg-brasa/70" style={retraso(red + i)} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Renglon orden={red + i} className="h-3.5 w-40 max-w-full" />
                      <Renglon orden={red + i} className="h-2.5 w-56 max-w-full" />
                    </div>
                    <Renglon orden={red + i} className="h-3 w-16 shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {/* «Sin conectar». */}
        <div className="chapa rounded-xl px-4 py-3">
          <Renglon className="h-2.5 w-24" />
          <div className="mt-3 space-y-3">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Renglon orden={i + 3} className="h-4 w-4 rounded-full" />
                <Renglon orden={i + 3} className="h-3.5 w-20" />
                <Renglon orden={i + 3} className="ml-auto h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </Cargando>
    </>
  )
}
