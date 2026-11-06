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

/** Las dos pestañas del libro, como en la ventana del panel (`src/lib/vocabulario.ts`). */
export const LIBRO_ESCRIBIR = 'Escribir'
export const LO_QUE_NOS_ESCRIBISTE = 'Lo que nos escribiste'

/**
 * Lo que devuelve `GET /api/mobile/sugerencias`: lo que la persona escribió, con la respuesta del
 * equipo, y cuántas respuestas no abrió. Las fechas llegan también escritas en la zona de la
 * cuenta («6 nov 2026»), para no armarlas acá.
 */
export type SugerenciaDelLibro = {
  id: string
  tipo: TipoSugerencia
  texto: string
  creadaEn: string
  creadaEnTexto?: string
  respuesta: string | null
  respondidaEn: string | null
  respondidaEnTexto?: string | null
  /** Tiene una respuesta que la persona no abrió. */
  nueva: boolean
}

export type LibroLeido = { sinLeer: number; sugerencias: SugerenciaDelLibro[] }

/**
 * El libro con las respuestas que la persona ya abrió en esta pantalla marcadas como leídas, para
 * que el punto se apague sin esperar a la red. Lo que no estaba nuevo queda igual.
 */
export function conLeidas(libro: LibroLeido, leidas: ReadonlySet<string>): LibroLeido {
  const sugerencias = libro.sugerencias.map((s) => (s.nueva && leidas.has(s.id) ? { ...s, nueva: false } : s))
  return { sinLeer: sugerencias.filter((s) => s.nueva).length, sugerencias }
}

/** «1 respuesta nueva» o «3 respuestas nuevas». */
export function respuestasNuevas(n: number): string {
  return n === 1 ? '1 respuesta nueva' : `${n} respuestas nuevas`
}
