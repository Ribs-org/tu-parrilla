/**
 * El aspecto de un botón, en un solo sitio, para las dos cosas que lo tienen: el `<button>`
 * de `ui.tsx` y el enlace que parece uno.
 *
 * Vive acá y no dentro de `ui.tsx` por el límite de cliente: `ui.tsx` lleva `'use client'`,
 * y Next convierte **todos** los exports de un módulo así en referencias de cliente. Un
 * `const` de texto importado desde un componente de servidor no llega como texto, llega
 * como una función que lanza, y su `toString()` termina dentro del `class=` — medido: la
 * página de 404 se quedó sin ningún estilo, con «Attempted to call ENLACE_BOTON() from the
 * server» escrito en el atributo. Un módulo sin directiva lo cruzan los dos lados.
 */

/**
 * La forma: caja, radio, aire y tipografía. Sin color y sin transición, que es justo lo que
 * el botón y el enlace no comparten — el `<button>` cambia de color al pasar por encima y
 * el enlace primario, de brillo.
 */
export const BOTON_FORMA =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium'

/**
 * Un enlace con pinta de botón primario. Es una constante y no un componente porque el
 * `<Link>` de Next quiere ser él quien renderice el `<a>`, y porque `Button` es un
 * `<button>`: envolverlo daría un botón dentro de un enlace.
 *
 * Existe porque esta misma cadena estaba copiada carácter por carácter en la pantalla de
 * entrada y en la página de 404, y el aspecto de un botón repartido en tres archivos termina
 * diciendo tres cosas distintas.
 */
export const ENLACE_BOTON = `${BOTON_FORMA} bg-brasa text-acero-950 transition-[filter] hover:brightness-110`

/**
 * Un enlace con pinta de botón secundario: el borde y el gris del `Button` `ghost` de
 * `ui.tsx`, para acciones que conviven con una primaria (La Parrilla: «Borradores» y «Subir
 * CSV» junto a «Nueva publicación»).
 */
export const ENLACE_BOTON_SECUNDARIO = `${BOTON_FORMA} border border-acero-700 text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg`

/**
 * La forma chica, para la acción que va pegada a una línea de texto: el arreglo de un destino
 * quemado al lado de su motivo, en «Se quemó» y en el editor. Con la forma de siempre, el
 * botón era más alto que la línea que lo explica y la fila saltaba de alto.
 */
export const BOTON_CHICO_FORMA =
  'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1 text-[0.75rem] font-medium'

/** El arreglo exacto de lo quemado, en chico: «Reconectar», «Cambiar el archivo». */
export const BOTON_CHICO = `${BOTON_CHICO_FORMA} bg-brasa text-acero-950 transition-[filter] hover:brightness-110 disabled:opacity-60`

/** La acción que acompaña al arreglo, en chico: «Reprogramar». */
export const BOTON_CHICO_SECUNDARIO = `${BOTON_CHICO_FORMA} border border-acero-700 text-fg-muted transition-colors hover:bg-acero-800 hover:text-fg disabled:opacity-60`
