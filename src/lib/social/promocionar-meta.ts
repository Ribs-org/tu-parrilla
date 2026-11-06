import 'server-only'
import { and, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { anuncios, getDb, promociones, socialAccounts, socialPosts } from '@/db'
import type { SocialAccount } from '@/db'
import { dayKey } from '../schedule-week'
import { ordenDeTokens } from './anuncios-sync'
import { paginaParaPrivado } from './comentarios/privado'
import { decryptToken } from './crypto'
import {
  POR_ACCION,
  cuerpoAnuncio,
  cuerpoCampana,
  cuerpoConjunto,
  cuerpoCreativo,
  fraseDeMeta,
  horario,
  nombreDePromocion,
  problemaDeCuenta,
  revisarPromocion,
  type Accion,
  type Contexto,
  type CuentaGraph,
  type CuentaParaPromocionar,
  type EntradaPromocion,
  type ErrorGraph,
  type EstadoPropio,
  type Publicacion,
} from './promocionar'

const GRAPH = 'https://graph.facebook.com/v23.0'
const REDES = ['instagram', 'facebook'] as const

/** Un error de Meta con su frase para el dueño ya puesta (`fraseDeMeta`). */
export class ErrorDeMeta extends Error {
  constructor(public graph: ErrorGraph | undefined) {
    super(fraseDeMeta(graph))
  }
}

/**
 * Una llamada a Graph. Los errores vienen en castellano cuando Meta los tiene (`locale`), y el
 * token nunca entra en el mensaje. Los objetos —el público, la llamada a la acción— van como
 * JSON, que es como los lee Graph en un formulario.
 */
async function graph(metodo: 'GET' | 'POST' | 'DELETE', ruta: string, token: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const url = new URL(`${GRAPH}/${ruta}`)
  const cuerpo = new URLSearchParams()
  const destino = metodo === 'GET' ? url.searchParams : cuerpo
  for (const [k, v] of Object.entries(params)) destino.set(k, typeof v === 'string' ? v : JSON.stringify(v))
  destino.set('locale', 'es_LA')
  destino.set('access_token', token)
  const response = await fetch(url, metodo === 'GET' ? undefined : { method: metodo, body: cuerpo })
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown> & { error?: ErrorGraph }
  if (!response.ok || body.error) throw new ErrorDeMeta(body.error)
  return body
}

/** Las cuentas de Meta del dueño con credencial, en el orden en que se prueban sus tokens. */
async function cuentasConToken(ownerId: string): Promise<SocialAccount[]> {
  const filas = await getDb()
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.ownerId, ownerId), inArray(socialAccounts.network, [...REDES]), isNotNull(socialAccounts.accessToken)))
  return ordenDeTokens(filas)
}

/** El presupuesto diario mínimo para lo que se cobra por impresión, que es lo que se arma acá. */
async function minimoDiario(cuentaId: string, token: string): Promise<number | null> {
  try {
    const body = (await graph('GET', `${cuentaId}/minimum_budgets`, token)) as { data?: Array<{ min_daily_budget_imp?: number }> }
    const minimo = body.data?.[0]?.min_daily_budget_imp
    return typeof minimo === 'number' ? minimo : null
  } catch {
    // Sin el mínimo se intenta igual: si es poco, Meta lo rechaza con su frase.
    return null
  }
}

export type Anunciante = { token: string; cuentas: CuentaParaPromocionar[] }

/**
 * Las cuentas publicitarias con que el dueño puede pagar, con el token que las ve: el primero de
 * sus tokens que contesta (`ordenDeTokens`). Con ese mismo token se crea todo después, para no
 * empezar con uno y seguir con otro.
 */
export async function anunciante(ownerId: string): Promise<Anunciante | { error: string }> {
  let ultimo: unknown = null
  for (const cuenta of await cuentasConToken(ownerId)) {
    const token = decryptToken(cuenta.accessToken!)
    try {
      const body = (await graph('GET', 'me/adaccounts', token, {
        fields: 'id,name,currency,account_status,funding_source,user_tasks',
        limit: '50',
      })) as { data?: CuentaGraph[] }
      const cuentas: CuentaParaPromocionar[] = []
      for (const c of body.data ?? []) {
        if (!c.id || !c.currency) continue
        const problema = problemaDeCuenta(c)
        cuentas.push({ id: c.id, nombre: c.name ?? null, moneda: c.currency, problema, minimoDiario: problema ? null : await minimoDiario(c.id, token) })
      }
      return { token, cuentas }
    } catch (error) {
      ultimo = error
    }
  }
  if (ultimo instanceof ErrorDeMeta) return { error: ultimo.message }
  return { error: 'Conecta Instagram, en Ajustes → Cuentas, aceptando todos los permisos, para promocionar desde Tu Parrilla.' }
}

/** Una publicación del dueño que se puede promocionar, con su cuenta. */
export type Promocionable = {
  post: typeof socialPosts.$inferSelect
  cuenta: SocialAccount
}

