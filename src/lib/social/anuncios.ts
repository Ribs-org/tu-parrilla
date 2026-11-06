// Los anuncios de Meta del dueño: leer cómo les fue (`ads_read`, Marketing API). Crearlos y
// pausarlos es `promocionar.ts`. Lo de este archivo es puro —qué se le pide a Meta y
// cómo se lee lo que contesta, y cómo se resume para Los Números—; lo que escribe en la base
// está en `anuncios-sync.ts` y lo que lee para la pantalla en `lib/lo-pagado.ts`.
//
// El camino: `me/adaccounts` da las cuentas publicitarias a las que el usuario tiene acceso
// (también las de un portafolio comercial donde tiene un rol, con `business_management`, que ya
// se pide); cada una lista sus anuncios con el creativo y los totales de principio a fin en la
// misma llamada (`insights.date_preset(maximum)`). El creativo dice qué se promocionó:
// `effective_instagram_media_id` es la publicación de Instagram y `effective_object_story_id`
// el post de la página, con el mismo `páginaID_postID` con que se guardan las de Facebook. Con
// eso se cruza contra lo que Tu Parrilla ya conoce. Un post promocionado desde la app («Promocionar»)
// es un anuncio más de la cuenta publicitaria, así que entra por el mismo camino.

const GRAPH = 'https://graph.facebook.com/v23.0'

/** Tope de páginas por listado: una cuenta con miles de anuncios no se lee entera cada noche. */
export const MAX_PAGINAS = 10

/**
 * Los estados que se piden. Sin filtro, Meta deja fuera lo archivado, y un post promocionado hace
 * meses suele estar ahí. Lo borrado no se pide: el dueño lo sacó a propósito.
 */
export const ESTADOS_PEDIDOS = [
  'ACTIVE',
  'PAUSED',
  'CAMPAIGN_PAUSED',
  'ADSET_PAUSED',
  'ARCHIVED',
  'IN_PROCESS',
  'WITH_ISSUES',
  'PENDING_REVIEW',
  'DISAPPROVED',
  'PREAPPROVED',
  'PENDING_BILLING_INFO',
] as const

const CAMPOS_ANUNCIO = [
  'id',
  'name',
  'effective_status',
  'creative{effective_object_story_id,effective_instagram_media_id}',
  'adset{start_time,end_time}',
  'insights.date_preset(maximum){spend,reach,impressions,clicks,date_start,date_stop}',
].join(',')

export type CuentaPublicitaria = { id: string; nombre: string | null; moneda: string | null }

/** Un anuncio como se guarda: lo que Meta dice, sin cruzar todavía con las publicaciones. */
export type AnuncioLeido = {
  externalId: string
  nombre: string | null
  estado: string | null
  cuentaPublicitariaId: string
  cuentaPublicitariaNombre: string | null
  moneda: string | null
  storyId: string | null
  instagramMediaId: string | null
  gasto: number
  alcance: number | null
  impresiones: number | null
  clics: number | null
  /** «YYYY-MM-DD». */
  desde: string | null
  hasta: string | null
}

type Paginado<T> = { data?: T[]; paging?: { next?: string } }

type CuentaGraph = { id?: string; name?: string; currency?: string }

type AnuncioGraph = {
  id?: string
  name?: string
  effective_status?: string
  creative?: { effective_object_story_id?: string; effective_instagram_media_id?: string } | null
  adset?: { start_time?: string; end_time?: string } | null
  insights?: {
    data?: Array<{
      spend?: string
      reach?: string
      impressions?: string
      clicks?: string
      date_start?: string
      date_stop?: string
    }>
  } | null
}

/** Pide una URL de Graph y devuelve el cuerpo; lanza con la frase de Meta si no es 2xx. */
export type PedirGraph = (url: string) => Promise<unknown>

/** Meta manda los números de insights como texto («12.34»). Lo que no es número, null. */
function numero(valor: string | undefined): number | null {
  if (valor === undefined || valor === '') return null
  const n = Number(valor)
  return Number.isFinite(n) ? n : null
}

function entero(valor: string | undefined): number | null {
  const n = numero(valor)
  return n === null ? null : Math.round(n)
}

/** El día de una fecha de Meta («2026-10-01T10:00:00-0300» o «2026-10-01»), tal como la escribe. */
function dia(valor: string | undefined): string | null {
  return valor && /^\d{4}-\d{2}-\d{2}/.test(valor) ? valor.slice(0, 10) : null
}

export function normalizarCuentas(body: Paginado<CuentaGraph>): CuentaPublicitaria[] {
  const cuentas: CuentaPublicitaria[] = []
  for (const c of body.data ?? []) {
    if (c.id) cuentas.push({ id: c.id, nombre: c.name ?? null, moneda: c.currency ?? null })
  }
  return cuentas
}

