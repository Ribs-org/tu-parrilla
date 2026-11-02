import 'server-only'
import { buildAccountCards } from '@/lib/account-stats'
import {
  breakdownBy,
  getFunnel,
  getHeatmap,
  getKpis,
  getTimeSeries,
  getTopLinks,
  localDay,
  previousPeriod,
  type Filters,
} from '@/lib/analytics'
import { visits } from '@/db'
import type { ParsedFilters } from '@/lib/filters'
import { contraSuCuenta } from '@/lib/igual-edad'
import { lecturasDeCuentas } from '@/lib/lecturas-cuentas'
import { networkLabel } from '@/lib/networks'
import { clavesDeAtributos, compararPorAtributo } from '@/lib/pieza'
import { attributesFor } from '@/lib/post-attributes'
import { getPostRows, getPostSeries, postKpisFrom, type CuentaRow, type PostRow } from '@/lib/posts'
import { corteDeRetencion } from '@/lib/social/retencion-youtube'
import { seguidoresGanados } from '@/lib/tablero'
import {
  CLAVES_DE_HOJA,
  DIMENSIONES,
  TOPES,
  columnaDeAtributo,
  definicion,
  filaDeClick,
  filaDeComentario,
  filaDeCuenta,
  filaDeDestino,
  filaDeDia,
  filaDeEtiqueta,
  filaDeLectura,
  filaDeLink,
  filaDePublicacion,
  filaDeSeguidores,
  filaDeVisita,
  filaDeAudiencia,
  filaPorAtributo,
  filasDelMapa,
  filasDelResumen,
  nombreDeHoja,
  type ClaveDeHoja,
  type Dimension,
} from './hojas'
import {
  contarFilas,
  leerClicks,
  leerComentarios,
  leerEtiquetas,
  leerLecturas,
  leerProgramado,
  leerSeguidores,
  leerVisitas,
  publicacionesDeEtiquetas,
  youtubeVencido,
  type Cursor,
} from './leer'
import { ANCHOS_DEL_LEEME, filasDelLeeme, type Recorte } from './leeme'
import { Libro, type Fila } from './xlsx'

// Arma la planilla de «Llevar para la casa» y la entrega por partes, tal como sale: la ruta
// (`/api/admin/planilla`) la manda al navegador mientras se escribe, así que no hay un archivo
// entero en memoria ni el tope de 4,5 MB de una respuesta de Vercel que no se transmite.
//
// Las consultas van en serie, como en Los Números: varias a la vez contra el pooler ya se
// colgaron una vez (`docs/pendientes.md`).

/** Cuántas filas se leen por consulta en las hojas largas. */
const TANDA = 5_000

export type PedidoDePlanilla = {
  filters: ParsedFilters
  cuentas: CuentaRow[]
  /** La cuenta elegida en Los Números (`?cuenta=`), o null. */
  cuenta: CuentaRow | null
  /** El nombre de la página elegida (`?profile=`), o null si son todas. */
  pagina: string | null
  ahora: Date
  /** Desde esta hora (ms) no se empieza otra consulta larga: lo que falte queda fuera y se dice. */
  terminarAntesDe: number
}

/** El nombre del archivo: el período, para que dos planillas no se pisen en Descargas. */
export function nombreDelArchivo(periodo: { desde: string; hasta: string }): string {
  return `tu-parrilla-numeros-${periodo.desde}-al-${periodo.hasta}.xlsx`
}

function nombreDeCuenta(c: CuentaRow): string {
  return c.handle ? `${networkLabel(c.network)} · ${c.handle}` : networkLabel(c.network)
}

/** Lo que va por cada hoja larga mientras se lee: cuántas llevó y si quedó algo fuera. */
type Cuenta = { llevadas: number; cortada: boolean; porTiempo: boolean }

/**
 * Las filas de una hoja larga, por tandas y con cursor, hasta su tope o hasta la hora de
 * terminar. Pide una fila de más en la última tanda: si llega, la hoja quedó cortada.
 */
