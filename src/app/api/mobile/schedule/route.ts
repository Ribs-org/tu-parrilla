import { NextResponse } from 'next/server'
import { and, asc, eq, gt, inArray, lte } from 'drizzle-orm'
import {
  getDb,
  scheduledPosts,
  scheduledPostMedia,
  scheduledPostTargets,
  socialAccounts,
  type ScheduledPost,
  type ScheduledPostTarget,
} from '@/db'
import { localDay } from '@/lib/analytics'
import { randomUUID } from 'node:crypto'
import {
  BORRADOR_ES_HISTORIA,
  esBorradorDeHistoria,
  idDeBorrador,
  opcionesConMusicaDelBorrador,
  reglaDelTelefono,
  soloEnElPanel,
} from '@/lib/borrador'
import { cargarBorrador, listarBorradores } from '@/lib/borradores'
import { cuentasParaElTelefono, resumirParaElTelefono } from '@/lib/borradores-movil'
import { isoInZone } from '@/lib/metrics-api'
import { cuentasFrias, formatoDe, selloDe, type Formato, type Sello } from '@/lib/parrilla'
import { getCuentas } from '@/lib/posts'
import { requireMobileUser } from '@/lib/mobile-guardia'
import {
  ARCHIVO_AJENO,
  ARCHIVO_FALTANTE,
  ARCHIVO_MUY_GRANDE,
  BORRADOR_NO_EXISTE,
  CUERPO_ILEGIBLE,
  MAX_BYTES_SUBIDA,
  NO_SE_GUARDO,
  parseBorradorMovil,
  parseMediaMovil,
  resolverCuando,
  resolverDestinos,
  sabeDe,
  type MediaMovil,
} from '@/lib/mobile-api'
import { validarRegla } from '@/lib/social/comentarios/reglas'
import { recordarMusicaTikTok } from '@/lib/social/publish/tiktok-cuenta'
import { BorradorConsumido, CreativoNoEsta, crearPostProgramado, crearVariosProgramados } from '@/lib/social/publish/crear'
import { CREATIVO_NO_ESTA } from '@/lib/cocina/meson-motivos'
import { CuentaInvalida } from '@/lib/social/cuentas'
import { HISTORIA_DEMASIADAS } from '@/lib/social/publish/batch'
import { extensionDe, validateScheduleDraft } from '@/lib/social/publish/validate'
import {
  HISTORIA_MEDIA,
  MAX_HISTORIAS_SECUENCIA,
  OPCIONES_ERROR,
  errorDeHistoria,
  errorDeMediaPorOpciones,
  esHistoria,
  validarOpcionesPorCuenta,
  type OpcionesDestino,
} from '@/lib/social/publish/opciones'
import { basePublica, keyDesdeUrl, tamanoEnAlmacen } from '@/lib/storage'
import { proximamentePara } from '@/lib/redes-abiertas'

export const dynamic = 'force-dynamic'

/** Una ventana con memoria corta y futuro suficiente para lo que cabe en un pulgar. */
const DIAS_ATRAS = 7
const DIAS_ADELANTE = 30

/** Una fila del `leftJoin`: un post con uno de sus destinos y el handle de su cuenta. */
type FilaDestinoMovil = { post: ScheduledPost; target: ScheduledPostTarget; handle: string | null }

export type PostMovil = {
  id: string
  texto: string
  cuando: string
  portada: string | null
  miniatura: string | null
  /** Qué corte dibuja el teléfono: la misma silueta que el panel (`formatoDe`). */
  formato: Formato
  huesos: number
  /**
   * `sello` es la marca de ese destino en el corte (`selloDe`): la decide el servidor, que
   * es el que sabe si la cuenta se enfrió y si TikTok recibió un borrador, para que el
   * teléfono no repita la regla.
   */
  redes: Array<{
    id: string
    red: string
    handle: string | null
    estado: string
    error: string | null
    sello: Sello
    /** Un destino quemado que alguien archivó: «Se quemó» no lo muestra (`seQuemo`, en la app). */
    archivado: boolean
  }>
}

