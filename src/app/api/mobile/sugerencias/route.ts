import { NextResponse, after } from 'next/server'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { resumirApp } from '@/lib/sugerencias/formato'
import { clienteGithub } from '@/lib/sugerencias/github'
import { mandarSugerencia, recibirSugerencia } from '@/lib/sugerencias/guardar'
import { misSugerencias } from '@/lib/sugerencias/responder'
import { fechaCorta, paraElLibro } from '@/lib/sugerencias/respuestas'

export const dynamic = 'force-dynamic'

/**
 * «Lo que nos escribiste» en la app: lo que escribió quien pregunta, de lo más nuevo a lo más
 * viejo, con lo que le respondió el equipo, y cuántas respuestas no abrió (`sinLeer`, el punto
 * del libro en Ajustes). `{ sinLeer, sugerencias: [{ id, tipo, texto, creadaEn, creadaEnTexto,
 * respuesta, respondidaEn, respondidaEnTexto, nueva }] }`. Las fechas van también escritas
 * («6 nov 2026», en la zona de la cuenta): la app no arma fechas con `Intl`.
 */
export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  const sugerencias = (await misSugerencias(usuario.id)).map(paraElLibro).map((s) => ({
    ...s,
    creadaEnTexto: fechaCorta(s.creadaEn, usuario.zona),
    respondidaEnTexto: s.respondidaEn ? fechaCorta(s.respondidaEn, usuario.zona) : null,
  }))
  return NextResponse.json({ sinLeer: sugerencias.filter((s) => s.nueva).length, sugerencias })
}

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