async function* porTandas<T>(
  leer: (cursor: Cursor | null, cuantas: number) => Promise<{ filas: T[]; cursor: Cursor | null }>,
  tope: number,
  aFila: (t: T) => Fila,
  cuenta: Cuenta,
  terminarAntesDe: number,
): AsyncGenerator<Fila[]> {
  let cursor: Cursor | null = null
  for (;;) {
    if (Date.now() > terminarAntesDe) {
      cuenta.porTiempo = true
      return
    }
    const falta = tope - cuenta.llevadas
    const pide = Math.min(TANDA, falta + 1)
    const tanda = await leer(cursor, pide)
    const usar = tanda.filas.slice(0, falta)
    if (usar.length > 0) yield usar.map(aFila)
    cuenta.llevadas += usar.length
    if (tanda.filas.length > falta) {
      cuenta.cortada = true
      return
    }
    if (tanda.filas.length < pide) return
    cursor = tanda.cursor
  }
}

async function* una(filas: readonly Fila[]): AsyncGenerator<readonly Fila[]> {
  yield filas
}

/** Las columnas de la base que cuenta cada fila de «Audiencia». */
const COLUMNA_DE: Record<Dimension, Parameters<typeof breakdownBy>[1]> = {
  pais: visits.country,
  ciudad: visits.city,
  dispositivo: visits.deviceType,
  sistema: visits.os,
  navegador: visits.browser,
  idioma: visits.language,
  origen: visits.referrerNetwork,
}

/**
 * La planilla entera, por partes: los bytes del `.xlsx` en el orden en que van. Se escriben las
 * hojas de datos y al final «Léeme», que va primera en las pestañas pero necesita saber qué
 * quedó fuera.
 */
