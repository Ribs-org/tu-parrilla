// Lo que el libro de sugerencias acepta, sin nada más: lo usa la ventana del panel, que corre en
// el navegador, y el esquema lo reexporta. Vive aparte para que el navegador no cargue
// `drizzle-orm` (el mismo motivo que `src/lib/networks.ts`).

/** Qué es lo que se escribe: una idea, algo que no funciona u otra cosa. */
export const TIPOS_SUGERENCIA = ['idea', 'problema', 'otra'] as const
export type TipoSugerencia = (typeof TIPOS_SUGERENCIA)[number]

/** El largo máximo de lo que se escribe. Un párrafo largo cabe de sobra. */
export const MAX_TEXTO = 2000

/** Cuántas sugerencias puede dejar una persona en 24 horas. */
export const TOPE_DIARIO = 5

/** Cada tipo: cómo se llama en la ventana, su ayuda, su ejemplo y su etiqueta en GitHub. */
export const TIPOS: Record<TipoSugerencia, { nombre: string; ayuda: string; ejemplo: string; etiqueta: string }> = {
  idea: {
    nombre: 'Una idea',
    ayuda: 'Algo que te gustaría que hiciera.',
    ejemplo: 'Quiero que cuando apriete … pase …',
    etiqueta: 'sugerencia: idea',
  },
  problema: {
    nombre: 'Algo no funciona',
    ayuda: 'Un reclamo: un error, algo que se ve raro o no hace lo que dice.',
    ejemplo: 'Qué hiciste, qué esperabas y qué pasó.',
    etiqueta: 'sugerencia: no funciona',
  },
  otra: {
    nombre: 'Otra cosa',
    ayuda: 'Una pregunta, un saludo, lo que quieras decirnos.',
    ejemplo: 'Lo que quieras.',
    etiqueta: 'sugerencia: otra cosa',
  },
}
