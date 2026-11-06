import { NextResponse, after } from 'next/server'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { cocinaAutorizada, cuerpoDe, error, noAutorizado } from '@/lib/cocina/api'
import { avisarDeLaPregunta } from '@/lib/cocina/avisar'
import { COMANDA_NO_EXISTE, COMANDA_SIN_TOMAR, COMANDA_TERMINADA, transicionInvalida } from '@/lib/cocina/cocina'
import { YA_PREGUNTA, preguntaDe, preguntaParaElChef } from '@/lib/cocina/pregunta'
import { preguntar } from '@/lib/cocina/preguntar'

export const dynamic = 'force-dynamic'

/**
 * El chef le pregunta algo al dueño de una comanda: el texto, las opciones (o ninguna, para una
 * respuesta libre), el plazo y lo que hace si nadie contesta. La comanda pasa a `pregunta` y espera;
 * la respuesta —o el plazo— la devuelve a donde estaba. El contrato, en `docs/cocina-api.md`.
 *
 * El correo al dueño sale después de responder (`after`), y solo si esta llamada hizo la pregunta:
 * un reintento con la misma devuelve `200` y no manda otro.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!cocinaAutorizada(request)) return noAutorizado()
  const cuerpo = await cuerpoDe(request)
  if (!cuerpo) return error(400, CUERPO_ILEGIBLE)
  const ahora = new Date()
  const nueva = preguntaDe(cuerpo, ahora)
  if ('error' in nueva) return error(400, nueva.error)
  const { id } = await params
  const r = await preguntar(id, nueva, ahora)
  if ('falla' in r) {
    if (r.falla === 'no-existe') return error(404, COMANDA_NO_EXISTE)
    if (r.falla === 'transicion') return error(409, transicionInvalida(r.de, 'pregunta'))
    if (r.falla === 'ya-pregunta') return error(409, YA_PREGUNTA)
    return error(409, r.falla === 'sin-tomar' ? COMANDA_SIN_TOMAR : COMANDA_TERMINADA)
  }
  const preguntaId = r.pregunta.id
  if (r.nueva) after(() => avisarDeLaPregunta(preguntaId))
  return NextResponse.json(
    { ok: true, id: r.comanda.id, estado: 'pregunta', repetida: !r.nueva, pregunta: preguntaParaElChef(r.pregunta) },
    { status: r.nueva ? 201 : 200 },
  )
}
