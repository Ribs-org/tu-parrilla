import { NextResponse } from 'next/server'
import { postParaEditarEnElTelefono } from '@/lib/editar-movil'
import { CUERPO_ILEGIBLE, resolverCuando } from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { BORRADO_YA_PUBLICADO } from '@/lib/schedule-api'
import { borrarPostProgramado } from '@/lib/social/publish/borrar'
import {
  CONSERVAR,
  EN_CURSO,
  POST_NO_EXISTE,
  YA_SALIO_EN_ALGUNA,
  editarPostProgramado,
} from '@/lib/social/publish/editar'
import { esUuid } from '@/lib/uuid'

export const dynamic = 'force-dynamic'

// Un post programado tocado desde La Parrilla del teléfono: abrirlo, corregirlo y borrarlo. Las
// reglas son las del panel —`editarPostProgramado` y `borrarPostProgramado`, compartidas—, con
// una reja más para el teléfono: un post que ya salió en alguna cuenta se corrige en el panel.
// `404` no distingue «no existe» de «no es tuyo», como el resto de la API.

/** El post para la pantalla de edición: texto, hora, destinos y lo que se guarda sin tocar. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const post = await postParaEditarEnElTelefono(usuario.id, (await params).id, usuario.zona)
  if (!post) return NextResponse.json({ error: POST_NO_EXISTE }, { status: 404 })
  return NextResponse.json(post)
}

/**
 * «Guardar»: `{ texto, cuando?, quitar? }`. `cuando` es la hora nueva como ISO, ya resuelta en
 * el reloj del teléfono como al programar; sin él, la hora no cambia (y puede haber pasado: es
 * corregir el texto de lo que falló). `quitar`, los ids de los destinos que se sacan. Todo lo
 * demás —los archivos, la portada, los atributos, la palabra clave— queda como está.
 */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const { id } = await params
  if (!esUuid(id)) return NextResponse.json({ error: POST_NO_EXISTE }, { status: 404 })

  let body: { texto?: unknown; cuando?: unknown; quitar?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const quitar = body?.quitar ?? []
  if (
    typeof body?.texto !== 'string' ||
    (body.cuando !== undefined && body.cuando !== null && typeof body.cuando !== 'string') ||
    !Array.isArray(quitar) ||
    !quitar.every((q) => typeof q === 'string')
  ) {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }

  const resultado = await editarPostProgramado(
    usuario.id,
    id,
    {
      caption: body.texto.trim(),
      scheduledAt: typeof body.cuando === 'string' ? resolverCuando(false, body.cuando, new Date()) : CONSERVAR,
      cuentas: { quitar: quitar as string[] },
      media: CONSERVAR,
      portada: CONSERVAR,
      atributos: CONSERVAR,
      regla: CONSERVAR,
    },
    { soloSinPublicar: true },
  )
  if ('error' in resultado) {
    const status =
      resultado.error === POST_NO_EXISTE ? 404 : resultado.error === EN_CURSO || resultado.error === YA_SALIO_EN_ALGUNA ? 409 : 400
    return NextResponse.json({ error: resultado.error }, { status })
  }
  return NextResponse.json({ ok: true })
}

/** «Borrar publicación»: la misma regla que el panel y la API, que no borran lo que ya salió. */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  const resultado = await borrarPostProgramado(usuario.id, (await params).id)
  if (resultado === 'no-existe') return NextResponse.json({ error: POST_NO_EXISTE }, { status: 404 })
  if (resultado === 'publicado') return NextResponse.json({ error: BORRADO_YA_PUBLICADO }, { status: 409 })
  return NextResponse.json({ ok: true })
}
