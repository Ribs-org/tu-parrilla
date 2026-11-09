import { sql } from 'drizzle-orm'
import { getDb, usoIa } from '@/db'
import { mesDelDueno, SIN_TOKENS } from './plan'
import { planDe, tokensDelMes } from './planes'

// Los tokens de IA de cada dueño contra el tope de su plan: se mira antes de llamar al modelo y se
// suma después, con lo que la pasarela dice que gastó (`usage.totalTokens`). El tope es blando por
// una llamada —la última del mes puede pasarse por unos cientos— a propósito: medirlo exacto pediría
// reservar antes de saber cuánto se gasta.

/** Lo que lanza quien iba a llamar al modelo por un dueño que ya gastó los tokens de su plan. */
export class SinTokens extends Error {
  constructor() {
    super(SIN_TOKENS)
    this.name = 'SinTokens'
  }
}

/** Si al dueño le quedan tokens este mes. Sin tope, siempre. */
export async function quedanTokens(ownerId: string, ahora = new Date()): Promise<boolean> {
  const db = getDb()
  const { plan, persona } = await planDe(ownerId, ahora, db)
  if (plan.tokensMes === null) return true
  return (await tokensDelMes(db, ownerId, persona.zona, ahora)) < plan.tokensMes
}

/** Lanza `SinTokens` si al dueño no le quedan. */
export async function exigirTokens(ownerId: string, ahora = new Date()): Promise<void> {
  if (!(await quedanTokens(ownerId, ahora))) throw new SinTokens()
}

/**
 * Suma lo gastado al mes del dueño. Un `usage` sin número (un proveedor que no lo informa) no suma:
 * mejor no contar que inventar. Nunca lanza: no poder anotarlo no deshace un borrador que ya salió.
 */
export async function sumarTokens(ownerId: string, tokens: number | undefined, zona: string, ahora = new Date()): Promise<void> {
  if (!tokens || tokens <= 0) return
  try {
    await getDb()
      .insert(usoIa)
      .values({ ownerId, mes: mesDelDueno(ahora, zona), tokens })
      .onConflictDoUpdate({
        target: [usoIa.ownerId, usoIa.mes],
        set: { tokens: sql`${usoIa.tokens} + ${tokens}`, actualizadoEn: ahora },
      })
  } catch (error) {
    console.error('[planes] no se anotaron los tokens:', String(error).slice(0, 300))
  }
}

/**
 * Una llamada al modelo por un dueño, con el tope de su plan: si ya gastó los tokens del mes lanza
 * `SinTokens` sin llamar; si no, llama y suma lo que la llamada dice que gastó.
 */
export async function conTokens<T>(
  ownerId: string,
  llamar: () => Promise<{ valor: T; tokens: number | undefined }>,
  ahora = new Date(),
): Promise<T> {
  const db = getDb()
  const { plan, persona } = await planDe(ownerId, ahora, db)
  if (plan.tokensMes !== null && (await tokensDelMes(db, ownerId, persona.zona, ahora)) >= plan.tokensMes) {
    throw new SinTokens()
  }
  const { valor, tokens } = await llamar()
  await sumarTokens(ownerId, tokens, persona.zona, ahora)
  return valor
}
