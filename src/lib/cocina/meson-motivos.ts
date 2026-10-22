// Los motivos de un descarte en el mesón, sin base: los leen el servidor y los botones del navegador.

/** Por qué no sirvió, de un toque: lo que más le dice al chef. */
export const MOTIVOS_DESCARTE = ['corte', 'letra', 'tema', 'audio'] as const
export type MotivoDescarte = (typeof MOTIVOS_DESCARTE)[number]
export const NOMBRE_MOTIVO: Record<MotivoDescarte, string> = {
  corte: 'El corte',
  letra: 'La letra',
  tema: 'El tema',
  audio: 'El audio',
}
export const MAX_NOTA_DESCARTE = 500

export const CREATIVO_NO_ESTA = 'Ese creativo ya no está en el mesón.'
export const MOTIVO_DESCARTE_FALTA = 'Elige por qué no sirvió: el corte, la letra, el tema o el audio.'
export const NOTA_LARGA = `La nota cabe en ${MAX_NOTA_DESCARTE} caracteres.`

/** El motivo y la nota de un descarte, como llegan del formulario, validados. */
export function leerDescarte(motivo: unknown, nota: unknown): { motivo: MotivoDescarte; nota: string | null } | { error: string } {
  if (typeof motivo !== 'string' || !(MOTIVOS_DESCARTE as readonly string[]).includes(motivo)) return { error: MOTIVO_DESCARTE_FALTA }
  const texto = typeof nota === 'string' ? nota.trim() : ''
  if (texto.length > MAX_NOTA_DESCARTE) return { error: NOTA_LARGA }
  return { motivo: motivo as MotivoDescarte, nota: texto || null }
}
