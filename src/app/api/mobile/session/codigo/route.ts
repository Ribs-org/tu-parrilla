import { NextResponse, after } from 'next/server'
import { normalizarCorreo } from '@/lib/ingreso'
import { demasiadosIntentos } from '@/lib/limite-ip'
import { pedir } from '@/lib/usuarios'

export const dynamic = 'force-dynamic'

/**
 * Siempre { ok: true }: la lista de invitados no se revela por la respuesta. Ni por el
 * tiempo: el código se pide después de responder (`after`), como en el panel.
 */
export async function POST(request: Request) {
  let correo: string | null = null
  try {
    const body = await request.json()
    correo = normalizarCorreo(typeof body.correo === 'string' ? body.correo : '')
  } catch {
    // Cuerpo ilegible: misma respuesta neutra.
  }
  if (correo) {
    if (await demasiadosIntentos('pedir-movil', 10, 10 * 60_000)) return NextResponse.json({ ok: true })
    const pedido = correo
    after(async () => {
      try {
        await pedir(pedido)
      } catch (error) {
        console.error('[ingreso] no se pudo pedir el código:', String(error).slice(0, 300))
      }
    })
  }
  return NextResponse.json({ ok: true })
}
