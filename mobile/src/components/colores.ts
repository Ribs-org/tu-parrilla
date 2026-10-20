/**
 * Los colores de la app en sus dos modos, los mismos del panel web: «Fierro y humo» de noche
 * (ver `docs/superpowers/specs/2026-09-18-parrilla-direccion-visual-design.md`) y el papel de
 * arroz de día (`.acerado[data-tema='dia']` en `src/app/globals.css`). `src/lib/paleta.test.ts`
 * compara cada uno con el panel: una copia sin guardia se separa sola.
 *
 * `brasa` es el acento y no existía: antes el verde hacía dos trabajos, el estado
 * «publicado» y el fondo del botón destacado, así que el mismo color informaba y pedía
 * que lo tocaras. Ahora el verde es solo estado y la brasa solo acción.
 *
 * Cada pantalla los pide con `useColores()` (`tema.tsx`), que da los del modo de la cuenta.
 */
export type Colores = {
  fondo: string
  tarjeta: string
  texto: string
  suave: string
  tenue: string
  brasa: string
  verde: string
  rojo: string
  ambar: string
  /** El velo: blanco de noche y tinta de día, para sombrear con transparencia (`velo + '10'`). */
  velo: string
  /** El acero de los bordes y de la pista vacía de un fierro. */
  acero: string
  /**
   * El color de marca de cada red, el de `--color-marca-*` del panel: el punto de la red en cada
   * destino, en el filtro y en la mezcla de redes de cada día. Nunca de fondo: el rojo de fondo es
   * lo que se quemó. TikTok, en neutro: su marca es blanco y negro.
   */
  instagram: string
  tiktok: string
  youtube: string
  facebook: string
}

export const COLORES_NOCHE: Colores = {
  fondo: '#16181a',
  tarjeta: '#1d2124',
  texto: '#f2ebe2',
  // El secundario y el tenue del panel, a 5,85:1 y 5,03:1 sobre la tarjeta. Antes el tenue
  // daba 3,25:1, y se repetía con otro nombre (`gris`).
  suave: '#a39a8f',
  tenue: '#8a9096',
  brasa: '#e8621f',
  verde: '#74bf6a',
  // El de «se quemó», como en el panel: el de antes (#f0614f) era casi el naranjo de la brasa.
  rojo: '#f2557a',
  ambar: '#e5a52a',
  velo: '#ffffff',
  acero: '#2a2e33',
  instagram: '#e8457f',
  tiktok: '#a39a8f',
  youtube: '#ff2b2b',
  facebook: '#4c8ef7',
}

/**
 * De día el acero se da vuelta: el fondo es papel de arroz, la tarjeta blanca y la tinta oscura.
 * Lo accionable pasa a salmón tostado, y el rojo, el verde y el ámbar a los del texto del panel de
 * día, que pasan 4,5:1. El rojo del dibujo de lo que falló (`QUEMO`) no cambia: va aparte.
 */
export const COLORES_DIA: Colores = {
  fondo: '#f6f1e9',
  tarjeta: '#fffdf9',
  texto: '#221f1c',
  suave: '#5c564e',
  tenue: '#6b655d',
  brasa: '#b83d0b',
  verde: '#2f7a3b',
  rojo: '#c0244c',
  ambar: '#946000',
  velo: '#221f1c',
  acero: '#e2d8c9',
  instagram: '#c13584',
  tiktok: '#5c564e',
  youtube: '#e00000',
  facebook: '#1877f2',
}

export const PALETAS = { noche: COLORES_NOCHE, dia: COLORES_DIA } as const

/** El color de una red, o el del texto si la red no tiene uno (Threads, X). */
export function colorDeRed(colores: Colores, red: string): string {
  if (red === 'instagram' || red === 'tiktok' || red === 'youtube' || red === 'facebook') return colores[red]
  return colores.texto
}
