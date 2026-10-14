import { redirect } from 'next/navigation'

/**
 * Los Cortes fue una pestaña propia hasta que Los Números se hizo un solo tablero
 * (2026-10-13): la lista de publicaciones vive ahora en `/admin/analytics/publicaciones`.
 * La ruta vieja redirige con sus filtros, para que ningún enlace guardado se rompa.
 */
export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}): Promise<never> {
  const params = await searchParams
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (clave === 'red' || clave === 'mensaje') continue
    for (const v of typeof valor === 'string' ? [valor] : (valor ?? [])) query.append(clave, v)
  }
  // «Solo con métricas» y «Ver borrados» viven detrás de «⋯ Más» en la pantalla nueva.
  if ((query.has('metricas') || query.has('archivados')) && !query.has('mas')) query.set('mas', '1')
  const resto = query.toString()
  redirect(resto ? `/admin/analytics/publicaciones?${resto}` : '/admin/analytics/publicaciones')
}
