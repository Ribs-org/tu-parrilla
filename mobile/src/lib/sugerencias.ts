/**
 * Lo que acepta el libro de sugerencias, copiado del panel (`src/lib/sugerencias/tipos.ts`, que
 * `src/lib/vocabulario.test.ts` compara con este): los tres tipos con su nombre, su ayuda y su
 * ejemplo, y el largo máximo. El servidor revisa igual; esto es para que la app no deje escribir
 * de más ni muestre otro nombre que el panel.
 */
export type TipoSugerencia = 'idea' | 'problema' | 'otra'

export const TIPOS_SUGERENCIA: readonly TipoSugerencia[] = ['idea', 'problema', 'otra']

export const MAX_TEXTO_SUGERENCIA = 2000

export const TIPOS: Record<TipoSugerencia, { nombre: string; ayuda: string; ejemplo: string }> = {
  idea: { nombre: 'Una idea', ayuda: 'Algo que te gustaría que hiciera.', ejemplo: 'Quiero que cuando apriete … pase …' },
  problema: {
    nombre: 'Algo no funciona',
    ayuda: 'Un reclamo: un error, algo que se ve raro o no hace lo que dice.',
    ejemplo: 'Qué hiciste, qué esperabas y qué pasó.',
  },
  otra: { nombre: 'Otra cosa', ayuda: 'Una pregunta, un saludo, lo que quieras decirnos.', ejemplo: 'Lo que quieras.' },
}

/** Lo que se dice si se aprieta el botón sin haber escrito nada; el mismo texto del panel. */
export const SUGERENCIA_VACIA = 'Escribe algo antes de mandarlo.'
