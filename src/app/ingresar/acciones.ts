'use server'

import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { createSession } from '@/lib/auth'
import { CORREO_INVALIDO, DEMASIADOS_INTENTOS, normalizarCorreo } from '@/lib/ingreso'
import { demasiadosIntentos } from '@/lib/limite-ip'
import { canjear, pedir } from '@/lib/usuarios'

export type FormState = { error?: string; ok?: boolean; correo?: string }

/**
 * Siempre la misma frase, exista o no el correo: la lista de invitados no se revela por
 * la diferencia entre dos mensajes. Tampoco por el tiempo: el código se pide después de
 * responder (`after`), así que la respuesta no espera ni a la base ni al correo, y tarda lo
 * mismo para un invitado que para cualquiera. El admin se asegura ahí (`pedir`) para que el
 * primer ingreso del dueño funcione sin ningún paso previo.
 */
export async function pedirCodigo(_prev: FormState, formData: FormData): Promise<FormState> {
  const correo = normalizarCorreo(String(formData.get('correo') ?? ''))
  if (!correo) return { error: CORREO_INVALIDO }
  if (await demasiadosIntentos('pedir', 10, 10 * 60_000)) redirect(`/ingresar/codigo?correo=${encodeURIComponent(correo)}`)
  after(() => pedirSinLanzar(correo))
  redirect(`/ingresar/codigo?correo=${encodeURIComponent(correo)}`)
}

/** `pedir`, para correr después de la respuesta: su fallo queda en el log, no en la pantalla. */
async function pedirSinLanzar(correo: string): Promise<void> {
  try {
    await pedir(correo)
  } catch (error) {
    console.error('[ingreso] no se pudo pedir el código:', String(error).slice(0, 300))
  }
}

export async function canjearCodigo(_prev: FormState, formData: FormData): Promise<FormState> {
  const correo = normalizarCorreo(String(formData.get('correo') ?? ''))
  const codigo = String(formData.get('codigo') ?? '').replace(/\D/g, '')
  if (!correo) return { error: CORREO_INVALIDO }
  if (await demasiadosIntentos('canjear', 20, 10 * 60_000)) return { error: DEMASIADOS_INTENTOS, correo }

  const resultado = await canjear(correo, codigo)
  if ('error' in resultado) return { error: resultado.error, correo }

  await createSession(resultado.usuario)
  redirect('/admin')
}