/**
 * Los anuncios de una página del listado. Uno sin insights no llegó a correr —nunca se mostró—
 * y no se guarda: no tiene nada que contar.
 *
 * El fin es el del conjunto de anuncios si ya pasó: con `maximum`, Meta cierra el rango en el
 * día de la consulta aunque el anuncio haya terminado hace un mes.
 */
export function normalizarAnuncios(body: Paginado<AnuncioGraph>, cuenta: CuentaPublicitaria): AnuncioLeido[] {
  const anuncios: AnuncioLeido[] = []
  for (const a of body.data ?? []) {
    const totales = a.insights?.data?.[0]
    if (!a.id || !totales) continue
    const desde = dia(totales.date_start) ?? dia(a.adset?.start_time)
    const fin = dia(a.adset?.end_time)
    const parada = dia(totales.date_stop)
    const hasta = fin && parada ? (fin < parada ? fin : parada) : (parada ?? fin)
    anuncios.push({
      externalId: a.id,
      nombre: a.name ?? null,
      estado: a.effective_status ?? null,
      cuentaPublicitariaId: cuenta.id,
      cuentaPublicitariaNombre: cuenta.nombre,
      moneda: cuenta.moneda,
      storyId: a.creative?.effective_object_story_id ?? null,
      instagramMediaId: a.creative?.effective_instagram_media_id ?? null,
      gasto: numero(totales.spend) ?? 0,
      alcance: entero(totales.reach),
      impresiones: entero(totales.impressions),
      clics: entero(totales.clicks),
      desde,
      hasta,
    })
  }
  return anuncios
}

export function urlCuentas(token: string): string {
  const url = new URL(`${GRAPH}/me/adaccounts`)
  url.searchParams.set('fields', 'id,name,currency')
  url.searchParams.set('limit', '50')
  url.searchParams.set('access_token', token)
  return url.toString()
}

export function urlAnuncios(cuentaId: string, token: string, conEstados = true): string {
  const url = new URL(`${GRAPH}/${cuentaId}/ads`)
  url.searchParams.set('fields', CAMPOS_ANUNCIO)
  url.searchParams.set('limit', '100')
  if (conEstados) url.searchParams.set('effective_status', JSON.stringify(ESTADOS_PEDIDOS))
  url.searchParams.set('access_token', token)
  return url.toString()
}

async function todasLasPaginas<T>(primera: string, pedir: PedirGraph): Promise<T[]> {
  const filas: T[] = []
  let url: string | undefined = primera
  for (let i = 0; url && i < MAX_PAGINAS; i++) {
    const body = (await pedir(url)) as Paginado<T>
    filas.push(...(body.data ?? []))
    url = body.paging?.next
  }
  return filas
}

/**
 * Las cuentas publicitarias del usuario del token y sus anuncios. Una cuenta que no se deja
 * leer (deshabilitada, o sin el rol que exige el acceso de desarrollo de Meta, el error 270) se
 * salta; si no se pudo leer ninguna de las que había, lanza el primer error, para que el
 * llamador pruebe con otro token.
 *
 * Si la lista con el filtro de estados falla, se repite sin él: un estado que Meta dejara de
 * aceptar haría fallar la llamada entera, y es mejor perder lo archivado que todo.
 */
export async function leerAnunciosDeMeta(
  token: string,
  pedir: PedirGraph,
): Promise<{ cuentas: CuentaPublicitaria[]; anuncios: AnuncioLeido[] }> {
  const cuentas = normalizarCuentas({ data: await todasLasPaginas<CuentaGraph>(urlCuentas(token), pedir) })
  const anuncios: AnuncioLeido[] = []
  let primerError: unknown = null
  let leidas = 0
  for (const cuenta of cuentas) {
    try {
      let filas: AnuncioGraph[]
      try {
        filas = await todasLasPaginas<AnuncioGraph>(urlAnuncios(cuenta.id, token), pedir)
      } catch {
        filas = await todasLasPaginas<AnuncioGraph>(urlAnuncios(cuenta.id, token, false), pedir)
      }
      anuncios.push(...normalizarAnuncios({ data: filas }, cuenta))
      leidas++
    } catch (error) {
      primerError ??= error
    }
  }
  if (cuentas.length > 0 && leidas === 0) throw primerError
  return { cuentas, anuncios }
}

/** Lo que se sabe de una publicación del dueño para cruzarla con un anuncio. */
export type PublicacionConocida = { id: string; network: string; externalId: string }

/**
 * A qué publicación del dueño corresponde cada anuncio, por id de anuncio. Primero la de
 * Instagram: un anuncio que salió en Instagram desde un post de la página trae los dos ids, y
 * lo que se promocionó es la publicación de Instagram. Si no, el post de la página.
 */
