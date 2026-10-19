/**
 * El modo de la app: la noche de siempre, o el día con sushi. Es el de la cuenta, el mismo del
 * panel web (`users.tema`, y `GET`/`PUT /api/mobile/tema`): se cambia acá, en Ajustes, o en la
 * barra del panel, y vale en los dos. El teléfono guarda una copia para abrir en el modo de la
 * última vez sin esperar a la red. Puro: lo lee `components/tema.tsx`.
 *
 * Ver `docs/superpowers/specs/2026-10-19-modo-dia-sushi-design.md`, tanda 3.
 */
export type Tema = 'noche' | 'dia'

/** La copia del modo en el teléfono, en AsyncStorage. */
export const CLAVE_TEMA = 'tema'

/** Un cambio que no llegó a la cuenta —sin señal—: se manda en la próxima vuelta. */
export const CLAVE_TEMA_SIN_SUBIR = 'tema-sin-subir'

/** Lo que no es el día es la noche, que es la de entrada. */
export function temaDe(valor: unknown): Tema {
  return valor === 'dia' ? 'dia' : 'noche'
}

/** El otro modo: adonde lleva el botón de Ajustes. */
export function otroTema(tema: Tema): Tema {
  return tema === 'dia' ? 'noche' : 'dia'
}

/** El modo de lo que responde `/api/mobile/tema`, o null si no vino uno: un servidor de antes. */
export function temaDeLaRespuesta(cuerpo: unknown): Tema | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) return null
  const tema = (cuerpo as { tema?: unknown }).tema
  return tema === 'dia' || tema === 'noche' ? tema : null
}

/**
 * «Se quemó», la sección de lo que falló, en cada modo, como en el panel (`SE_QUEMO` en
 * `src/lib/vocabulario.ts`, que un test compara con esta): de día nada se quema, y el pescado
 * que no se sirvió se echó a perder.
 */
export const SE_QUEMO: Record<Tema, string> = { noche: 'Se quemó', dia: 'Se echó a perder' }