/** La publicación, solo si es del dueño, de Instagram o Facebook y no está borrada. */
export async function promocionable(ownerId: string, postId: string): Promise<Promocionable | null> {
  const [fila] = await getDb()
    .select({ post: socialPosts, cuenta: socialAccounts })
    .from(socialPosts)
    .innerJoin(socialAccounts, eq(socialAccounts.id, socialPosts.accountId))
    .where(
      and(
        eq(socialPosts.id, postId),
        eq(socialPosts.ownerId, ownerId),
        eq(socialAccounts.ownerId, ownerId),
        inArray(socialPosts.network, [...REDES]),
        isNull(socialPosts.archivedAt),
      ),
    )
    .limit(1)
  return fila ?? null
}

/**
 * Si Instagram deja promocionar esa publicación (`boost_eligibility_info`): una con música con
 * derechos, o con filtros interactivos, no se puede. Null si no se supo: se intenta igual.
 */
export async function motivoNoPromocionable(p: Promocionable): Promise<string | null> {
  if (p.post.network !== 'instagram' || !p.cuenta.accessToken) return null
  try {
    const body = (await graph('GET', p.post.externalId, decryptToken(p.cuenta.accessToken), { fields: 'boost_eligibility_info' })) as {
      boost_eligibility_info?: { eligible_to_boost?: boolean; boost_ineligible_reason?: string }
    }
    const info = body.boost_eligibility_info
    if (info?.eligible_to_boost === false) {
      return `Instagram no deja promocionar esta publicación${info.boost_ineligible_reason ? ` (${info.boost_ineligible_reason})` : ''}. Pasa, por ejemplo, con la música con derechos o los filtros interactivos.`
    }
  } catch {
    // Sin respuesta, se intenta: si no se puede, Meta lo dice al crear.
  }
  return null
}

/**
 * Crea la promoción y la guarda. Antes de tocar nada, revisa todo otra vez con las cuentas que
 * Meta da ahora (`revisarPromocion` con `confirmando`): el gasto máximo tiene que ser el que el
 * dueño confirmó. La campaña nace en pausa; el conjunto, el creativo y el anuncio cuelgan de ella;
 * recién al final, y solo si el dueño lo pidió, se enciende. Si algo falla en el camino, la
 * campaña se borra entera y no queda nada que gaste.
 */
export async function crearPromocion(args: {
  ownerId: string
  postId: string
  entrada: EntradaPromocion
  zona: string
  enlace: string | null
  ahora?: Date
}): Promise<{ error: string } | { id: string; estado: EstadoPropio }> {
  const ahora = args.ahora ?? new Date()
  const p = await promocionable(args.ownerId, args.postId)
  if (!p) return { error: 'Esa publicación no está entre las tuyas de Instagram o Facebook.' }
  const quien = await anunciante(args.ownerId)
  if ('error' in quien) return quien

  const hoy = dayKey(ahora, args.zona)
  const contexto: Contexto = {
    network: p.post.network as 'instagram' | 'facebook',
    hoy,
    cuentas: quien.cuentas,
    conEnlace: args.enlace !== null,
  }
  const revision = revisarPromocion(args.entrada, contexto, true)
  if ('error' in revision) return revision
  const plan = revision.plan

  let pub: Publicacion
  if (p.post.network === 'facebook') {
    pub = { network: 'facebook', storyId: p.post.externalId }
  } else {
    const pagina = p.cuenta.accessToken ? await paginaParaPrivado(p.cuenta, decryptToken(p.cuenta.accessToken)).catch(() => null) : null
    if (!pagina || !p.cuenta.externalId) {
      return { error: 'No se encontró la página de Facebook enlazada a esta cuenta de Instagram: Meta la pide para promocionar.' }
    }
    pub = { network: 'instagram', mediaId: p.post.externalId, instagramUserId: p.cuenta.externalId, paginaId: pagina.id, enlace: args.enlace }
  }

  const nombre = nombreDePromocion(p.post.caption, p.post.campaign, hoy)
  const { inicio, fin } = horario(plan, hoy, ahora, args.zona)
  const cuenta = plan.cuenta.id
  let campanaId: string | null = null
  try {
    campanaId = String((await graph('POST', `${cuenta}/campaigns`, quien.token, cuerpoCampana(plan, nombre))).id)
    const conjuntoId = String((await graph('POST', `${cuenta}/adsets`, quien.token, cuerpoConjunto(plan, nombre, campanaId, pub, inicio, fin))).id)
    const creativoId = String((await graph('POST', `${cuenta}/adcreatives`, quien.token, cuerpoCreativo(plan, nombre, pub))).id)
    const anuncioId = String((await graph('POST', `${cuenta}/ads`, quien.token, cuerpoAnuncio(nombre, conjuntoId, creativoId))).id)
    if (plan.activar) await graph('POST', campanaId, quien.token, { status: 'ACTIVE' })

    const estado: EstadoPropio = plan.activar ? 'activa' : 'pausada'
    const [fila] = await getDb()
      .insert(promociones)
      .values({
        accountId: p.cuenta.id,
        postId: p.post.id,
        cuentaPublicitariaId: cuenta,
        moneda: plan.cuenta.moneda,
        campanaId,
        conjuntoId,
        creativoId,
        anuncioId,
        objetivo: plan.objetivo,
        tipoPresupuesto: plan.tipoPresupuesto,
        presupuesto: plan.presupuesto,
        gastoMaximo: plan.gastoMaximo,
        desde: inicio,
        hasta: fin,
        paises: plan.paises,
        edadMin: plan.edadMin,
        edadMax: plan.edadMax,
        advantage: plan.advantage,
        estado,
      })
      .returning({ id: promociones.id })
    console.log(`[promocionar] ${args.ownerId}: campaña ${campanaId} (${estado}) para el post ${p.post.id}`)
    return { id: fila!.id, estado }
  } catch (error) {
    if (campanaId) {
      // Lo que se alcanzó a crear no debe quedar: en pausa no gasta, pero confunde.
      await graph('DELETE', campanaId, quien.token).catch((e) => console.error('[promocionar] no se pudo borrar la campaña a medias', campanaId, String(e).slice(0, 200)))
    }
    if (error instanceof ErrorDeMeta) return { error: error.message }
    console.error('[promocionar]', String(error).slice(0, 300))
    return { error: 'No se pudo terminar la promoción, y no quedó nada creado. Vuelve a intentarlo.' }
  }
}

