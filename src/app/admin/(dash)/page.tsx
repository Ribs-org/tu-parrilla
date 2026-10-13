import { redirect } from 'next/navigation'

/**
 * `/admin` es la puerta del panel —ahí llega quien entra con su código— y lleva a La
 * Parrilla, que es la entrada. Antes había acá una pantalla propia, El Fuego, con lo que
 * pedía una acción hoy; casi todo repetía el calendario, y lo que no —lo que se quemó, la
 * primera red por conectar, el pie de ayer— vive ahora arriba y abajo de la parrilla.
 */
export default function PanelPage(): never {
  redirect('/admin/schedule')
}
