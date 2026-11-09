// Guardar una cuenta conectada, compartido por el callback (una candidata) y la
// selección (varias). Sin `server-only`: lo importa una server action.
import { and, eq, inArray, isNotNull, ne } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { exigirCupoDeCuentas } from '@/lib/planes/topes'
import { encryptToken } from './crypto'

export type CuentaAConectar = {
  externalId: string
  handle: string | null
  accessToken: string
  refreshToken: string | null
  expiresAt: Date | null
  /** El id de usuario de la app de Meta; solo lo traen `instagram` y `facebook`. */
  metaUserId?: string | null
  /**
   * Con qué login se conectó, en Instagram (`social/instagram-login.ts`). Sin él, una cuenta de
   * Instagram se guarda como de login de Facebook: la selección de varias cuentas solo existe ahí.
   */
  login?: 'facebook' | 'instagram'
  /**
   * Los permisos que Google dijo conceder, separados por espacios. Solo YouTube los guarda: es lo
   * que dice si el canal dio el de analítica (`social/analitica-youtube.ts`).
   */
  scopes?: string | null
}

/**
 * «@cuenta ya está conectada por otra persona en Tu Parrilla.», con el nombre de cada cuenta.
 * Antes decía «Esa cuenta» a secas, y un login de Meta trae todas las cuentas de las páginas
 * que la persona administra: no había cómo saber cuál de ellas era la de otro.
 */
export function fraseCuentaDeOtro(nombres: string[]): string {
  const citados = nombres.map((n) => `«${n}»`)
  if (citados.length <= 1) return `${citados[0] ?? 'Esa cuenta'} ya está conectada por otra persona en Tu Parrilla.`
  const lista = `${citados.slice(0, -1).join(', ')} y ${citados[citados.length - 1]}`
  return `${lista} ya están conectadas por otra persona en Tu Parrilla.`
}

/**
 * Lo que se le agrega a la frase cuando el login trajo una sola cuenta y es la de otro: la
 * persona casi siempre quería otra, y en Meta la cuenta sale de la página que se elige en la
 * ventana de Facebook. Con el login de Instagram no hay página que elegir: se entra con la otra.
 */
export function siQueriasOtra(network: string, login?: string | null): string {
  return (network === 'instagram' && login !== 'instagram') || network === 'facebook'
    ? 'Si querías conectar otra, vuelve a conectar y, en la ventana de Facebook, elige la página de esa cuenta.'
    : 'Si querías conectar otra, vuelve a conectar entrando con esa cuenta.'
}

export class CuentaDeOtro extends Error {
  constructor(nombre: string) {
    super(fraseCuentaDeOtro([nombre]))
  }
}

/** Cómo se nombra una cuenta que trajo un login: su @usuario o su página, o el id si no hay. */
export function nombreDeCandidata(cuenta: { externalId: string; handle: string | null }): string {
  return cuenta.handle ?? cuenta.externalId
}

/**
 * De las cuentas que trajo un login, las que ya son de otro usuario de Tu Parrilla. Cruza
 * dueños a propósito, igual que el guardia de `guardarCuenta`: solo pregunta por ids que la
 * propia persona acaba de autorizar en la red, y solo responde si alguien más los tiene, que
 * es lo mismo que el error diría al guardar. Una fila sin dueño no cuenta como de otro.
 */
export async function tomadasPorOtro(ownerId: string, network: string, externalIds: string[]): Promise<Set<string>> {
  if (externalIds.length === 0) return new Set()
  const filas = await getDb()
    .select({ externalId: socialAccounts.externalId })
    .from(socialAccounts)
    .where(
      and(
        eq(socialAccounts.network, network),
        inArray(socialAccounts.externalId, externalIds),
        isNotNull(socialAccounts.ownerId),
        ne(socialAccounts.ownerId, ownerId),
      ),
    )
  return new Set(filas.flatMap((f) => (f.externalId ? [f.externalId] : [])))
}

