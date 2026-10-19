// El modo del panel y de la app del teléfono: la noche de siempre, o el día con sushi. Es de la
// cuenta (`users.tema`): lo cambia el botón de la barra del panel (`boton-tema.tsx`) o Ajustes en
// el teléfono (`/api/mobile/tema`), y vale en los dos. Una cookie lo copia en cada equipo para lo
// que se dibuja sin saber de quién es: la puerta y el color de la barra del navegador. Ver
// `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`.

export type Tema = 'noche' | 'dia'

/**
 * La cookie del modo: la copia de este equipo. Sin ella, la noche: el dueño pidió que fuera la
 * de entrada.
 */
export const TEMA_COOKIE = 'tp-tema'

/** Un año: el modo se elige una vez. */
export const TEMA_DURA_SEGUNDOS = 60 * 60 * 24 * 365

/** Lo que responde `PUT /api/mobile/tema` cuando lo que llegó no es un modo. */
export const TEMA_INVALIDO = 'El modo no se entendió (usa «noche» o «dia»).'

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

/**
 * El modo que pide el cuerpo de `PUT /api/mobile/tema` (`{ "tema": "dia" }`), o null si no es
 * uno. Acá no hay noche por descarte, como en la cookie: un cuerpo mal armado no cambia el
 * modo de la cuenta.
 */
export function temaDelCuerpo(cuerpo: unknown): Tema | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null
  const tema = (cuerpo as { tema?: unknown }).tema
  return tema === 'dia' || tema === 'noche' ? tema : null
}