/**
 * Agrupa las filas del join en un post por id, con sus destinos juntos. Extraída para
 * poder probarla sin base — ver `route.test.ts`.
 *
 * Cada destino lleva su propio `id` (`scheduled_post_targets.id`), no solo `red`: con
 * dos cuentas de la misma red, dos destinos del mismo post comparten `red` y solo el
 * `id` los distingue — es la clave que el Resumen y el Calendario del teléfono usan
 * para no repetir la de React entre ellos (repaso final de la rama).
 *
 * `mediaPorPost` son los archivos de cada post en su orden: la miniatura es la primera foto
 * y el formato sale de todos. `frias`, las cuentas con el fierro frío (`cuentasFrias`).
 *
 * `conChoripan`: si la app que pregunta sabe dibujar una historia (`aceptaChoripan`). A una
 * que no, la historia le llega con el corte de su archivo, como antes de que existiera: una
 * app sin actualizar que recibiera un formato desconocido se caía al dibujarlo.
 */
export function agruparPostsMovil(
  filas: FilaDestinoMovil[],
  mediaPorPost: Map<string, Array<{ blobUrl: string; mediaType: string }>>,
  zone: string,
  frias: ReadonlySet<string> = new Set(),
  conChoripan = true,
): PostMovil[] {
  const mapa = new Map<string, PostMovil>()
  for (const { post, target, handle } of filas) {
    const media = mediaPorPost.get(post.id) ?? []
    const entrada = mapa.get(post.id) ?? {
      id: post.id,
      texto: post.caption,
      cuando: isoInZone(post.scheduledAt, zone),
      portada: post.coverUrl,
      miniatura: media.find((m) => m.mediaType === 'image')?.blobUrl ?? null,
      // Una historia lo es en todos sus destinos: el primero basta para decir el corte.
      ...formatoDe(media, post.videosLiberados, conChoripan && esHistoria(target.opciones)),
      redes: [],
    }
    entrada.redes.push({
      id: target.id,
      red: target.network,
      handle,
      estado: target.status,
      error: target.lastError,
      sello: selloDe(target, frias.has(target.accountId) ? 'frio' : 'al-rojo'),
      archivado: Boolean(target.archivadoEn),
    })
    mapa.set(post.id, entrada)
  }
  return [...mapa.values()]
}

/**
 * La app avisa qué cortes nuevos sabe dibujar en `X-Parrilla-Cortes` (`mobile/src/lib/api.ts`).
 * Las instalaciones que todavía no reciben la actualización por aire no lo mandan.
 */
export function aceptaChoripan(request: Request): boolean {
  return (request.headers.get('x-parrilla-cortes') ?? '').split(',').some((c) => c.trim() === 'choripan')
}

export async function GET(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const now = new Date()
  const db = getDb()
  const filas = await db
    .select({ post: scheduledPosts, target: scheduledPostTargets, handle: socialAccounts.handle })
    .from(scheduledPosts)
    .innerJoin(scheduledPostTargets, eq(scheduledPostTargets.postId, scheduledPosts.id))
    // `leftJoin`, no `innerJoin`: una cuenta borrada no hace desaparecer el destino,
    // solo su handle — mismo criterio que `GET /api/schedule/posts` (Tarea 5).
    .leftJoin(socialAccounts, eq(socialAccounts.id, scheduledPostTargets.accountId))
    .where(
      and(
        eq(scheduledPosts.ownerId, usuario.id),
        gt(scheduledPosts.scheduledAt, new Date(now.getTime() - DIAS_ATRAS * 864e5)),
        lte(scheduledPosts.scheduledAt, new Date(now.getTime() + DIAS_ADELANTE * 864e5)),
      ),
    )
    .orderBy(asc(scheduledPosts.scheduledAt))

  const ids = [...new Set(filas.map((f) => f.post.id))]
  const medias = ids.length
    ? await db
        .select()
        .from(scheduledPostMedia)
        .where(inArray(scheduledPostMedia.postId, ids))
        .orderBy(asc(scheduledPostMedia.position))
    : []
  const mediaPorPost = new Map<string, Array<{ blobUrl: string; mediaType: string }>>()
  for (const media of medias) mediaPorPost.set(media.postId, [...(mediaPorPost.get(media.postId) ?? []), media])
  const frias = cuentasFrias(await getCuentas(usuario.id), now)

  // Los borradores, los mismos del panel: La Parrilla los lista y pone en su día los que
  // tienen fecha. Una app sin actualizar no lee el campo.
  const borradores = (await listarBorradores(usuario.id)).map((b) => resumirParaElTelefono(b, usuario.zona))

  // `hoy`, el día en la zona del dueño: la app arma La Parrilla desde hoy y no puede usar
  // el reloj del teléfono, que puede estar en otra zona.
  return NextResponse.json({
    hoy: localDay(now, usuario.zona),
    posts: agruparPostsMovil(filas, mediaPorPost, usuario.zona, frias, aceptaChoripan(request)),
    borradores,
  })
}

