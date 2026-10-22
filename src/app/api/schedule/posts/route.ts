import { NextResponse } from 'next/server'
import { and, asc, eq, exists, gte, inArray, lt, type SQL } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostMedia, scheduledPostTargets, socialAccounts } from '@/db'
import { duenoDeLaLlave } from '@/lib/llaves'
import { armarProgramados, parseEstado, parseVentana } from '@/lib/schedule-api'
import { buscarPorId } from '@/lib/usuarios'
import { ZONA_POR_DEFECTO } from '@/lib/zona'

export const dynamic = 'force-dynamic'

/**
 * Lo que hay en el calendario entre dos días: programado, publicando, publicado o
 * fallido, con el estado por red. Es la vista del editor-LLM sobre la parrilla, la
 * misma que el panel dibuja por semana — acá por rango, para que pueda decidir la
 * próxima tanda sabiendo qué ya está puesto. Con `estado`, solo los posts con algún destino
 * en ese estado (`parseEstado`).
 */
export async function GET(request: Request) {
  // Lo que se lee es del dueño de la llave, y las horas que salen van en su zona (la de Tu
  // Cuenta). Se resuelve antes de la ventana porque `desde`/`hasta` son días, y un día solo
  // existe en una zona.
  const ownerId = await duenoDeLaLlave(request)
  if (!ownerId) return new NextResponse('No autorizado', { status: 401 })
  const zone = (await buscarPorId(ownerId))?.zona ?? ZONA_POR_DEFECTO

  const url = new URL(request.url)
  const filtro = parseEstado(url.searchParams.get('estado'))
  if ('error' in filtro) return NextResponse.json({ error: filtro.error }, { status: 400 })
  const desde = url.searchParams.get('desde')
  const hasta = url.searchParams.get('hasta')
  // Con `estado` y sin fechas no hay ventana: lo quemado puede ser de cualquier día, y para
  // encontrarlo había que bajar el calendario entero.
  const sinVentana = filtro.estado !== null && desde === null && hasta === null
  const ventana = sinVentana ? null : parseVentana(desde, hasta, new Date(), zone)
  if (ventana && 'error' in ventana) return NextResponse.json({ error: ventana.error }, { status: 400 })

  const db = getDb()
  const condiciones: SQL[] = []
  if (ventana) condiciones.push(gte(scheduledPosts.scheduledAt, ventana.from), lt(scheduledPosts.scheduledAt, ventana.to))
  if (filtro.estado) {
    // Los posts con algún destino en ese estado, con todos sus destinos: el de afuera trae a
    // los demás, para que se vea qué salió y qué no.
    condiciones.push(
      exists(
        db
          .select({ id: scheduledPostTargets.id })
          .from(scheduledPostTargets)
          .where(and(eq(scheduledPostTargets.postId, scheduledPosts.id), eq(scheduledPostTargets.status, filtro.estado))),
      ),
    )
  }
  // `leftJoin` y no `innerJoin` con `socialAccounts`: un destino cuya cuenta ya no
  // exista no debe desaparecer de la respuesta — mismo criterio que el calendario del
  // panel (`(dash)/schedule/page.tsx`). El id del destino sigue viniendo de
  // `scheduledPostTargets.accountId`, no de este join; solo el handle depende de él.
  const filas = await db
    .select({ post: scheduledPosts, target: scheduledPostTargets, handle: socialAccounts.handle })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(and(...condiciones, eq(scheduledPosts.ownerId, ownerId)))
    .orderBy(asc(scheduledPosts.scheduledAt), asc(scheduledPostTargets.network))

  const ids = [...new Set(filas.map((f) => f.post.id))]
  const medias = ids.length
    ? await db.select().from(scheduledPostMedia).where(inArray(scheduledPostMedia.postId, ids))
    : []

  return NextResponse.json({
    desde: ventana?.desde ?? null,
    hasta: ventana?.hasta ?? null,
    ...(filtro.estado ? { estado: filtro.estado } : {}),
    posts: armarProgramados(filas, medias, zone),
  })
}
