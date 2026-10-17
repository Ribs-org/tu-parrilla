/**
 * La bajada de Los Números, debajo de su título. Vive aparte para que la pantalla y su carga
 * (`loading.tsx`) dibujen exactamente lo mismo: ocupa dos renglones en la computadora y
 * cuatro en el teléfono, y un esqueleto que la imitara saltaría al llegar.
 */
export function BajadaDeLosNumeros() {
  return (
    <p className="mt-1 max-w-2xl text-sm text-fg-muted">
      Dos cosas distintas: lo que hicieron tus publicaciones en las redes, y quién entró a tu
      página de links. El período vale para las dos.
    </p>
  )
}