/** Lo que se crea de un envío: un post, o una historia por archivo si es una secuencia. */
export type ParteDelEnvio = { media: MediaMovil[]; opciones: Record<string, OpcionesDestino> }

/**
 * Una secuencia de historias desde Publicar (`secuencia: true`, con las cuentas en
 * `{ historia: true }` y varios archivos en el orden en que salen): una historia por archivo,
 * todas a la misma hora y con la secuencia compartida, para que salgan en orden
 * (`secuencia.ts`). Es el mismo atajo de la API (`expandirHistoria`, en `batch.ts`), pero entra
 * en una sola transacción: el teléfono no tiene `ref` con que reconocer las que ya entraron, y
 * el borrador es lo que impide programarla dos veces. Sin `secuencia`, o con un solo archivo,
 * es un post como siempre.
 */
export function partirEnHistorias(
  body: unknown,
  cuentas: ReadonlyArray<{ id: string }>,
  opciones: Record<string, OpcionesDestino>,
  media: MediaMovil[],
  secuencia: string,
): ParteDelEnvio[] | { error: string } {
  const pedida = (body as { secuencia?: unknown } | null)?.secuencia === true
  if (!pedida || cuentas.length === 0 || media.length === 1) return [{ media, opciones }]
  if (!cuentas.every((c) => esHistoria(opciones[c.id]))) return { error: OPCIONES_ERROR }
  if (media.length === 0) return { error: HISTORIA_MEDIA }
  if (media.length > MAX_HISTORIAS_SECUENCIA) return { error: HISTORIA_DEMASIADAS }
  return media.map((m, i) => ({
    media: [m],
    opciones: Object.fromEntries(cuentas.map((c) => [c.id, { historia: { secuencia, orden: i + 1 } }])),
  }))
}

/**
 * El post con sus archivos ya en R2. Antes de crear: que cada URL sea del almacén
 * propio y bajo `scheduled/` (un cuerpo forjado no puede apuntar a cualquier URL de
 * internet), que se resuelva el destino real con `resolverDestinos` (compartida con
 * `check/route.ts` — ver su comentario), que las `opciones` de cada cuenta resuelta
 * pasen `validarOpcionesPorCuenta` y, con ellas ya limpias, la regla de media del trial
 * reel (`errorDeMediaPorOpciones`), que `cuando` y el resto del borrador pasen las
 * reglas de `validateScheduleDraft` sobre la red de cada destino resuelto, no una
 * declarada aparte, y por último que cada objeto exista en R2 (un HEAD es un viaje de
 * ida y vuelta, y no vale la pena pagarlo si el post ya iba a rechazarse por otra
 * razón).
 *
 * Con `borradorId`, el post sale de ese borrador y el borrador se consume en la misma
 * transacción que lo crea, como al programar en el panel. Antes, dos rechazos propios: que
 * el borrador ya no exista —se programó o se descartó en otro lado, o este mismo envío ya
 * salió y se perdió la respuesta: repetirlo sería publicar dos veces— y que tenga algo que
 * el teléfono no programa (`soloEnElPanel`), que se perdería con el borrador. La primera
 * revisión da el motivo; la de la transacción (`BorradorConsumido`) cierra el caso de dos
 * envíos a la vez, que pasaban los dos por la revisión antes de que ninguno lo borrara.
 *
 * Una app que trae el bloque de TikTok y la palabra clave (`sabeDe`) puede elegir cuentas de
 * TikTok —sus opciones pasan por `validarOpcionesPorCuenta`, como las del compositor— y mandar la
 * `regla`, que pasa por `validarRegla` y se crea con el post; después de crear, «Música de TikTok»
 * queda recordada por cuenta (`recordarMusicaTikTok`), como en el panel.
 *
 * Una secuencia de historias (`secuencia: true`) crea un post por archivo en la misma
 * transacción (`partirEnHistorias`) y responde además `ids`, en su orden. Un borrador que es una
 * historia no se programa como post (`BORRADOR_ES_HISTORIA`): lo intenta una app sin actualizar.
 */
