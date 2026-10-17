'use client'

import { usePathname } from 'next/navigation'
import { Brasa, Cargando, TituloEnCarga } from '@/components/esqueleto'
import { Encabezado } from '@/components/ui'
import { PANTALLAS } from '@/lib/vocabulario'

/**
 * La carga de las pantallas que no tienen una con su forma: La Vitrina, Los Maestros, Tu
 * Cuenta y las de adentro (un perfil, elegir las cuentas al conectar). Lleva el título de
 * verdad cuando la ruta es la de una pantalla del vocabulario —de ahí que sea de cliente: una
 * carga no sabe a qué ruta va—, y debajo dos paneles tibios, que es lo que esas pantallas
 * tienen en común. Ver `src/components/esqueleto.tsx`.
 */
export function CargaGeneral() {
  const ruta = usePathname()
  return (
    <>
      <header className="mb-6">{PANTALLAS.some((p) => p.ruta === ruta) ? <Encabezado ruta={ruta} /> : <TituloEnCarga />}</header>
      <Cargando className="grid gap-4">
        <Brasa className="h-40" />
        <Brasa orden={2} className="h-64" />
      </Cargando>
    </>
  )
}
