'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NombreDe } from '@/components/de-noche-y-de-dia'
import { Button } from '@/components/ui'

/**
 * La red del panel entero: cualquier excepción de una página de `(dash)` cae acá en vez
 * de en la pantalla en inglés de Next.
 *
 * Next pasa `retry` y `reset`; la documentación instalada (16.3) pide `retry`, que vuelve
 * a pedir los datos además de re-renderizar — que es justo lo que falló.
 */
export default function PanelError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  // La salida de emergencia no sirve cuando la que se rompió es la pantalla de llegada.
  const enLaEntrada = usePathname() === '/admin/schedule'

  // El mensaje puede venir de una fila de la base o de la respuesta de una red: a la
  // consola, donde lo lee quien depura, y nunca a la pantalla. Lo que sí va es el `digest`,
  // que no dice nada del error pero lo encuentra en los logs de Vercel. Antes la pantalla
  // decía «una consulta no respondió» pasara lo que pasara, y un 413 por un archivo grande
  // mandó a buscar en la base un problema que no existía.
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <section className="chapa mx-auto mt-10 max-w-md rounded-2xl p-6 text-center">
      <h1 className="font-titulo text-lg font-semibold uppercase tracking-[0.03em]">Algo se rompió</h1>
      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        No fue nada que hicieras. Vuelve a intentarlo; el detalle quedó en la consola del
        navegador.
        {error.digest ? ` Si se repite, este código ayuda a encontrarlo: ${error.digest}.` : ''}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <Button type="button" variant="primary" onClick={() => retry()}>
          Reintentar
        </Button>
        {enLaEntrada ? null : (
          <Link href="/admin/schedule" className="text-sm text-fg-muted transition-colors hover:text-fg">
            Ir a <NombreDe ruta="/admin/schedule" />
          </Link>
        )}
      </div>
    </section>
  )
}
