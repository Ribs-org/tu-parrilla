import { NextResponse, after } from 'next/server'
import { duenoDeLaLlave } from '@/lib/llaves'
import { clienteGithub } from '@/lib/sugerencias/github'
import { avisarDeLaRespuesta, responderSugerencia } from '@/lib/sugerencias/responder'
import { SOLO_EL_ADMIN, pedidoDeRespuesta } from '@/lib/sugerencias/respuestas'
import { buscarPorId } from '@/lib/usuarios'

export const dynamic = 'force-dynamic'

/**
 * La respuesta del equipo a una sugerencia, sin el navegador: para el equipo de desarrollo, que
 * trabaja desde el número del issue. `{ "issue": 321, "respuesta": "…" }` o `{ "id": "<uuid>",
 * "respuesta": "…" }`, con una llave de La Cocina cuyo dueño es el admin (o `SCHEDULE_API_KEY`,
 * que actúa como el admin). Hace lo mismo que Las Sugerencias en el panel: guarda la respuesta,
 * la persona la lee en el libro, y después de responder salen el correo (la primera vez) y el
 * comentario del issue.
 *
 * `401` sin una llave que sirva; `403` si la llave es de otra cuenta; `400` con la frase si falta
 * cuál o la respuesta; `404` si no hay ninguna con ese issue o ese id.
 */
export async function POST(request: Request) {
  const ownerId = await duenoDeLaLlave(request)
  const usuario = ownerId ? await buscarPorId(ownerId) : null
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })
  if (usuario.rol !== 'admin') return NextResponse.json({ error: SOLO_EL_ADMIN }, { status: 403 })

  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo inválido.' }, { status: 400 })
  }
  const pedido = pedidoDeRespuesta(cuerpo)
  if ('error' in pedido) return NextResponse.json({ error: pedido.error }, { status: 400 })

  const r = await responderSugerencia(usuario, pedido.cual, pedido.texto)
  if ('error' in r) return NextResponse.json({ error: r.error }, { status: r.status })
  if (r.cambio) {
    after(async () => {
      await avisarDeLaRespuesta(r.id, r.primera, clienteGithub())
    })
  }
  return NextResponse.json({ ok: true, sugerencia: r })
}
