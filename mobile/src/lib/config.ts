/**
 * El sitio en producción. La app no tiene ambiente de pruebas propio: apunta al
 * mismo backend que el panel, y `EXPO_PUBLIC_API_BASE` existe solo para apuntar a
 * un túnel local mientras se desarrolla.
 *
 * Es el dominio del producto y no `www.vicente-pareja.cl`, que queda como la página
 * personal de Vicente. Los dos sirven la misma API, y la sesión es un token Bearer
 * —no una cookie—, así que pasar de uno a otro no cierra la sesión de nadie.
 */
export const API_BASE = process.env.EXPO_PUBLIC_API_BASE ?? 'https://tu-parrilla.cl'
