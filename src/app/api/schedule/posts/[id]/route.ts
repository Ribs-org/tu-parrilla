import { NextResponse } from 'next/server'
import { duenoDeLaLlave } from '@/lib/llaves'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'
import { borrarPostProgramado } from '@/lib/social/publish/borrar'

export const dynamic = 'force-dynamic'

/**
 * Saca un post programado por API: el que `POST /api/schedule/batch` devolvió como
 * `postId`, o el que lista `GET /api/schedule/posts`. La regla es la misma que la del
 * panel, y se comparte con él en `borrarPostProgramado` para que no puedan divergir:
 * borrar la fila no despublica nada en la red, así que un post con algún destino ya
 * publicado o publicando se rechaza con la frase de siempre.
 *
 * `404` no distingue «no existe» de «no es del dueño» a propósito: lo que entra por una
 * llave es de su dueño, y nombrar la diferencia le diría a quien tiene la llave de un
 * usuario qué ids existen entre los posts de otro.
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  const { id } = await params

  const resultado = await borrarPostProgramado(ownerId, id)
  if (resultado === 'no-existe') return NextResponse.json({ error: 'Ese post no existe.' }, { status: 404 })
  if (resultado === 'publicado') return NextResponse.json({ error: BORRADO_YA_PUBLICADO }, { status: 409 })
  return NextResponse.json({ ok: true, id })
}
