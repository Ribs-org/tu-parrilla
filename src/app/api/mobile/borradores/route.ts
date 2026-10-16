import { NextResponse } from 'next/server'
import { camposDesdeTelefono, idDeBorrador } from '@/lib/borrador'
import { cargarBorrador, guardarBorrador, type MediaDeBorrador } from '@/lib/borradores'
import { cuentasParaElTelefono } from '@/lib/borradores-movil'
import {
  ARCHIVO_AJENO,
  BORRADOR_NO_EXISTE,
  CUERPO_ILEGIBLE,
  parseBorradorMovil,
  parseMediaMovil,
  resolverCuando,
} from '@/lib/mobile-api'
import { requireMobileUser } from '@/lib/mobile-guardia'
import { basePublica, keyDesdeUrl } from '@/lib/storage'
import { toZonedInput } from '@/lib/utils'

export const dynamic = 'force-dynamic'

/**
 * Lo que Publicar guarda mientras se escribe, cada vez que se detiene un momento: el mismo
 * borrador que el compositor del panel (`guardarBorradorAccion`), así que lo empezado en el
 * teléfono se sigue en el panel y al revés.
 *
 * El cuerpo es el de `POST /api/mobile/schedule` —`texto`, `cuentas`, `cuando`, `opciones`,
 * `media`— más el `id` del borrador si ya existe, y un `nombre` por archivo. Sin `id`, crea
 * uno. Un `id` que ya no existe responde 404 y no se recrea, como en el panel: alguien lo
 * programó o lo descartó en otro lado.
 *
 * Como en el panel, la media se revisa salvo por la existencia de cada archivo: un HEAD
 * por archivo en cada pausa es caro, y al programar se comprueba igual.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) return new NextResponse('No autorizado', { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const datos = parseBorradorMovil(body)
  if ('error' in datos) return NextResponse.json({ error: datos.error }, { status: 400 })
  const lista = parseMediaMovil(body)
  if ('error' in lista) return NextResponse.json({ error: lista.error }, { status: 400 })

  const crudo = body as { id?: unknown; media?: unknown }
  let id: string | null = null
  if (crudo.id !== undefined && crudo.id !== null) {
    id = idDeBorrador(crudo.id)
    if (!id) return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })
  }

  const base = basePublica()
  for (const m of lista) {
    const key = base ? keyDesdeUrl(base, m.url) : null
    if (!key || !key.startsWith('scheduled/')) return NextResponse.json({ error: ARCHIVO_AJENO }, { status: 400 })
  }
  const nombres = Array.isArray(crudo.media) ? crudo.media : []
  const media: MediaDeBorrador[] = lista.map((m, i) => {
    const nombre = (nombres[i] as { nombre?: unknown }).nombre
    return { ...m, nombre: typeof nombre === 'string' && nombre !== '' ? nombre : (m.url.split('/').pop() ?? '') }
  })

  const anterior = id ? await cargarBorrador(usuario.id, id) : null
  if (id && !anterior) return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })

  // Solo cuentas del dueño que el teléfono publica: una que no, el teléfono no la pudo
  // haber mostrado. Las demás del borrador las conserva `camposDesdeTelefono`.
  const { propias, ajenas } = await cuentasParaElTelefono(usuario.id)
  const cuentas = datos.cuentas.filter((c) => propias.has(c))
  const trial = Object.entries(datos.opciones)
    .filter(([c, o]) => cuentas.includes(c) && (o as { trialReel?: unknown }).trialReel === true)
    .map(([c]) => c)

  // El teléfono manda el instante ya resuelto; el panel lee la hora de pared en la zona
  // del dueño. Con las dos se guarda: `fecha` para el calendario, el campo para el panel.
  const fecha = resolverCuando(false, datos.cuando, new Date())
  const campos = camposDesdeTelefono(
    anterior?.campos ?? null,
    { texto: datos.texto, cuentas, scheduledAt: toZonedInput(fecha, usuario.zona), trial },
    ajenas,
  )

  const resultado = await guardarBorrador(usuario.id, { id, campos, fecha, media })
  if ('perdido' in resultado) return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })
  return NextResponse.json({ id: resultado.id })
}
