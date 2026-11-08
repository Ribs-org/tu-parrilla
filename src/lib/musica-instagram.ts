import 'server-only'
import { generateText } from 'ai'
import { and, eq } from 'drizzle-orm'
import { getDb, socialAccounts } from '@/db'
import { env } from './env'
import { hayPasarela } from './social/comentarios/modelo'
import { decryptToken } from './social/crypto'
import {
  MemoriaDeCanciones,
  buscarCanciones,
  cancionPorId,
  llaveDeMemoria,
  type CancionInstagram,
  type CuentaDeAudio,
} from './social/instagram-audio'
import { conLoginDeInstagram } from './social/instagram-login'
import { sugerirCancion, type PedirAlModelo, type Sugerencia } from './social/musica-sugerencia'
import { MUSICA_LOGIN_INSTAGRAM } from './social/publish/opciones'
import { conTokens, quedanTokens } from './planes/tokens'
import { esUuid } from './uuid'

// «Música de Instagram» para el panel y el teléfono: la cuenta del dueño, su token y la memoria
// de lo que está sonando. Las acciones del compositor (`admin/musica-actions.ts`) y las rutas
// del teléfono (`api/mobile/musica`) solo traducen esto.

export const CUENTA_SIN_MUSICA = 'Esa cuenta no es una cuenta de Instagram tuya conectada.'

/**
 * El modelo de «Sugiéreme una». Elegir una canción de una lista es poco: el barato de siempre
 * alcanza. Se cambia sin desplegar con `MUSICA_MODELO`, con la forma `proveedor/modelo`; el
 * nombre que no existe hace que elija el azar, no que el botón falle.
 */
export const MODELO_MUSICA_POR_DEFECTO = 'anthropic/claude-haiku-4.5'
const MAX_TOKENS = 200
const TIMEOUT_MS = 15_000

const memoria = new MemoriaDeCanciones()

/**
 * La cuenta con que se le pregunta a Meta, solo si es del dueño, de Instagram, está conectada y
 * con el login de Facebook. Una ajena y una que no existe dan la misma frase.
 */
export async function cuentaDeMusica(
  ownerId: string,
  cuentaId: unknown,
): Promise<{ cuenta: CuentaDeAudio & { id: string } } | { error: string }> {
  if (!esUuid(cuentaId)) return { error: CUENTA_SIN_MUSICA }
  const [fila] = await getDb()
    .select({
      id: socialAccounts.id,
      network: socialAccounts.network,
      externalId: socialAccounts.externalId,
      accessToken: socialAccounts.accessToken,
      login: socialAccounts.login,
    })
    .from(socialAccounts)
    .where(and(eq(socialAccounts.id, cuentaId), eq(socialAccounts.ownerId, ownerId)))
  if (!fila || fila.network !== 'instagram' || !fila.accessToken || !fila.externalId) return { error: CUENTA_SIN_MUSICA }
  if (conLoginDeInstagram(fila)) return { error: MUSICA_LOGIN_INSTAGRAM }
  return { cuenta: { id: fila.id, igUserId: fila.externalId, token: decryptToken(fila.accessToken) } }
}

/** Con memoria: lo que está sonando, o una búsqueda, de esta cuenta. */
async function buscarConMemoria(
  cuenta: CuentaDeAudio & { id: string },
  busqueda: string | null,
): Promise<{ canciones: CancionInstagram[] } | { error: string }> {
  const llave = llaveDeMemoria(cuenta.id, busqueda)
  const guardadas = memoria.leer(llave)
  if (guardadas) return { canciones: guardadas }
  const r = await buscarCanciones(cuenta, busqueda)
  if ('canciones' in r) memoria.guardar(llave, r.canciones)
  return r
}

/** Lo que está sonando (sin `busqueda`) o lo que encuentra una búsqueda, para la cuenta. */
export async function musicaDeLaCuenta(
  ownerId: string,
  cuentaId: unknown,
  busqueda: string | null,
): Promise<{ canciones: CancionInstagram[] } | { error: string }> {
  const r = await cuentaDeMusica(ownerId, cuentaId)
  if ('error' in r) return r
  return buscarConMemoria(r.cuenta, busqueda?.trim() ? busqueda.trim().slice(0, 100) : null)
}

/** Una canción por su id, con su muestra al día: la de un borrador abierto, para escucharla. */
export async function cancionDeLaCuenta(
  ownerId: string,
  cuentaId: unknown,
  audioId: string,
): Promise<{ cancion: CancionInstagram | null } | { error: string }> {
  const r = await cuentaDeMusica(ownerId, cuentaId)
  if ('error' in r) return r
  return cancionPorId(r.cuenta, audioId)
}

/** La llamada al modelo, con los tokens que gastó para el tope del plan (`planes/tokens.ts`). */
async function pedirAlModelo(instrucciones: string, pedido: string): Promise<{ valor: string; tokens: number | undefined }> {
  const { text, usage } = await generateText({
    model: env('MUSICA_MODELO') ?? MODELO_MUSICA_POR_DEFECTO,
    instructions: instrucciones,
    prompt: pedido,
    maxOutputTokens: MAX_TOKENS,
    // Como en los comentarios (`comentarios/modelo.ts`): un modelo de razonamiento se gastaría
    // el tope pensando y no contestaría el JSON.
    providerOptions: { gateway: { reasoning: { enabled: false } } },
    abortSignal: AbortSignal.timeout(TIMEOUT_MS),
  })
  return { valor: text, tokens: usage.totalTokens }
}

/** Lo que pide «Sugiéreme una», ya limpio: lo demás de la entrada no se mira. */
export type PedidoDeSugerencia = { texto: string; vistas: string[]; busquedas: string[] | null }

/** El cuerpo de un pedido de sugerencia, del panel o del teléfono, con topes. */
export function leerPedidoDeSugerencia(crudo: unknown): PedidoDeSugerencia {
  const c = typeof crudo === 'object' && crudo !== null ? (crudo as Record<string, unknown>) : {}
  const texto = typeof c.texto === 'string' ? c.texto.slice(0, 5000) : ''
  const vistas = Array.isArray(c.vistas)
    ? c.vistas.filter((v): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(v)).slice(0, 300)
    : []
  const busquedas = Array.isArray(c.busquedas) ? c.busquedas.filter((b): b is string => typeof b === 'string') : null
  return { texto, vistas, busquedas }
}

export async function sugerenciaParaLaCuenta(
  ownerId: string,
  cuentaId: unknown,
  pedido: PedidoDeSugerencia,
): Promise<{ sugerencia: Sugerencia; busquedas: string[] } | { agotadas: true; busquedas: string[] } | { error: string }> {
  const r = await cuentaDeMusica(ownerId, cuentaId)
  if ('error' in r) return r
  // Sin pasarela o sin tokens del plan, sin modelo: elige al azar entre lo que encontró, como
  // siempre que el modelo no contesta. Si los tokens se acaban entre las dos llamadas, la segunda
  // lanza `SinTokens` y `sugerirCancion` cae al azar igual.
  const conModelo = hayPasarela() && (await quedanTokens(ownerId))
  const conTope: PedirAlModelo = (instrucciones, texto) => conTokens(ownerId, () => pedirAlModelo(instrucciones, texto))
  return sugerirCancion(pedido, {
    buscar: (busqueda) => buscarConMemoria(r.cuenta, busqueda),
    pedirAlModelo: conModelo ? conTope : null,
  })
}
