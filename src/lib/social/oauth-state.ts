import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env'

/**
 * The `state` that survives the round trip to instagram.com and tiktok.com.
 *
 * It is signed with the raw `AUTH_SECRET`, while the admin session cookie is signed with
 * a key HKDF derives from that same secret for the session alone — and unlike the cookie
 * this travels in a query string, through the network's servers, into browser history,
 * into their logs. So it carries a claim of its own too: neither token verifies as the
 * other, in either direction, since the keys themselves differ before the claims are
 * even compared.
 *
 * Minting and checking live together on purpose. Split across the two routes, the claim
 * is one careless edit away from being written but never read, which is exactly the
 * hole this closes.
 *
 * It ties the round trip to this user and this network.
 */
const PURPOSE = 'social-oauth-state'

function secret(): Uint8Array {
  const value = env('AUTH_SECRET')
  if (!value) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(value)
}

/**
 * Short-lived by design: it only has to outlive the owner's trip through a consent screen.
 *
 * `login` es el login con que salió una red que tiene más de uno (Instagram: `instagram` es el
 * login de Instagram). Viaja firmado y no en la dirección de vuelta: las dos vueltas llegan al
 * mismo callback, y lo que decide con qué host y qué secreto se canjea el código no puede
 * elegirlo quien arma el enlace.
 */
export function signOAuthState(network: string, ownerId: string, login?: string): Promise<string> {
  return new SignJWT({ purpose: PURPOSE, network, ...(login ? { login } : {}) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .setSubject(ownerId)
    .sign(secret())
}

/**
 * Lo que el state dice, solo si esta app lo firmó para esta misma red y este mismo dueño: el
 * login con que salió, o null si no llevaba ninguno. Null entero si no calza.
 */
export async function leerOAuthState(
  state: string,
  network: string,
  ownerId: string,
): Promise<{ login: string | null } | null> {
  try {
    const { payload } = await jwtVerify(state, secret())
    if (payload.purpose !== PURPOSE || payload.network !== network || payload.sub !== ownerId) return null
    return { login: typeof payload.login === 'string' ? payload.login : null }
  } catch {
    return null
  }
}

/**
 * Un state que además nombra una cuenta ya conectada: la vuelta no crea una fila, le agrega algo a
 * esa (los comentarios de TikTok, `social/tiktok-business.ts`). La cuenta viaja firmada por la
 * misma razón que `login`: quien arma el enlace no puede elegir a qué fila se le pega la credencial.
 */
export function signOAuthStateDeCuenta(network: string, ownerId: string, cuenta: string): Promise<string> {
  return new SignJWT({ purpose: PURPOSE, network, cuenta })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .setSubject(ownerId)
    .sign(secret())
}

/** La cuenta que firmó `signOAuthStateDeCuenta` para esta red y este dueño, o null si no calza. */
export async function leerCuentaDeOAuthState(state: string, network: string, ownerId: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(state, secret())
    if (payload.purpose !== PURPOSE || payload.network !== network || payload.sub !== ownerId) return null
    return typeof payload.cuenta === 'string' ? payload.cuenta : null
  } catch {
    return null
  }
}

/** True only for a state this app minted, for this same network and this same owner. */
export async function oauthStateMatches(state: string, network: string, ownerId: string): Promise<boolean> {
  return (await leerOAuthState(state, network, ownerId)) !== null
}
