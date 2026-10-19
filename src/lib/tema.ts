// El modo del panel: la noche de siempre, o el día con sushi. Se elige con el botón de la barra
// (`boton-tema.tsx`) y se recuerda en el equipo con una cookie, que el servidor lee para pintar
// el primer cuadro ya en el modo elegido. Ver
// `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.

export type Tema = 'noche' | 'dia'

/** La cookie del modo. Sin ella, la noche: el dueño pidió que fuera la de entrada. */
export const TEMA_COOKIE = 'tp-tema'

/** Un año: el modo se elige una vez. */
export const TEMA_DURA_SEGUNDOS = 60 * 60 * 24 * 365

/**
 * El color de la barra del navegador del teléfono en cada modo: el fondo del panel
 * (`--color-acero-950` en `globals.css`), para que la barra y la página sean una sola cosa.
 */
export const COLOR_DE_BARRA: Record<Tema, string> = { noche: '#16181a', dia: '#f6f1e9' }

/**
 * El modo de lo que trae la cookie. Cualquier otra cosa, o nada, es la noche: no se adivina
 * por el modo del sistema, porque la noche es la de entrada.
 */
export function temaDe(valor: string | undefined | null): Tema {
  return valor === 'dia' ? 'dia' : 'noche'
}

/** El otro modo: adonde lleva el botón. */
export function otroTema(tema: Tema): Tema {
  return tema === 'dia' ? 'noche' : 'dia'
}
