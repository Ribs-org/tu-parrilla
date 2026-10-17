'use client'

import { usePathname } from 'next/navigation'
import { Brasa } from '@/components/esqueleto'
import { Encabezado } from '@/components/ui'
import { BajadaDeLosNumeros } from './cabeza'
import { SeccionCargando, SubpaginaCargando } from './cargando'

/**
 * La carga de Los Números. El tablero carga con su forma: el título y su bajada de verdad, el
 * período y sus dos mitades. Las páginas de adentro cargan con la suya, que son filas: esta
 * carga las envuelve también, y de ahí que sea de cliente, para saber cuál viene. Ver
 * `src/components/esqueleto.tsx`.
 */
export default function Loading() {
  if (usePathname() !== '/admin/analytics') return <SubpaginaCargando />
  return (
    <>
      <header className="mb-4">
        <Encabezado ruta="/admin/analytics" />
        <BajadaDeLosNumeros />
      </header>
      {/* El período: «Hoy», «7 días», «30 días», «90 días», «Todo». */}
      <Brasa className="h-9 w-[19rem] max-w-full" />
      <div className="mt-6 space-y-10">
        <SeccionCargando />
        <SeccionCargando orden={4} />
      </div>
    </>
  )
}
