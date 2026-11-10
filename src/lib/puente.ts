import 'server-only'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull, lt } from 'drizzle-orm'
import { getDb, puentes, users, type Usuario } from '@/db'
import { buscarPorId } from './usuarios'

// El puente del teléfono al panel: la app pide una llave con su token y abre en el navegador
// `/ingresar/puente#t=<llave>`, que abre la sesión del panel y lleva a Los Fierros. Existe porque
// las redes se conectan en el panel, y pedirle otro código a quien recién entró en el teléfono era
// el paso más caro del arranque (`docs/superpowers/specs/2026-11-10-primera-vuelta-design.md`).
//
// No abre una puerta nueva: quien tiene el token del teléfono ya puede todo lo de esa cuenta. La
// llave vale dos minutos y una sola vez, y se guarda con hash; sin clave, porque son 32 bytes al
// azar y no hay nada que adivinar.
//
// Lo que sí abre es otra forma de equivocarse de cuenta: cualquiera puede pedir una llave de la
// suya y hacer que otra persona abra el enlace, que quedaría dentro de un panel ajeno y podría
// conectar ahí sus redes. Por eso la página no cruza sola: muestra el correo de la cuenta
// (`mirarPuente`, que no gasta la llave) y espera que la persona apriete «Entrar».

export const VIGENCIA_DEL_PUENTE_MS = 2 * 60_000

/**
 * La cookie que deja el puente: Los Fierros, abierto desde la app, dice que se puede volver a ella.
 * Una hora, para que sobreviva la vuelta por Meta o TikTok al conectar.
 */
export const COOKIE_DESDE_LA_APP = 'pf_desde_app'
export const VIDA_DE_DESDE_LA_APP_S = 60 * 60

/** Lo que mide una llave: 32 bytes en base64url, sin relleno. */
const FORMA_DE_LA_LLAVE = /^[A-Za-z0-9_-]{43}$/

function hashDe(llave: string): string {
  return createHash('sha256').update(llave).digest('hex')
}

/** Una llave nueva para ese usuario. De paso barre las suyas que ya vencieron. */
export async function abrirPuente(userId: string, ahora: Date = new Date()): Promise<string> {
  const llave = randomBytes(32).toString('base64url')
  const db = getDb()
  await db.delete(puentes).where(and(eq(puentes.userId, userId), lt(puentes.expiraEn, ahora)))
  await db.insert(puentes).values({ userId, hash: hashDe(llave), expiraEn: new Date(ahora.getTime() + VIGENCIA_DEL_PUENTE_MS) })
  return llave
}

/** El correo de la cuenta de esa llave, si sigue viva, sin gastarla: lo que la página muestra antes de entrar. */
export async function mirarPuente(llave: string, ahora: Date = new Date()): Promise<string | null> {
  if (!FORMA_DE_LA_LLAVE.test(llave)) return null
  const [fila] = await getDb()
    .select({ correo: users.correo })
    .from(puentes)
    .innerJoin(users, eq(users.id, puentes.userId))
    .where(and(eq(puentes.hash, hashDe(llave)), isNull(puentes.usadoEn), gt(puentes.expiraEn, ahora)))
  return fila?.correo ?? null
}

/**
 * El usuario de esa llave, si sigue viva, o null. La gasta en la misma sentencia que comprueba que
 * siga viva: dos cruces a la vez abren una sesión, no dos.
 */
export async function cruzarPuente(llave: string, ahora: Date = new Date()): Promise<Usuario | null> {
  if (!FORMA_DE_LA_LLAVE.test(llave)) return null
  const [fila] = await getDb()
    .update(puentes)
    .set({ usadoEn: ahora })
    .where(and(eq(puentes.hash, hashDe(llave)), isNull(puentes.usadoEn), gt(puentes.expiraEn, ahora)))
    .returning({ userId: puentes.userId })
  if (!fila) return null
  return buscarPorId(fila.userId)
}
