import { NextResponse } from 'next/server'
import { nuevaPieza } from '@/lib/pase/pase'
import { abrirPase, cuerpoJson, rechazo } from '@/lib/pase/http'

export const dynamic = 'force-dynamic'
// Una URL pública se copia al almacén dentro de esta función: hasta 500 MB.
export const maxDuration = 240

/**
 * Una pieza nueva, o la versión siguiente de una, de quien edita: `{ url, titulo?, responde_a?,
 * variante?, notas?, resuelve? }`. `url` es la que dio `POST …/subidas`, o una URL pública que se
 * copia. Con `responde_a`, la versión siguiente de esa pieza; con `variante` (A, B…), una alternativa
 * para comparar; `resuelve`, los ids de las críticas que arregla.
 */
export async function POST(request: Request, { params }: { params: Promise<{ codigo: string }> }) {
  const entrada = await abrirPase((await params).codigo, 'editor')
  if (entrada instanceof NextResponse) return entrada
  const cuerpo = await cuerpoJson(request)
  if (cuerpo instanceof NextResponse) return cuerpo
  const r = await nuevaPieza(entrada.pase, cuerpo)
  if ('error' in r) return rechazo(r.error)
  const { pieza, resueltas } = r
  return NextResponse.json(
    { ok: true, id: pieza.id, grupo: pieza.grupo, version: pieza.version, variante: pieza.variante, url: pieza.url, resueltas },
    { status: 201 },
  )
}
