// El color de marca de cada red en La Parrilla, como clases de Tailwind escritas enteras: el
// escáner de Tailwind solo genera las que aparecen así en el código, nunca una armada con
// `text-marca-${red}`. Los valores viven en globals.css (`--color-marca-*`), uno de noche y
// uno de día, y `src/lib/paleta.test.ts` mide que cada uno pase 3:1 sobre lo que lo rodea.

/**
 * El ícono de la red, en su color. Va en el ícono y no en el texto ni de fondo: el fondo
 * rojo es lo que se quemó, y el texto sigue en el color del texto. Una red sin color propio
 * (Threads, X) va en el color del texto, como antes.
 */
export const COLOR_DE_RED: Readonly<Record<string, string>> = {
  instagram: 'text-marca-instagram',
  tiktok: 'text-marca-tiktok',
  youtube: 'text-marca-youtube',
  facebook: 'text-marca-facebook',
}

/** La red como relleno: un tramo de la mezcla de redes de un día. */
export const FONDO_DE_RED: Readonly<Record<string, string>> = {
  instagram: 'bg-marca-instagram',
  tiktok: 'bg-marca-tiktok',
  youtube: 'bg-marca-youtube',
  facebook: 'bg-marca-facebook',
}

export function colorDeRed(red: string | null | undefined): string {
  return (red && COLOR_DE_RED[red]) || 'text-fg'
}

export function fondoDeRed(red: string | null | undefined): string {
  return (red && FONDO_DE_RED[red]) || 'bg-fg-muted'
}
