import { NextResponse } from 'next/server'
import { enlaceDeSubida } from '@/lib/pase/pase'
import { abrirPase, cuerpoJson, rechazo } from '@/lib/pase/http'

export const dynamic = 'force-dynamic'

/**
 * Un enlace firmado para subir un archivo al pase, de quien edita: `{ tipo, bytes }` →
 * `{ subir, url, contentType }`. Se sube con `PUT subir`, con ese `Content-Type` y
 * `Cache-Control: public, max-age=31536000, immutable`; después, `url` va en `POST …/piezas`.
 */
export async function POST(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const entrada = await abrirPase((await params).codigo, 'editor')
  if (entrada instanceof NextResponse) return entrada
  const cuerpo = await cuerpoJson(request)
  if (cuerpo instanceof NextResponse) return cuerpo
  const r = await enlaceDeSubida(entrada.pase, cuerpo)
  if ('error' in r) return rechazo(r.error)
  return NextResponse.json(r)
}
