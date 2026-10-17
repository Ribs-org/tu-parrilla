'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Brasa, Cargando, Renglon } from '@/components/esqueleto'
import { Encabezado } from '@/components/ui'

/**
 * La carga de La Parrilla, con la forma de lo que viene: la semana, el día por cuenta, la lista
 * o, adentro, el editor de un post. Es de cliente por eso: la vista va en la dirección
 * (`?vista=`), y una carga no recibe `searchParams`. Ver `src/components/esqueleto.tsx`.
 */
export default function Loading() {
  const ruta = usePathname()
  const vista = useSearchParams().get('vista')
  if (ruta !== '/admin/schedule') return <Editor />
  return (
    <>
      <header className="mb-6">
        <Encabezado ruta="/admin/schedule">
          {/* «Subir CSV» y «Nueva publicación», con su alto: en el teléfono bajan bajo el título. */}
          <div className="flex flex-wrap items-center gap-2">
            <Brasa className="h-[2.375rem] w-[6.5rem] rounded-lg" />
            <Brasa orden={1} className="h-[2.375rem] w-[11.5rem] rounded-lg" />
          </div>
        </Encabezado>
      </header>
      <Cargando>
        {/* «Calendario», «Día», «Lista». */}
        <div className="mb-3 flex items-center gap-1.5">
          <Renglon className="h-6 w-[5.5rem] rounded-full" />
          <Renglon orden={1} className="h-6 w-11 rounded-full" />
          <Renglon orden={2} className="h-6 w-[3.25rem] rounded-full" />
        </div>
        {vista === 'lista' ? <Lista /> : vista === 'dia' ? <Dia /> : <Semana />}
      </Cargando>
    </>
  )
}

/** Siete parrillas calentándose, con la misma grilla de la semana de verdad. */
function Semana() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <Renglon className="h-4 w-32" />
        <Renglon orden={1} className="h-4 w-20" />
        <Renglon orden={2} className="h-4 w-32" />
      </div>
      <div className="-mx-1 overflow-hidden px-1">
        <div className="grid min-w-[52rem] grid-cols-7 gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <Renglon orden={i} className="h-2.5 w-12" />
                <Renglon orden={i} className="h-2 w-10" />
              </div>
              <Brasa orden={i} className="grilla h-72 rounded-[3px]" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

/** Una columna por cuenta, como la vista «Día»: en el teléfono, una debajo de otra. */
function Dia() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Renglon className="h-4 w-24" />
        <Renglon orden={1} className="h-4 w-36" />
        <Renglon orden={2} className="h-4 w-24" />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 sm:w-64 sm:shrink-0">
            <div className="flex items-center justify-between gap-2">
              <Renglon orden={i} className="h-3.5 w-28" />
              <Renglon orden={i} className="h-2 w-12" />
            </div>
            <Brasa orden={i} className="grilla h-48 rounded-[3px]" />
          </div>
        ))}
      </div>
    </>
  )
}

/** Las filas de la lista: el corte chico, el texto y la fecha. */
function Lista() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-xl bg-white/[0.03] p-4">
          <Brasa orden={i} className="mt-2 h-7 w-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Renglon orden={i} className="h-3.5 w-full max-w-md" />
            <Renglon orden={i} className="h-2.5 w-36" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * «Editar post»: el título de verdad, la cabecera con el corte y una línea por red, y los
 * campos con su rótulo.
 */
function Editor() {
  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-titulo text-xl font-semibold uppercase tracking-[0.03em]">Editar post</h1>
        <Renglon className="h-4 w-16" />
      </div>
      <Cargando className="space-y-4">
        <div className="chapa mb-5 rounded-xl p-4">
          <div className="flex items-start gap-4">
            <Brasa className="mt-3 h-12 w-24 shrink-0 sm:h-16 sm:w-32" />
            <div className="min-w-0 flex-1 space-y-3 pt-1">
              <Renglon className="h-3.5 w-56 max-w-full" />
              <Renglon orden={1} className="h-3.5 w-44 max-w-full" />
            </div>
          </div>
        </div>
        <div>
          <Renglon orden={1} className="mb-2 h-2.5 w-12" />
          <Brasa orden={1} className="h-[6.5rem] rounded-lg" />
        </div>
        <div>
          <Renglon orden={2} className="mb-2 h-2.5 w-24" />
          <Brasa orden={2} className="h-10 max-w-[16rem] rounded-lg" />
        </div>
        <div>
          <Renglon orden={3} className="mb-2 h-2.5 w-16" />
          <div className="flex flex-wrap gap-3">
            <Renglon orden={3} className="h-5 w-36" />
            <Renglon orden={4} className="h-5 w-36" />
          </div>
        </div>
      </Cargando>
    </div>
  )
}
