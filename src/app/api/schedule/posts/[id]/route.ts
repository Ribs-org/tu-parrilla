import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { scheduledPosts } from '@/db'
import { duenoDeLaLlave } from '@/lib/llaves'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'
import { leerProgramados } from '@/lib/schedule-leer'
import { borrarPostProgramado } from '@/lib/social/publish/borrar'
import { POST_NO_EXISTE_API, SOLO_FECHA, cambiarFecha, traeMasQueLaFecha } from '@/lib/social/publish/cambiar-fecha'
import { buscarPorId } from '@/lib/usuarios'
import { esUuid } from '@/lib/uuid'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

export const dynamic = 'force-dynamic'

const NO_EXISTE = POST_NO_EXISTE_API

/**
 * Un post programado por su id, con la misma forma que cada elemento de
 * `GET /api/schedule/posts` — incluidas las `opciones` de cada destino—. Es la forma de
 * comprobar qué quedó guardado justo después de programar, sin adivinar la ventana de
 * fechas. Mismo `404` que el `DELETE`, por la misma razón.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  const { id } = await params
  // Un id sin forma de uuid no existe: a la base le llegaría como un error, no como cero filas.
  if (!esUuid(id)) return NextResponse.json({ error: NO_EXISTE }, { status: 404 })

  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO
  const [post] = await leerProgramados(ownerId, [eq(scheduledPosts.id, id)], zone)
  if (!post) return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
  return NextResponse.json(post)
}

/**
 * Mueve un post programado a otra fecha sin borrarlo: `{ "fecha": "2026-11-25 10:00" }`, en la
 * zona del dueño, como en el lote. Conserva el `id`, la media ya guardada, el texto, las opciones,
 * los atributos y la `ref` (`cambiarFecha`). Contesta el post como lo da el `GET`, ya con la
 * fecha nueva; si algo no pasa, el post queda en la de antes. `409` si ya salió en alguna cuenta o
 * está saliendo, y `404` como el `DELETE`.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  const { id } = await params
  let cuerpo: unknown
  try {
    cuerpo = await request.json()
  } catch {
    cuerpo = null
  }
  if (!cuerpo || typeof cuerpo !== 'object' || Array.isArray(cuerpo)) {
    return NextResponse.json({ error: 'El cuerpo debe ser JSON con { fecha }.' }, { status: 400 })
  }
  const campos = cuerpo as Record<string, unknown>
  if (traeMasQueLaFecha(campos, ['fecha'])) return NextResponse.json({ error: SOLO_FECHA }, { status: 400 })

  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO
  const resultado = await cambiarFecha(ownerId, id, campos.fecha, zone)
  if ('error' in resultado) return NextResponse.json({ error: resultado.error }, { status: resultado.status })
  const [post] = await leerProgramados(ownerId, [eq(scheduledPosts.id, id)], zone)
  return NextResponse.json(post ?? { id })
}

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
  if (resultado === 'no-existe') return NextResponse.json({ error: NO_EXISTE }, { status: 404 })
  if (resultado === 'publicado') return NextResponse.json({ error: BORRADO_YA_PUBLICADO }, { status: 409 })
  return NextResponse.json({ ok: true, id })
}