export async function POST(request: Request) {
  const usuario = await requireMobileUser(request)
  if (!usuario) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: CUERPO_ILEGIBLE }, { status: 400 })
  }
  const borrador = parseBorradorMovil(body)
  if ('error' in borrador) return NextResponse.json({ error: borrador.error }, { status: 400 })
  const media = parseMediaMovil(body)
  if ('error' in media) return NextResponse.json({ error: media.error }, { status: 400 })

  // Lo que trae la app que manda (`sabeDe`): con TikTok, sus cuentas son destinos como cualquiera;
  // con la palabra clave, la `regla` del cuerpo es la del post. Una app sin actualizar no trae
  // ninguna de las dos, y un borrador que las tiene se programa en el panel (`soloEnElPanel`).
  const conTikTok = sabeDe(request, 'tiktok')
  const conRegla = sabeDe(request, 'palabra-clave')
  const reglaCheck = validarRegla(conRegla ? (reglaDelTelefono(body) ?? undefined) : undefined)
  if ('error' in reglaCheck) return NextResponse.json({ error: reglaCheck.error }, { status: 400 })

  const pedido = (body as { borradorId?: unknown }).borradorId
  let borradorId: string | null = null
  let opcionesPedidas = borrador.opciones
  let deDondeEsHistoria = false
  if (pedido !== undefined && pedido !== null) {
    borradorId = idDeBorrador(pedido)
    const deDonde = borradorId ? await cargarBorrador(usuario.id, borradorId) : null
    if (!deDonde) return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })
    deDondeEsHistoria = esBorradorDeHistoria(deDonde.campos)
    const motivo = soloEnElPanel(deDonde.campos, (await cuentasParaElTelefono(usuario.id, conTikTok)).ajenas, {
      conRegla,
    })
    if (motivo) return NextResponse.json({ error: motivo }, { status: 400 })
    // Una app que no sabe de música no la manda: la del borrador se conserva.
    opcionesPedidas = opcionesConMusicaDelBorrador(body, borrador.opciones, deDonde.campos)
  }

  const base = basePublica()
  for (const m of media) {
    const key = base ? keyDesdeUrl(base, m.url) : null
    if (!key || !key.startsWith('scheduled/')) {
      return NextResponse.json({ error: ARCHIVO_AJENO }, { status: 400 })
    }
  }

  // `check/route.ts` promete lo que este `POST` cumple: las dos rutas llaman a
  // `resolverDestinos` con el mismo borrador, así que nunca se pueden desacordar.
  let cuentas: Awaited<ReturnType<typeof resolverDestinos>>['cuentas']
  let networks: string[]
  try {
    ;({ cuentas, networks } = await resolverDestinos(usuario.id, { ...borrador, conTikTok }))
  } catch (fallo) {
    if (fallo instanceof CuentaInvalida) return NextResponse.json({ error: fallo.message }, { status: 400 })
    throw fallo
  }

  const opcionesCheck = validarOpcionesPorCuenta(cuentas, opcionesPedidas)
  if ('error' in opcionesCheck) return NextResponse.json({ error: opcionesCheck.error }, { status: 400 })
  // Una app que no sabe de historias ve este borrador como un post: saldría un carrusel.
  if (deDondeEsHistoria && !Object.values(opcionesCheck.opciones).some(esHistoria)) {
    return NextResponse.json({ error: BORRADOR_ES_HISTORIA }, { status: 400 })
  }
  const partes = partirEnHistorias(body, cuentas, opcionesCheck.opciones, media, randomUUID())
  if ('error' in partes) return NextResponse.json({ error: partes.error }, { status: 400 })

  const now = new Date()
  const scheduledAt = resolverCuando(borrador.ahora, borrador.cuando, now)
  // Cada parte con sus reglas: una secuencia son varias historias, y cada una es un post.
  for (const parte of partes) {
    const fotos = parte.media.filter((m) => m.mediaType === 'image').length
    const videos = parte.media.filter((m) => m.mediaType === 'video').length
    const mediaPorOpciones = errorDeMediaPorOpciones(parte.opciones, { videos, fotos, sinTipo: 0 })
    if (mediaPorOpciones) return NextResponse.json({ error: mediaPorOpciones }, { status: 400 })
    const historia = errorDeHistoria(parte.opciones, {
      caption: borrador.texto,
      conPalabraClave: reglaCheck.regla !== null,
      aInstagram: networks.includes('instagram'),
      fotos: parte.media.filter((m) => m.mediaType === 'image').map((m) => extensionDe(m.url)),
    })
    if (historia) return NextResponse.json({ error: historia }, { status: 400 })

    const error = validateScheduleDraft(
      {
        caption: borrador.texto,
        imageCount: fotos,
        videoCount: videos,
        networks,
        scheduledAt,
        // Solo TikTok la mira (fotos en JPG o WebP); la clave termina con el nombre del archivo.
        formats: parte.media.map((m) => extensionDe(m.url)),
      },
      now,
      { proximamente: proximamentePara(usuario.id) },
    )
    if (error) return NextResponse.json({ error }, { status: 400 })
  }

  try {
    for (const m of media) {
      // Que exista, y lo que de verdad pesa: la subida firmada no fija un tamaño.
      const bytes = await tamanoEnAlmacen(m.url)
      if (bytes === null) return NextResponse.json({ error: ARCHIVO_FALTANTE }, { status: 400 })
      if (bytes > MAX_BYTES_SUBIDA) return NextResponse.json({ error: ARCHIVO_MUY_GRANDE }, { status: 400 })
    }
  } catch (error) {
    console.error('schedule/existe:', String(error).slice(0, 300))
    return NextResponse.json({ error: NO_SE_GUARDO }, { status: 500 })
  }

  try {
    const cuando = isoInZone(scheduledAt!, usuario.zona)
    if (partes.length === 1) {
      const id = await crearPostProgramado(usuario.id, {
        caption: borrador.texto,
        scheduledAt: scheduledAt!,
        media: partes[0]!.media,
        cuentas,
        opciones: partes[0]!.opciones,
        regla: reglaCheck.regla,
        borradorId,
      })
      const videos = partes[0]!.media.filter((m) => m.mediaType === 'video').length
      await recordarMusicaTikTok(usuario.id, partes[0]!.opciones, { videos, fotos: partes[0]!.media.length - videos })
      return NextResponse.json({ id, cuando })
    }
    const ids = await crearVariosProgramados(
      usuario.id,
      partes.map((parte) => ({
        caption: borrador.texto,
        scheduledAt: scheduledAt!,
        media: parte.media,
        cuentas,
        opciones: parte.opciones,
      })),
      borradorId,
    )
    return NextResponse.json({ id: ids[0], ids, cuando })
  } catch (dbError) {
    if (dbError instanceof BorradorConsumido) {
      return NextResponse.json({ error: BORRADOR_NO_EXISTE }, { status: 404 })
    }
    if (dbError instanceof CreativoNoEsta) {
      return NextResponse.json({ error: CREATIVO_NO_ESTA }, { status: 409 })
    }
    console.error('schedule/crear:', String(dbError).slice(0, 300))
    return NextResponse.json({ error: NO_SE_GUARDO }, { status: 500 })
  }
}
