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

/*
 * Las otras palabras que cambian de día, como en el panel (`src/lib/vocabulario.ts`, que un test
 * compara con estas). Con sushi no tenían sentido los fierros ni el fuego: La Parrilla es La
 * Barra, Los Fierros son Los Cuchillos —el fierro de una cuenta se desafila en vez de enfriarse—,
 * y un corte es una pieza. Lo pidió el dueño el 2026-10-20.
 */
export const LA_PARRILLA: Record<Tema, string> = { noche: 'La Parrilla', dia: 'La Barra' }
export const LOS_FIERROS: Record<Tema, string> = { noche: 'Los Fierros', dia: 'Los Cuchillos' }

/** El calor de un día de la agenda, como la grilla del panel (`ROTULO_CALOR`). */
export const ROTULO_CALOR: Record<Tema, Record<'apagada' | 'prendida' | 'llena', string>> = {
  noche: { apagada: 'Apagada', prendida: 'Prendida', llena: 'Parrilla llena' },
  dia: { apagada: 'Vacía', prendida: 'Con piezas', llena: 'Tabla llena' },
}

/**
 * El aviso del botón de Ajustes en palabras, como el del panel (`fraseDelAviso`, en
 * `src/lib/parrilla.ts`). El servidor manda la de noche ya armada (`aviso.frase`); esta la arma
 * en el modo que se ve, con lo mismo que trae el aviso.
 */
export function fraseDelAviso(aviso: { nivel: 'apagado' | 'enfriandose'; cuantos: number }, tema: Tema): string {
  const { nivel, cuantos } = aviso
  if (tema === 'dia') {
    if (nivel === 'apagado') return `${cuantos} sin filo`
    return cuantos === 1 ? '1 se desafila' : `${cuantos} se desafilan`
  }
  if (nivel === 'apagado') return cuantos === 1 ? '1 se apagó' : `${cuantos} se apagaron`
  return cuantos === 1 ? '1 se enfría' : `${cuantos} se enfrían`
}

/** Lo que salió, como el pie del panel (`servidos`): cortes de noche, piezas de día. */
export function servidos(n: number, tema: Tema): string {
  if (tema === 'dia') return n === 1 ? '1 pieza servida' : `${n} piezas servidas`
  return n === 1 ? '1 corte servido' : `${n} cortes servidos`
}