export function emparejar(
  anuncios: readonly AnuncioLeido[],
  publicaciones: readonly PublicacionConocida[],
): Map<string, string> {
  const instagram = new Map<string, string>()
  const facebook = new Map<string, string>()
  for (const p of publicaciones) {
    if (p.network === 'instagram') instagram.set(p.externalId, p.id)
    if (p.network === 'facebook') facebook.set(p.externalId, p.id)
  }
  const pares = new Map<string, string>()
  for (const a of anuncios) {
    const postId =
      (a.instagramMediaId ? instagram.get(a.instagramMediaId) : undefined) ??
      (a.storyId ? facebook.get(a.storyId) : undefined)
    if (postId) pares.set(a.externalId, postId)
  }
  return pares
}

/** Los ids que hay que buscar entre las publicaciones del dueño. */
export function idsPorCruzar(anuncios: readonly AnuncioLeido[]): string[] {
  const ids = new Set<string>()
  for (const a of anuncios) {
    if (a.instagramMediaId) ids.add(a.instagramMediaId)
    if (a.storyId) ids.add(a.storyId)
  }
  return [...ids]
}

/* ------------------------------------------------------------- Los Números -- */

/** Un anuncio guardado, con la publicación que promocionó si es una conocida. */
export type FilaPagada = {
  externalId: string
  moneda: string | null
  gasto: number
  alcance: number | null
  impresiones: number | null
  clics: number | null
  desde: string | null
  hasta: string | null
  postId: string | null
  network: string | null
  accountId: string | null
  caption: string | null
  campaign: string | null
  thumbnailUrl: string | null
}

/** El gasto por moneda: con dos cuentas publicitarias en monedas distintas no se suma. */
export type GastoPorMoneda = Record<string, number>

export type Totales = {
  anuncios: number
  gasto: GastoPorMoneda
  alcance: number | null
  impresiones: number | null
  clics: number | null
}

export type PublicacionPagada = Totales & {
  postId: string
  network: string | null
  accountId: string | null
  caption: string | null
  campaign: string | null
  thumbnailUrl: string | null
  desde: string | null
  hasta: string | null
}

export type ResumenPagado = {
  totales: Totales
  publicaciones: PublicacionPagada[]
  /** Anuncios que no salen de una publicación que Tu Parrilla conozca: suman solo al total. */
  sueltos: number
}

const SIN_MONEDA = ''

function vacio(): Totales {
  return { anuncios: 0, gasto: {}, alcance: null, impresiones: null, clics: null }
}

function sumar(a: number | null, b: number | null): number | null {
  if (b === null) return a
  return (a ?? 0) + b
}

function acumular(t: Totales, f: FilaPagada): void {
  t.anuncios++
  const moneda = f.moneda ?? SIN_MONEDA
  t.gasto[moneda] = (t.gasto[moneda] ?? 0) + f.gasto
  t.alcance = sumar(t.alcance, f.alcance)
  t.impresiones = sumar(t.impresiones, f.impresiones)
  t.clics = sumar(t.clics, f.clics)
}

/**
 * Los totales de todo lo pagado y, por cada publicación promocionada, la suma de sus anuncios.
 * El alcance de dos anuncios se suma aunque puedan repetir gente: Meta no da el alcance sin
 * repetir entre anuncios distintos, y la pantalla lo dice. Ordenadas de más a menos impresiones,
 * que se comparan entre monedas.
 */
export function resumirLoPagado(filas: readonly FilaPagada[]): ResumenPagado {
  const totales = vacio()
  const porPost = new Map<string, PublicacionPagada>()
  let sueltos = 0
  for (const f of filas) {
    acumular(totales, f)
    if (!f.postId) {
      sueltos++
      continue
    }
    let p = porPost.get(f.postId)
    if (!p) {
      p = {
        ...vacio(),
        postId: f.postId,
        network: f.network,
        accountId: f.accountId,
        caption: f.caption,
        campaign: f.campaign,
        thumbnailUrl: f.thumbnailUrl,
        desde: f.desde,
        hasta: f.hasta,
      }
      porPost.set(f.postId, p)
    }
    acumular(p, f)
    if (f.desde && (!p.desde || f.desde < p.desde)) p.desde = f.desde
    if (f.hasta && (!p.hasta || f.hasta > p.hasta)) p.hasta = f.hasta
  }
  const publicaciones = [...porPost.values()].sort((a, b) => (b.impresiones ?? 0) - (a.impresiones ?? 0))
  return { totales, publicaciones, sueltos }
}

/**
 * «12.345 CLP», «10,50 USD» o, con dos monedas, las dos separadas por « · ». Sin moneda conocida,
 * el número solo. Sin nada gastado, «—».
 */
export function formatearGasto(gasto: GastoPorMoneda): string {
  const partes = Object.entries(gasto)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([moneda, monto]) => {
      if (moneda === SIN_MONEDA) return new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(monto)
      try {
        return new Intl.NumberFormat('es', { style: 'currency', currency: moneda, currencyDisplay: 'code' }).format(monto)
      } catch {
        return `${moneda} ${new Intl.NumberFormat('es', { maximumFractionDigits: 2 }).format(monto)}`
      }
    })
  return partes.length > 0 ? partes.join(' · ') : '—'
}
