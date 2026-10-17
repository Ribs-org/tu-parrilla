import { notFound } from 'next/navigation'
import { and, asc, eq } from 'drizzle-orm'
import { getDb, scheduledPosts, scheduledPostTargets, scheduledPostMedia, reglasClave } from '@/db'
import { requireUser } from '@/lib/auth'
import { cuentasFrias } from '@/lib/parrilla'
import { getCuentas } from '@/lib/posts'
import { toZonedInput } from '@/lib/utils'
import { resumenOpciones } from '@/lib/social/publish/opciones'
import { dibujoDe } from '../dibujo'
import { volverDelEditor } from '../enlace'
import { DestinosDelPost } from './destinos'
import { Editor } from './editor'

export const dynamic = 'force-dynamic'

export default async function EditScheduledPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const { id } = await params
  const query = await searchParams
  const volver = volverDelEditor(query.volver)

  // `zona` pinta la hora del campo en la zona del dueño, que es la misma en la que
  // `updateScheduledPost` la vuelve a leer: si no coincidieran, guardar sin tocar la hora
  // la movería.
  const { id: ownerId, zona } = await requireUser()
  const db = getDb()
  const [post] = await db
    .select()
    .from(scheduledPosts)
    .where(and(eq(scheduledPosts.id, id), eq(scheduledPosts.ownerId, ownerId)))
  if (!post) notFound()

  const [targets, media, [regla], cuentas] = await Promise.all([
    db.select().from(scheduledPostTargets).where(eq(scheduledPostTargets.postId, id)),
    db
      .select()
      .from(scheduledPostMedia)
      .where(eq(scheduledPostMedia.postId, id))
      .orderBy(asc(scheduledPostMedia.position)),
    db.select().from(reglasClave).where(eq(reglasClave.postId, id)),
    getCuentas(ownerId),
  ])

  // El corte del post y el estado de cada destino, con el handle de su cuenta y la marca fría
  // si su fierro se apagó: lo mismo que dibuja el calendario, para que digan lo mismo.
  const handles = new Map(cuentas.map((c) => [c.id, c.handle]))
  const destinos = targets.map((t) => ({ ...t, handle: handles.get(t.accountId) ?? null }))
  const dibujo = dibujoDe(destinos, media, cuentasFrias(cuentas, new Date()))

  return (
    <Editor
      postId={id}
      volver={volver}
      cabecera={<DestinosDelPost dibujo={dibujo} destinos={destinos} />}
      caption={post.caption}
      scheduledAtLocal={toZonedInput(post.scheduledAt, zona)}
      cuentas={cuentas}
      targets={targets.map((t) => ({
        accountId: t.accountId,
        network: t.network,
        status: t.status,
        opciones: resumenOpciones(t.network, t.opciones),
      }))}
      media={media.map((m) => ({ id: m.id, blobUrl: m.blobUrl, mediaType: m.mediaType }))}
      coverUrl={post.coverUrl}
      atributos={post.atributos ? JSON.stringify(post.atributos, null, 2) : ''}
      regla={regla ? { palabra: regla.palabra, mensaje: regla.mensaje, respuestaPublica: regla.respuestaPublica } : null}
    />
  )
}