export async function* armarPlanilla(p: PedidoDePlanilla): AsyncGenerator<Uint8Array> {
  const { filters: f, cuenta, ahora, terminarAntesDe } = p
  const ownerId = f.ownerId
  const zona = f.zone
  const corte = corteDeRetencion(ahora)
  const posicion = (clave: ClaveDeHoja) => CLAVES_DE_HOJA.indexOf(clave)
  const libro = new Libro(CLAVES_DE_HOJA.map(nombreDeHoja), ahora)
  const filasPorHoja: Partial<Record<Exclude<ClaveDeHoja, 'leeme'>, number>> = {}
  const cortadas = new Map<Exclude<ClaveDeHoja, 'leeme'>, Cuenta>()

  yield* await libro.inicio('Los Números de Tu Parrilla')

  async function* tabla(
    clave: Exclude<ClaveDeHoja, 'leeme'>,
    tandas: AsyncIterable<readonly Fila[]>,
    columnas = definicion(clave).columnas,
  ): AsyncGenerator<Uint8Array> {
    const { bytes, filas } = await libro.tabla(posicion(clave), columnas, tandas)
    filasPorHoja[clave] = filas
    yield* bytes
  }

  // Lo de «En las redes»: sin los filtros de página y bots, como en Los Números.
  const deLasRedes: Filters = { ...f, profileId: null, includeBots: false }
  const cuentaId = cuenta?.id ?? null
  const cuentasPorId = new Map(p.cuentas.map((c) => [c.id, c]))
  // Los días del período, incluidos: los que dice la barra de Los Números.
  const dias = { desde: f.periodo.desde, hasta: f.periodo.hasta }

  // --- publicaciones, por atributo y resumen de las redes ---------------------------------------
  const leidas = await getPostRows(deLasRedes, true, {
    conActividad: true,
    limit: TOPES.publicaciones + 1,
    aLos7Dias: true,
    ...(cuentaId ? { accountId: cuentaId } : {}),
  })
  if (leidas.length > TOPES.publicaciones) {
    cortadas.set('publicaciones', { llevadas: TOPES.publicaciones, cortada: true, porTiempo: false })
  }
  const publicaciones = await sinYoutubeVencido(ownerId, leidas.slice(0, TOPES.publicaciones), corte)
  const atributosDe = await attributesFor(ownerId, publicaciones)
  const atributos = (fila: PostRow) => atributosDe.get(`${fila.network}:${fila.externalId}`) ?? null
  // Lo publicado en el período, sin las borradas: lo que compara «Comparar por atributo».
  const delPeriodo = publicaciones.filter(
    (fila) => !fila.archived && fila.publishedAt >= f.from && fila.publishedAt <= f.to,
  )
  const relativos = contraSuCuenta(delPeriodo)
  const claves = clavesDeAtributos(publicaciones.map(atributos))

  const lecturas = (await lecturasDeCuentas(ownerId)).filter((l) => cuentaId === null || l.accountId === cuentaId)
  const desdeDia = localDay(f.from, zona)
  const hastaDia = localDay(f.to, zona)
  const tarjetas = buildAccountCards(lecturas, desdeDia, hastaDia)

  const activas = publicaciones.filter((fila) => !fila.archived)
  const kpis = postKpisFrom(activas)
  const ahoraPagina = await getKpis(f)
  const antes = previousPeriod(f)
  const antesPagina = await getKpis(antes)
  const conClick = (await getFunnel(f, ahoraPagina)).engaged
  const conClickAntes = (await getFunnel(antes, antesPagina)).engaged

  yield* tabla(
    'resumen',
    una(
      filasDelResumen({
        redes: {
          viewsGanadas: activas.some((fila) => fila.viewsChange !== null) ? kpis.views : null,
          seguidoresGanados: seguidoresGanados(tarjetas),
          interacciones: kpis.engagement,
          visitasDesdePublicaciones: kpis.visits,
          arrastre: kpis.pull,
          publicaciones: activas.length,
        },
        pagina: {
          ahora: { ...ahoraPagina, conClick },
          antes: { ...antesPagina, conClick: conClickAntes },
        },
      }),
    ),
  )

  yield* tabla(
    'publicaciones',
    una(
      publicaciones.map((fila) =>
        filaDePublicacion(fila, zona, cuentasPorId.get(fila.accountId), atributos(fila), claves, relativos.get(fila.id) ?? null),
      ),
    ),
    [...definicion('publicaciones').columnas, ...claves.map(columnaDeAtributo)],
  )

  const entradas = delPeriodo.map((fila) => ({ fila, atributos: atributos(fila) }))
  yield* tabla(
    'porAtributo',
    una(
      clavesDeAtributos(entradas.map((e) => e.atributos)).flatMap((clave) =>
        compararPorAtributo(entradas, clave, relativos).map((comparada) => filaPorAtributo(clave, comparada)),
      ),
    ),
  )

  // --- lecturas diarias ---------------------------------------------------------------------------
  const lecturasCuenta: Cuenta = { llevadas: 0, cortada: false, porTiempo: false }
  yield* tabla(
    'lecturas',
    porTandas(
      (cursor, cuantas) => leerLecturas(ownerId, dias, cuentaId, corte, cursor, cuantas),
      TOPES.lecturas,
      (l) => filaDeLectura(l, zona),
      lecturasCuenta,
      terminarAntesDe,
    ),
  )
  cortadas.set('lecturas', lecturasCuenta)

  // --- cuentas y seguidores ---------------------------------------------------------------------
  const tarjetaDe = new Map(tarjetas.map((t) => [t.accountId, t]))
  const ultimoDiaDe = new Map<string, string>()
  for (const l of lecturas) {
    if (l.day >= desdeDia && l.day <= hastaDia && l.accountId) ultimoDiaDe.set(l.accountId, l.day)
  }
  const lasCuentas = cuenta ? [cuenta] : p.cuentas
  yield* tabla(
    'cuentas',
    una(lasCuentas.map((c) => filaDeCuenta(c, tarjetaDe.get(c.id) ?? null, ultimoDiaDe.get(c.id) ?? null, zona))),
  )

  const seguidores = await leerSeguidores(ownerId, dias, cuentaId, corte, TOPES.seguidores + 1)
  if (seguidores.length > TOPES.seguidores) {
    cortadas.set('seguidores', { llevadas: TOPES.seguidores, cortada: true, porTiempo: false })
  }
  yield* tabla('seguidores', una(seguidores.slice(0, TOPES.seguidores).map(filaDeSeguidores)))

  // --- día a día ----------------------------------------------------------------------------------
  const serie = await getTimeSeries(f, 'day')
  const deLasPublicaciones = new Map((await getPostSeries(f, 'day')).map((d) => [d.bucket, d]))
  yield* tabla(
    'diaADia',
    una(
      serie.map((d) =>
        filaDeDia({
          dia: d.bucket,
          visitas: d.visits,
          clicks: d.clicks,
          viewsGanadas: deLasPublicaciones.get(d.bucket)?.views ?? null,
          visitasDesdePublicaciones: deLasPublicaciones.get(d.bucket)?.visits ?? null,
        }),
      ),
    ),
  )

  // --- visitas y clicks ---------------------------------------------------------------------------
  const visitasCuenta: Cuenta = { llevadas: 0, cortada: false, porTiempo: false }
  yield* tabla(
    'visitas',
    porTandas((cursor, cuantas) => leerVisitas(f, cursor, cuantas), TOPES.visitas, (v) => filaDeVisita(v, zona), visitasCuenta, terminarAntesDe),
  )
  cortadas.set('visitas', visitasCuenta)

  const clicksCuenta: Cuenta = { llevadas: 0, cortada: false, porTiempo: false }
  yield* tabla(
    'clicks',
    porTandas((cursor, cuantos) => leerClicks(f, cursor, cuantos), TOPES.clicks, (c) => filaDeClick(c, zona), clicksCuenta, terminarAntesDe),
  )
  cortadas.set('clicks', clicksCuenta)

  // --- etiquetas, links, audiencia y horas --------------------------------------------------------
  const grupos = await leerEtiquetas(f, TOPES.etiquetas + 1)
  if (grupos.length > TOPES.etiquetas) cortadas.set('etiquetas', { llevadas: TOPES.etiquetas, cortada: true, porTiempo: false })
  const etiquetas = grupos.slice(0, TOPES.etiquetas)
  const deEtiqueta = await publicacionesDeEtiquetas(
    ownerId,
    [...new Set(etiquetas.map((g) => g.campaign).filter((c): c is string => c !== null))],
    corte,
  )
  yield* tabla(
    'etiquetas',
    una(
      etiquetas.map((g) => {
        const post = g.campaign ? deEtiqueta.get(g.campaign) : undefined
        return filaDeEtiqueta(
          g,
          post ? { caption: post.caption, network: post.network, handle: cuentasPorId.get(post.accountId)?.handle ?? null } : undefined,
        )
      }),
    ),
  )

  const links = await getTopLinks(f, ahoraPagina.visits, TOPES.links + 1)
  if (links.length > TOPES.links) cortadas.set('links', { llevadas: TOPES.links, cortada: true, porTiempo: false })
  yield* tabla('links', una(links.slice(0, TOPES.links).map(filaDeLink)))

  const audiencia: Fila[] = []
  for (const dimension of DIMENSIONES) {
    for (const b of await breakdownBy(f, COLUMNA_DE[dimension], TOPES.audiencia)) {
      audiencia.push(filaDeAudiencia(dimension, b.key, b.visits, ahoraPagina.visits))
    }
  }
  yield* tabla('audiencia', una(audiencia))

  yield* tabla('cuando', una(filasDelMapa(await getHeatmap(f))))

  // --- programado y comentarios -------------------------------------------------------------------
  const destinos = await leerProgramado(f, cuentaId, ahora, TOPES.programado + 1)
  if (destinos.length > TOPES.programado) cortadas.set('programado', { llevadas: TOPES.programado, cortada: true, porTiempo: false })
  yield* tabla('programado', una(destinos.slice(0, TOPES.programado).map((d) => filaDeDestino(d, zona))))

  const comentariosCuenta: Cuenta = { llevadas: 0, cortada: false, porTiempo: false }
  yield* tabla(
    'comentarios',
    porTandas(
      (cursor, cuantos) => leerComentarios(f, cuentaId, corte, cursor, cuantos),
      TOPES.comentarios,
      (c) => filaDeComentario(c, zona),
      comentariosCuenta,
      terminarAntesDe,
    ),
  )
  cortadas.set('comentarios', comentariosCuenta)

  // --- léeme --------------------------------------------------------------------------------------
  const recortes: Recorte[] = []
  const conteos = [...cortadas.values()].some((c) => c.cortada || c.porTiempo)
    ? await contarFilas(f, dias, cuentaId, corte)
    : null
  for (const [hoja, c] of cortadas) {
    if (!c.cortada && !c.porTiempo) continue
    const total =
      conteos && (hoja === 'visitas' || hoja === 'clicks' || hoja === 'lecturas' || hoja === 'comentarios') ? conteos[hoja] : null
    recortes.push({ hoja, llevadas: c.llevadas, total, porTiempo: c.porTiempo })
  }

  yield* await libro.libre(
    posicion('leeme'),
    ANCHOS_DEL_LEEME,
    filasDelLeeme({
      ahora,
      zona,
      desde: f.periodo.desde,
      hasta: f.periodo.hasta,
      cuenta: cuenta ? nombreDeCuenta(cuenta) : null,
      pagina: p.pagina,
      bots: f.includeBots,
      filas: filasPorHoja,
      recortes,
    }),
  )
  yield* await libro.cierre()
}