/**
 * Upsert por (red, id externo): la misma cuenta renueva su token; un id nuevo es una fila nueva.
 * Dice cuál de las dos pasó, para que «Agregar cuenta →» no vuelva diciendo «conectado» cuando
 * solo se renovó la de antes. Una fila sin dueño (de antes de que existieran los dueños) cuenta
 * como nueva: en el panel de esta persona no estaba.
 *
 * Una cuenta que no estaba conectada —nueva, o una propia desconectada— suma una al tope de
 * cuentas del plan, y si no cabe lanza `TopeDelPlan` (`planes/topes.ts`) sin guardar nada. Renovar
 * una que ya estaba conectada no suma.
 */
export async function guardarCuenta(
  ownerId: string,
  network: string,
  cuenta: CuentaAConectar,
): Promise<'nueva' | 'renovada'> {
  return getDb().transaction(async (tx) => {
    // Hasta que la entrega 3 cambie la única a (owner_id, network, external_id), dos dueños
    // caen en la misma fila: avisar es la única salida honesta. Pisar el token dejaría al
    // primero publicando con la credencial del segundo.
    const [existente] = await tx
      .select({ id: socialAccounts.id, ownerId: socialAccounts.ownerId, accessToken: socialAccounts.accessToken })
      .from(socialAccounts)
      .where(and(eq(socialAccounts.network, network), eq(socialAccounts.externalId, cuenta.externalId)))
      .limit(1)
    if (existente && existente.ownerId !== null && existente.ownerId !== ownerId) {
      throw new CuentaDeOtro(nombreDeCandidata(cuenta))
    }
    const propia = existente?.ownerId === ownerId ? existente : null
    if (!propia?.accessToken) await exigirCupoDeCuentas(tx, ownerId, propia?.id ?? null)

    const valores = {
      handle: cuenta.handle,
      accessToken: encryptToken(cuenta.accessToken),
      refreshToken: cuenta.refreshToken ? encryptToken(cuenta.refreshToken) : null,
      expiresAt: cuenta.expiresAt,
      lastSyncError: null,
      // Se escribe siempre en Instagram: la misma cuenta puede reconectarse por el otro login, y
      // entonces cambian el token y el host con que se le habla. Nulo en las demás redes.
      login: network === 'instagram' ? (cuenta.login ?? 'facebook') : null,
      // En YouTube se escribe siempre, aunque venga vacío: un reconectar que destildó la analítica
      // tiene que dejar de decir que la tiene, y entonces `retencion-youtube` borra lo leído con ella.
      ...(network === 'youtube' ? { scopes: cuenta.scopes ?? null } : {}),
    }
    // El id de usuario de Meta va aparte porque al reconectar solo se escribe cuando lo hay:
    // así una cuenta de antes de que existiera la columna rellena su nulo, y un `/me` que
    // falló no borra el id que ya estaba guardado. Las demás redes nunca lo traen.
    const metaUserId = cuenta.metaUserId ?? null
    await tx
      .insert(socialAccounts)
      .values({ network, externalId: cuenta.externalId, ownerId, metaUserId, ...valores })
      // El target sigue siendo (network, external_id) hasta la entrega 3: mientras tanto dos
      // usuarios no pueden conectar la misma cuenta, y es preferible a que uno pise al otro.
      .onConflictDoUpdate({
        target: [socialAccounts.network, socialAccounts.externalId],
        set: metaUserId ? { ...valores, metaUserId } : valores,
      })
    return propia ? 'renovada' : 'nueva'
  })
}

const GRAPH = 'https://graph.facebook.com/v23.0'

/**
 * Página → token de página, pedido con el token de usuario. La cookie de conexión
 * pendiente no lleva estos tokens (no cabrían con diez páginas), así que la selección
 * los vuelve a pedir; Meta los entrega en cada llamada.
 */
export async function tokensDePaginas(userToken: string): Promise<Map<string, string>> {
  const response = await fetch(`${GRAPH}/me/accounts?fields=id,access_token&access_token=${userToken}`)
  if (!response.ok) throw new Error(`me/accounts ${response.status}`)
  const body = (await response.json()) as { data?: Array<{ id?: string; access_token?: string }> }
  const tokens = new Map<string, string>()
  for (const page of body.data ?? []) {
    if (page.id && page.access_token) tokens.set(page.id, page.access_token)
  }
  return tokens
}
