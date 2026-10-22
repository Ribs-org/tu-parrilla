import { NextResponse } from 'next/server'
import { duenoDeLaLlave } from '@/lib/llaves'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { FRASE_DE_FALLA, archivarQuemados } from '@/lib/social/publish/archivar'

/**
 * Lo que trae el cuerpo de `archivar` y `desarchivar`: nada —todo lo quemado del post— o
 * `{ "cuentaId": "…" }`, el destino de esa cuenta. Vacío o sin `cuentaId` valen lo mismo.
 */
export function cuentaDelCuerpo(texto: string): { cuentaId: string | null } | { error: string } {
  if (texto.trim() === '') return { cuentaId: null }
  let crudo: unknown
  try {
    crudo = JSON.parse(texto)
  } catch {
    return { error: CUERPO_ILEGIBLE }
  }
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: CUERPO_ILEGIBLE }
  const { cuentaId } = crudo as { cuentaId?: unknown }
  if (cuentaId === undefined || cuentaId === null) return { cuentaId: null }
  return typeof cuentaId === 'string' ? { cuentaId } : { error: CUERPO_ILEGIBLE }
}

/**
 * `POST /api/schedule/posts/{id}/archivar` y `…/desarchivar`: las dos rutas son esto con un
 * booleano distinto. `404` no distingue «no existe» de «no es del dueño», como el borrado; un
 * destino que no está quemado es `409`, porque el post existe y lo que no cuadra es su estado.
 */
export async function responderArchivo(
  request: Request,
  params: Promise<{ id: string }>,
  archivar: boolean,
): Promise<Response> {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  const { id } = await params
  const cuerpo = cuentaDelCuerpo(await request.text())
  if ('error' in cuerpo) return NextResponse.json({ error: cuerpo.error }, { status: 400 })

  const resultado = await archivarQuemados(ownerId, id, { cuentaId: cuerpo.cuentaId, archivar })
  if ('falla' in resultado) {
    const estado = resultado.falla === 'no-existe' || resultado.falla === 'sin-destino' ? 404 : 409
    return NextResponse.json({ error: FRASE_DE_FALLA[resultado.falla] }, { status: estado })
  }
  return NextResponse.json(
    archivar ? { ok: true, id, archivados: resultado.cambiados } : { ok: true, id, desarchivados: resultado.cambiados },
  )
}