/**
 * Las publicaciones de YouTube con lo vencido en blanco: el título de un video que lleva 30 días
 * sin llegar y los contadores de una lectura de antes del corte. La limpieza diaria ya lo borra;
 * esto cubre el día entre una limpieza y otra.
 */
async function sinYoutubeVencido(ownerId: string, filas: PostRow[], corte: Date): Promise<PostRow[]> {
  const deYoutube = filas.filter((fila) => fila.network === 'youtube').map((fila) => fila.id)
  if (deYoutube.length === 0) return filas
  const { sinTexto, sinLectura } = await youtubeVencido(ownerId, deYoutube, corte)
  return filas.map((fila) => {
    if (!sinTexto.has(fila.id) && !sinLectura.has(fila.id)) return fila
    const sinContadores = sinLectura.has(fila.id)
    return {
      ...fila,
      caption: sinTexto.has(fila.id) ? null : fila.caption,
      thumbnailUrl: sinTexto.has(fila.id) ? null : fila.thumbnailUrl,
      views: sinContadores ? null : fila.views,
      likes: sinContadores ? null : fila.likes,
      comments: sinContadores ? null : fila.comments,
      shares: sinContadores ? null : fila.shares,
      saves: sinContadores ? null : fila.saves,
      reach: sinContadores ? null : fila.reach,
    }
  })
}

/** Lo que la ventana del panel muestra antes de armar: qué filtros van y qué hojas no caben enteras. */
export type Adelanto = {
  archivo: string
  /** Las hojas largas que pasan su tope en este período, con cuántas filas hay. */
  noCaben: Array<{ hoja: string; total: number; tope: number; cuales: string }>
}

export async function adelantoDePlanilla(p: Omit<PedidoDePlanilla, 'terminarAntesDe'>): Promise<Adelanto> {
  const f = p.filters
  const conteos = await contarFilas(f, { desde: f.periodo.desde, hasta: f.periodo.hasta }, p.cuenta?.id ?? null, corteDeRetencion(p.ahora))
  const noCaben: Adelanto['noCaben'] = []
  for (const hoja of ['lecturas', 'visitas', 'clicks', 'comentarios'] as const) {
    const d = definicion(hoja)
    const tope = TOPES[hoja]
    if (conteos[hoja] > tope) noCaben.push({ hoja: d.nombre, total: conteos[hoja], tope, cuales: d.cuales ?? '' })
  }
  return { archivo: nombreDelArchivo(f.periodo), noCaben }
}
