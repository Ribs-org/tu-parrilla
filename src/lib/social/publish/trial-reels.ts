import { eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import type { OpcionesDestino } from './opciones'
import type { PublishOutcome } from './publisher'

// Qué cuenta de Instagram acepta trial reels. Meta no lo dice antes: lo revela al crear el
// contenedor de uno, y en una cuenta con pocos seguidores lo rechaza siempre (subcódigo
// 2207081, #250). Eso no cambia de un día para otro, así que se anota en la cuenta y lo leen
// Los Fierros, `GET /api/schedule/cuentas` y el compositor, para avisar antes de programar un
// trial reel donde no va a salir. No se bloquea nada: una cuenta que crece pasa a aceptarlos,
// y el primero que sale la marca «sí» otra vez.

export type TrialReels = 'si' | 'no'

/** Si el destino pidió un trial reel. */
function pidioTrial(opciones: OpcionesDestino | null): boolean {
  return Boolean(opciones && 'trialReel' in opciones && opciones.trialReel)
}

/**
 * Lo que un intento enseña de la cuenta, o null si no enseña nada: «no», con la frase del
 * rechazo, cuando Meta lo rechazó por elegibilidad (`sinTrial`, lo pone `instagram.ts`); «sí»
 * cuando un trial reel salió publicado. Cualquier otro fallo no dice nada de la cuenta.
 */
export function loQueAprende(
  red: string,
  outcome: PublishOutcome,
  opciones: OpcionesDestino | null,
): { trialReels: TrialReels; motivo: string | null } | null {
  if (red !== 'instagram') return null
  if (outcome.kind === 'failed' && outcome.sinTrial) return { trialReels: 'no', motivo: outcome.reason }
  if (outcome.kind === 'published' && pidioTrial(opciones)) return { trialReels: 'si', motivo: null }
  return null
}

/**
 * Lo anota en la cuenta. Nunca tumba la corrida: el destino ya quedó escrito, y lo que viene
 * detrás en la fila tiene que salir igual. Va por el id de la cuenta del destino, como
 * `marcarCaida`: la corrida del cron no tiene un dueño de turno.
 */
export async function aprenderTrialReels(
  accountId: string,
  red: string,
  outcome: PublishOutcome,
  opciones: OpcionesDestino | null,
  ahora: Date,
): Promise<void> {
  const aprendido = loQueAprende(red, outcome, opciones)
  if (!aprendido) return
  try {
    await getDb()
      .update(socialAccounts)
      .set({ trialReels: aprendido.trialReels, trialReelsMotivo: aprendido.motivo, trialReelsEn: ahora })
      .where(eq(socialAccounts.id, accountId))
  } catch (error) {
    console.error(`[publicar] No se anotó si la cuenta ${accountId} acepta trial reels:`, String(error).slice(0, 300))
  }
}
