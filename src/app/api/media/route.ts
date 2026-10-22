import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { duenoDeLaLlave } from '@/lib/llaves'
import { subidaDeLaApi } from '@/lib/media-api'
import { CUERPO_ILEGIBLE } from '@/lib/mobile-api'
import { CACHE_INMUTABLE, SIN_ALMACEN, SUBIDA_SEGUNDOS, urlParaSubir } from '@/lib/storage'

export const dynamic = 'force-dynamic'

/**
 * Un PUT firmado para que un cliente de la API suba un archivo directo al almacén, una vez,
 * y lo nombre después en el `media` de las filas del lote por su `url`: el lote no lo vuelve
 * a bajar (`traerMedia`, batch.ts). Es lo que hace el teléfono (`api/mobile/upload-url`), con
 * una llave de «Tu propio chef» (La Cocina) en vez del token del teléfono, y la clave en la
 * carpeta del dueño.
 *
 * Lo que se suba y ningún post nombre en la hora siguiente lo borra el barrido de huérfanos
 * (`storage-gc.ts`).
 */
export async function POST(request: Request) {
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  let body: { nombre?: unknown; tipo?: unknown; bytes?: unknown }
  try {
    const crudo: unknown = await request.json()
    if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) throw new Error('no es objeto')
    body = crudo
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const nombre = typeof body.nombre === 'string' ? body.nombre : ''
  const tipo = typeof body.tipo === 'string' ? body.tipo : ''
  const subida = subidaDeLaApi(ownerId, nombre, tipo, body.bytes, randomUUID())
  if ('error' in subida) return NextResponse.json({ error: subida.error }, { status: 400 })

  try {
    const vence = new Date(Date.now() + SUBIDA_SEGUNDOS * 1000).toISOString()
    const { subir, publica } = await urlParaSubir(subida.key, subida.tipo)
    // Las dos cabeceras van dentro de la firma: el PUT tiene que mandarlas letra por letra o
    // el almacén responde 403. `tipo` ya es el canónico (`image/jpg` se firma `image/jpeg`).
    return NextResponse.json({
      url: publica,
      subir,
      cabeceras: { 'Content-Type': subida.tipo, 'Cache-Control': CACHE_INMUTABLE },
      mediaType: subida.mediaType,
      vence,
    })
  } catch (error) {
    console.error('api/media:', String(error).slice(0, 300))
    return NextResponse.json({ error: SIN_ALMACEN }, { status: 500 })
  }
}
