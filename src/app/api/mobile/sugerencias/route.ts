import { NextResponse, after } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { resumirApp } from '@/lib/sugerencias/formato'
import { clienteGithub } from '@/lib/sugerencias/github'
import { mandarSugerencia, recibirSugerencia } from '@/lib/sugerencias/guardar'

export const dynamic = 'force-dynamic'

/**
 * El libro de sugerencias desde Ajustes de la app del teléfono: lo mismo que la ventana del
 * panel (`escribirEnElLibro`). `{ "tipo": "idea", "texto": "…", "app": { "version", "actualizacion",
 * "plataforma" } }`. Responde `{ ok: true }` apenas queda guardada; el issue sale después.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }
  const resultado = await recibirSugerencia(usuario, cuerpo, {
    origen: 'telefono',
    pantalla: null,
    navegador: resumirApp((cuerpo as { app?: unknown } | null)?.app),
  })
  if ('error' in resultado) return NextResponse.json({ error: resultado.error }, { status: 400 })
  after(async () => {
    try {
      await mandarSugerencia(resultado.id, clienteGithub())
    } catch (error) {
      console.error('No se pudo mandar la sugerencia a GitHub; queda para el cron:', String(error).slice(0, 300))
    }
  })
  return NextResponse.json({ ok: true })
}
