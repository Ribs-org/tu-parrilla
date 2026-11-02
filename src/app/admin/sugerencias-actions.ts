'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { requireUser } from '@/lib/auth'
import { limpiarPantalla, resumirNavegador } from '@/lib/sugerencias/formato'
import { clienteGithub } from '@/lib/sugerencias/github'
import { mandarSugerencia, recibirSugerencia } from '@/lib/sugerencias/guardar'

export type SugerenciaState = { ok?: true; error?: string }

/**
 * El libro de sugerencias del panel: guarda lo que la persona escribió y responde enseguida. El
 * issue de GitHub se abre después de responder (`after`), así que la ventana no espera a GitHub,
 * y si GitHub falla la sugerencia ya está guardada y la manda el cron. Solo vuelve un error si
 * no se guardó: el texto vacío, demasiado largo o el tope del día.
 */
export async function escribirEnElLibro(entrada: { tipo: string; texto: string; pantalla: string }): Promise<SugerenciaState> {
  const usuario = await requireUser()
  const navegador = resumirNavegador((await headers()).get('user-agent'))
  const resultado = await recibirSugerencia(usuario, entrada, {
    origen: 'panel',
    pantalla: limpiarPantalla(entrada?.pantalla),
    navegador,
  })
  if ('error' in resultado) return { error: resultado.error }
  after(async () => {
    try {
      await mandarSugerencia(resultado.id, clienteGithub())
    } catch (error) {
      console.error('No se pudo mandar la sugerencia a GitHub; queda para el cron:', String(error).slice(0, 300))
    }
  })
  return { ok: true }
}