/** Una promoción del dueño, con cómo la ve Meta ahora si se pudo leer. */
export type PromocionDelDueno = typeof promociones.$inferSelect & { efectivo: string | null; caption: string | null; campaign: string; network: string }

/**
 * Las promociones del dueño (de esas publicaciones, si vienen), de la más nueva a la más vieja.
 * Cómo van se lee en vivo, de una vez para todas (`?ids=`); si Meta no contesta, se usa lo que dejó
 * la última sincronización en `anuncios`, y si tampoco, lo último que pidió el dueño.
 */
export async function promocionesDe(ownerId: string, postIds?: readonly string[]): Promise<PromocionDelDueno[]> {
  if (postIds && postIds.length === 0) return []
  const filas = await getDb()
    .select({ promocion: promociones, caption: socialPosts.caption, campaign: socialPosts.campaign, network: socialPosts.network, sincronizado: anuncios.estado })
    .from(promociones)
    .innerJoin(socialAccounts, eq(socialAccounts.id, promociones.accountId))
    .innerJoin(socialPosts, eq(socialPosts.id, promociones.postId))
    .leftJoin(anuncios, and(eq(anuncios.externalId, promociones.anuncioId), eq(anuncios.accountId, promociones.accountId)))
    .where(and(eq(socialAccounts.ownerId, ownerId), postIds ? inArray(promociones.postId, [...postIds]) : undefined))
    .orderBy(desc(promociones.creadaEn))
    .limit(50)
  if (filas.length === 0) return []

  const vivos = new Map<string, string>()
  const ids = filas.filter((f) => f.promocion.estado !== 'detenida').map((f) => f.promocion.anuncioId)
  if (ids.length > 0) {
    for (const cuenta of await cuentasConToken(ownerId)) {
      try {
        const body = (await graph('GET', '', decryptToken(cuenta.accessToken!), { ids: ids.join(','), fields: 'effective_status' })) as Record<string, { effective_status?: string }>
        for (const [id, v] of Object.entries(body)) if (v?.effective_status) vivos.set(id, v.effective_status)
        break
      } catch {
        // Con el siguiente token, o con lo sincronizado.
      }
    }
  }
  return filas.map((f) => ({
    ...f.promocion,
    efectivo: vivos.get(f.promocion.anuncioId) ?? f.sincronizado ?? null,
    caption: f.caption,
    campaign: f.campaign,
    network: f.network,
  }))
}

/** Pausar, reanudar o detener: se le cambia el estado a la campaña, y el anuncio la sigue. */
export async function cambiarPromocion(ownerId: string, promocionId: string, accion: Accion): Promise<{ error?: string }> {
  const [fila] = await getDb()
    .select({ promocion: promociones })
    .from(promociones)
    .innerJoin(socialAccounts, eq(socialAccounts.id, promociones.accountId))
    .where(and(eq(promociones.id, promocionId), eq(socialAccounts.ownerId, ownerId)))
    .limit(1)
  if (!fila) return { error: 'Esa promoción no está entre las tuyas.' }
  if (fila.promocion.estado === 'detenida') return { error: 'Esa promoción ya está detenida.' }

  const { status, estado } = POR_ACCION[accion]
  let ultimo: unknown = null
  for (const cuenta of await cuentasConToken(ownerId)) {
    try {
      await graph('POST', fila.promocion.campanaId, decryptToken(cuenta.accessToken!), { status })
      await getDb()
        .update(promociones)
        .set({ estado, actualizadaEn: new Date() })
        .where(eq(promociones.id, promocionId))
      return {}
    } catch (error) {
      ultimo = error
    }
  }
  return { error: ultimo instanceof ErrorDeMeta ? ultimo.message : 'No se pudo hablar con Meta. Vuelve a intentarlo.' }
}
