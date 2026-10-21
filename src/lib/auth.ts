import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import type { Usuario } from '@/db'
import { firmarSesion, leerSesion, MAX_AGE_SECONDS } from './sesion-token'
import { buscarPorId } from './usuarios'

const COOKIE_NAME = 'pf_session'

export async function createSession(usuario: Pick<Usuario, 'id' | 'rol' | 'sesionVersion'>): Promise<void> {
  const token = await firmarSesion({ sub: usuario.id, rol: usuario.rol, sv: usuario.sesionVersion })
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

/**
 * Quién está detrás de la cookie, o null. Se relee la fila: si el usuario subió su
 * `sesion_version` (cerró todas sus sesiones) o fue quitado, la cookie muere aquí.
 *
 * Envuelta en `cache()`: el layout del panel y la página llaman a `requireUser` en la misma
 * petición, y cada llamada era una lectura de `users`. Fuera de un render (una acción, una
 * ruta) `cache` no guarda nada y cada llamada lee.
 */
export const usuarioActual = cache(async (): Promise<Usuario | null> => {
  const store = await cookies()
  const claims = await leerSesion(store.get(COOKIE_NAME)?.value ?? '')
  if (!claims) return null
  const usuario = await buscarPorId(claims.sub)
  if (!usuario || usuario.sesionVersion !== claims.sv) return null
  return usuario
})

export async function requireUser(): Promise<Usuario> {
  const usuario = await usuarioActual()
  if (!usuario) redirect('/ingresar')
  return usuario
}

export async function requireAdmin(): Promise<Usuario> {
  const usuario = await requireUser()
  if (usuario.rol !== 'admin') redirect('/admin')
  return usuario
}

export { COOKIE_NAME }
