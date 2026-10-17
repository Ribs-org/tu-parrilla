import { CargaGeneral } from './carga-general'

/**
 * Dentro del grupo `(dash)` este archivo envuelve en `<Suspense>` a todas las páginas del
 * panel. Las que tienen una carga con su forma —La Parrilla, La Mesa, Los Números y Los
 * Fierros— la traen en su carpeta y pisan esta; esta queda para las demás.
 */
export default function Loading() {
  return <CargaGeneral />
}
