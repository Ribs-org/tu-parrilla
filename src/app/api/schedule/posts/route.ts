import { NextResponse } from 'next/server'
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostMedia, scheduledPostTargets, socialAccounts } from '@/db'
import { duenoDeLaLlave } from '@/lib/llaves'
import { armarProgramados, parseVentana } from '@/lib/schedule-api'
import { buscarPorId } from '@/lib/usuarios'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

export const dynamic = 'force-dynamic'

/**
 * Lo que hay en el calendario entre dos días: programado, publicando, publicado o
 * fallido, con el estado por red. Es la vista del editor-LLM sobre la parrilla, la
 * misma que el panel dibuja por semana — acá por rango, para que pueda decidir la
 * próxima tanda sabiendo qué ya está puesto.
 */
export async function GET(request: Request) {
  // Lo que se lee es del dueño de la llave, y las horas que salen van en su zona (la de Tu
  // Cuenta). Se resuelve antes de la ventana porque `desde`/`hasta` son días, y un día solo
  // existe en una zona.
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO

  const url = new URL(request.url)
  const ventana = parseVentana(
    url.searchParams.get('desde'),
    url.searchParams.get('hasta'),
    new Date(),
    zone,
  )
  if ('error' in ventana) return NextResponse.json({ error: ventana.error }, { status: 400 })

  const db = getDb()
  // `leftJoin` y no `innerJoin` con `socialAccounts`: un destino cuya cuenta ya no
  // exista no debe desaparecer de la respuesta — mismo criterio que el calendario del
  // panel (`(dash)/schedule/page.tsx`). El id del destino sigue viniendo de
  // `scheduledPostTargets.accountId`, no de este join; solo el handle depende de él.
  const filas = await db
    .select({ post: scheduledPosts, target: scheduledPostTargets, handle: socialAccounts.handle })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(
      and(
        eq(scheduledPosts.ownerId, ownerId),
        gte(scheduledPosts.scheduledAt, ventana.from),
        lt(scheduledPosts.scheduledAt, ventana.to),
      ),
    )
    .orderBy(asc(scheduledPosts.scheduledAt), asc(scheduledPostTargets.network))

  const ids = [...new Set(filas.map((f) => f.post.id))]
  const medias = ids.length
    ? await db.select().from(scheduledPostMedia).where(inArray(scheduledPostMedia.postId, ids))
    : []

  return NextResponse.json({
    desde: ventana.desde,
    hasta: ventana.hasta,
    posts: armarProgramados(filas, medias, zone),
  })
}
