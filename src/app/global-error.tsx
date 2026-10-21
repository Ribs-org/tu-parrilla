'use client'

import { useEffect } from 'react'

/**
 * La red de última instancia: lo que se rompe en el layout raíz, donde ni el boundary del
 * panel (`admin/(dash)/error.tsx`) ni el de las páginas públicas (`app/error.tsx`) alcanzan.
 * Reemplaza al layout entero, así que trae su propio `<html>`, su título y los colores de la
 * noche en línea (los de `globals.css`): no cuenta con las fuentes ni con los estilos del
 * sitio. Sin esto, Next mostraba su pantalla en inglés.
 *
 * `retry` vuelve a pedir los datos además de dibujar de nuevo, que es justo lo que falló.
 */
export default function ErrorGlobal({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100vh', background: '#16181a', color: '#edeaf2', fontFamily: 'system-ui, sans-serif' }}>
        <title>Algo se rompió · Tu Parrilla</title>
        <main style={{ maxWidth: '28rem', margin: '0 auto', padding: '4rem 1.5rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Algo se rompió</h1>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', lineHeight: 1.5, color: '#9c96ad' }}>
            No fue nada que hicieras. Vuelve a intentarlo en un momento.
            {error.digest ? ` Si se repite, este código ayuda a encontrarlo: ${error.digest}.` : ''}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.2rem',
              borderRadius: '0.75rem',
              border: 0,
              background: '#e8621f',
              color: '#16181a',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  )
}
