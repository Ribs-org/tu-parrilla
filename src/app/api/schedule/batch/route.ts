import { NextResponse } from 'next/server'
import { MAX_BATCH_ITEMS, scheduleBatch, type BatchItem } from '@/lib/social/publish/batch'
import { duenoDeLaLlave } from '@/lib/llaves'

export const dynamic = 'force-dynamic'
// Downloads ride inside this function; same budget as the publish cron.
export const maxDuration = 240
/**
 * Lo que queda después de cortar el lote para contestar: la última subida al almacén y la
 * transacción de una fila que ya tenía su media no se cortan, y tienen que caber acá.
 */
const MARGEN_MS = 40_000

export async function POST(request: Request) {
  const inicio = Date.now()
  // Lo que entra por acá es del dueño de la llave: el usuario que la generó en Tu Cuenta,
  // o el admin si es la del despliegue.
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })

  let posts: BatchItem[]
  try {
    const body = (await request.json()) as { posts?: unknown[] }
    if (!Array.isArray(body.posts)) throw new Error('sin posts')
    if (body.posts.length > MAX_BATCH_ITEMS) {
      return NextResponse.json(
        { error: `Máximo ${MAX_BATCH_ITEMS} posts por lote.` },
        { status: 400 },
      )
    }
    // Shape-normalized at the door: a string where an array belongs must become an
    // invalid row with a sentence, never a crash inside the batch loop.
    posts = body.posts.map((raw) => {
      const p = (raw ?? {}) as Record<string, unknown>
      return {
        fecha: typeof p.fecha === 'string' ? p.fecha : '',
        texto: typeof p.texto === 'string' ? p.texto : '',
        cuentas: Array.isArray(p.cuentas) ? p.cuentas.map(String) : [],
        redes: Array.isArray(p.redes) ? p.redes.map(String) : [],
        media: Array.isArray(p.media) ? p.media.map(String) : [],
        portada: typeof p.portada === 'string' ? p.portada : '',
        // Crudo a propósito: la validación con frase fija vive en validateBatchItem.
        atributos: p.atributos,
        opciones: p.opciones,
        regla: p.regla,
        // Cruda también: un número donde va un texto lo rechaza `refDeFila` con su frase.
        ref: p.ref,
        // El atajo de las historias: solo `true` lo prende (`expandirHistoria`).
        historia: p.historia === true ? true : undefined,
      }
    })
  } catch {
    return NextResponse.json(
      { error: 'El cuerpo debe ser JSON con { posts: [...] }.' },
      { status: 400 },
    )
  }

  // Rejected rows are data, not an endpoint failure — same rule as the cron report. Con
  // tiempo propio para contestar: si la función muriera por `maxDuration`, se perderían
  // también los resultados de las filas que sí entraron.
  const resultados = await scheduleBatch(ownerId, posts, inicio + maxDuration * 1000 - MARGEN_MS)
  return NextResponse.json({ resultados })
}
