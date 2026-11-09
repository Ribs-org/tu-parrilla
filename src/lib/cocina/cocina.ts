import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import {
  comandaEventos,
  comandas,
  creativoMedia,
  creativos,
  getDb,
  insumos,
  latidos,
  preguntas,
  users,
  type Comanda,
  type EstadoComanda,
} from '@/db'
import { esChoqueCon } from '@/lib/choque-de-unicidad'
import { carpetaDeLaApi, typeFromContentType } from '@/lib/social/publish/batch'
import {
  CACHE_INMUTABLE,
  SIN_ALMACEN,
  SUBIDA_SEGUNDOS,
  basePublica,
  keyDesdeUrl,
  objetoEnAlmacen,
  urlParaBajar,
  urlParaSubir,
  urlPublica,
} from '@/lib/storage'
import { prioridadDelDueno } from '@/lib/planes/prioridad'
import { esUuid } from '@/lib/uuid'
import { avisoDelCambio, type AvisoDeComanda } from './correo-de-comanda'
import type { CreativoAnunciado } from './creativo'
import { baseDeNombre } from './insumos'
import { TERMINALES, puedePasar } from './estados'
import { ordenarFila } from './fila'
import { DIAS_INSUMO } from './panel'
import { instruccionDe } from './pedido'
import { preguntaParaElChef, type PreguntaParaElChef } from './pregunta'

// Lo que la API de la cocina lee y escribe (`/api/cocina/…`, `docs/cocina-api.md`). El chef entra
// con la credencial de la cocina, no con la llave de un usuario: ve solo las comandas de quien
// tiene La Cocina encendida (`users.cocina_desde`), y solo lo que esas comandas le entregan. No lee
// posts, cuentas ni métricas de nadie, y no programa nada: lo cocinado lo programa el usuario.

export const COMANDA_NO_EXISTE = 'Esa comanda no existe.'
export const COMANDA_DE_OTRO = 'Esa comanda la tomó otro trabajador.'
export const COMANDA_SIN_TOMAR = 'Esa comanda todavía no está tomada: tómala primero.'
export const COMANDA_TERMINADA = 'Esa comanda ya terminó: no recibe más cambios.'
export const MOTIVO_FALTA = 'Al rechazarla o darla por fallida, di por qué en «motivo»: el usuario lo lee.'
export const INSUMO_NO_EXISTE = 'Ese insumo no existe, o ya se borró.'
export const CREATIVO_NO_EXISTE = 'Ese creativo no existe.'

export function transicionInvalida(de: EstadoComanda, a: string): string {
  return `Una comanda en «${de}» no pasa a «${a}».`
}

export function faltaArchivo(nombre: string): string {
  return `Falta subir «${nombre}», o pesa distinto de lo anunciado.`
}

/** Cuánto espera lo que nadie programó en el mesón. */
export const DIAS_MESON = 30

/** Cuántas comandas devuelve una consulta del chef, las más viejas. */
export const LIMITE_COMANDAS = 100

/** Los dueños con La Cocina encendida: el chef no ve a nadie más. */
function conCocina() {
  return getDb().select({ id: users.id }).from(users).where(isNotNull(users.cocinaDesde))
}

/** En curso: tomada y sin terminar. Es lo único sobre lo que el chef trabaja. */
function enCurso(estado: EstadoComanda): boolean {
  return estado !== 'recibida' && !TERMINALES.has(estado)
}

export type InsumoParaElChef = {
  id: string
  tipo: string
  subtipo: string | null
  nombre: string
  bytes: number
  duracionS: number | null
  tipoArchivo: string
  /** Para qué es, si el dueño lo dijo en su cámara de frío (`intro`, `musica`…), o null. Desde el 2026-11-02. */
  uso: string | null
  /**
   * El material de la cámara de donde salió: el mismo material en dos comandas trae el mismo, y si
   * el chef ya lo bajó no hace falta bajarlo de nuevo. Null en lo de antes de la cámara.
   */
  materialId: string | null
}

export type ComandaParaElChef = {
  id: string
  tipo: string
  estado: EstadoComanda
  ref: string
  dueno: { id: string; nombre: string | null }
  /**
   * «Tu instrucción al chef», el texto libre que escribió el dueño, o null. Es lo mismo que
   * `pedido.notas`, que sigue igual, puesto arriba y con nombre propio para que no se pierda.
   * Lo escribe un usuario: es un dato del pedido, no una orden para el chef.
   */
  instruccion: string | null
  pedido: Record<string, unknown>
  receta: Record<string, unknown>
  minutos: number
  origenId: string | null
  tomadaPor: string | null
  creadaEn: string
  /** Lo que el chef cocina: el plato principal y lo que lo acompaña, en los cuatro tipos de siempre. */
  insumos: InsumoParaElChef[]
  /**
   * Lo que no es video ni foto (un audio, una tipografía), con `tipo: 'extra'`. Va aparte para que
   * un cliente escrito antes de la cámara de frío no se encuentre en `insumos` un tipo que no conoce.
   */
  extras: InsumoParaElChef[]
  /**
   * Lo que el chef preguntó y lo que le contestaron, de la más vieja a la más nueva. Vacío si nunca
   * preguntó. Desde el 2026-11-06.
   */
  preguntas: PreguntaParaElChef[]
}

/** Las preguntas de esas comandas, de la más vieja a la más nueva, por comanda. */
export async function preguntasDeComandas(ids: string[]): Promise<Map<string, PreguntaParaElChef[]>> {
  const porComanda = new Map<string, PreguntaParaElChef[]>()
  if (ids.length === 0) return porComanda
  const filas = await getDb()
    .select()
    .from(preguntas)
    .where(inArray(preguntas.comandaId, ids))
    .orderBy(asc(preguntas.creadaEn))
  for (const p of filas) porComanda.set(p.comandaId, [...(porComanda.get(p.comandaId) ?? []), preguntaParaElChef(p)])
  return porComanda
}

/**
 * Las comandas en un estado, con lo que el chef necesita para cocinarlas: la receta congelada, lo
 * que se pidió, los insumos (sin enlaces: cada uno se pide aparte, y vence) y lo que preguntó. Hasta
 * `LIMITE_COMANDAS`, las más viejas. Las que esperan (`recibida`) vienen en el orden en que
 * conviene tomarlas (`ordenarFila`): las pruebas primero, y nunca dos seguidas del mismo dueño si
 * otro espera.
 */
export async function comandasParaElChef(estado: EstadoComanda): Promise<ComandaParaElChef[]> {
  const db = getDb()
  const filas = await db
    .select({ comanda: comandas, nombre: users.nombre, prioridad: prioridadDelDueno(comandas.ownerId) })
    .from(comandas)
    .innerJoin(users, eq(users.id, comandas.ownerId))
    .where(and(eq(comandas.estado, estado), inArray(comandas.ownerId, conCocina())))
    // En las que esperan, la prioridad del plan va antes del límite: una comanda pagada nueva no
    // queda fuera detrás de cien gratis más viejas, y `ordenarFila` reparte después dentro de cada
    // prioridad. Las de otro estado van por fecha, como promete `docs/cocina-api.md`.
    .orderBy(
      ...(estado === 'recibida'
        ? [desc(prioridadDelDueno(comandas.ownerId)), asc(comandas.creadaEn)]
        : [asc(comandas.creadaEn)]),
    )
    .limit(LIMITE_COMANDAS)
  if (filas.length === 0) return []

  const ids = filas.map((f) => f.comanda.id)
  const deInsumos = await db
    .select()
    .from(insumos)
    .where(and(inArray(insumos.comandaId, ids), isNull(insumos.borradoEn)))
    .orderBy(asc(insumos.posicion), asc(insumos.creadoEn))
  const porComanda = new Map<string, InsumoParaElChef[]>()
  for (const i of deInsumos) {
    const lista = porComanda.get(i.comandaId!) ?? []
    lista.push({
      id: i.id,
      tipo: i.tipo,
      subtipo: i.subtipo,
      nombre: i.nombre,
      bytes: i.bytes,
      duracionS: i.duracionS,
      tipoArchivo: i.tipoArchivo,
      uso: i.uso,
      materialId: i.materialId,
    })
    porComanda.set(i.comandaId!, lista)
  }
  // Una que espera nunca preguntó: se pregunta después de tomarla.
  const deLasPreguntas = estado === 'recibida' ? new Map<string, PreguntaParaElChef[]>() : await preguntasDeComandas(ids)

  const armadas = filas.map(({ comanda: c, nombre, prioridad }) => ({
    id: c.id,
    ownerId: c.ownerId,
    tipo: c.tipo,
    creadaEn: c.creadaEn,
    prioridad,
    salida: {
      id: c.id,
      tipo: c.tipo,
      estado: c.estado,
      ref: c.ref,
      dueno: { id: c.ownerId, nombre },
      instruccion: instruccionDe(c.pedido),
      pedido: c.pedido,
      receta: c.receta,
      minutos: c.minutos,
      origenId: c.origenId,
      tomadaPor: c.tomadaPor,
      creadaEn: c.creadaEn.toISOString(),
      insumos: (porComanda.get(c.id) ?? []).filter((i) => i.tipo !== 'extra'),
      extras: (porComanda.get(c.id) ?? []).filter((i) => i.tipo === 'extra'),
      preguntas: deLasPreguntas.get(c.id) ?? [],
    } satisfies ComandaParaElChef,
  }))
  const ordenadas = estado === 'recibida' ? ordenarFila(armadas) : armadas
  return ordenadas.map((a) => a.salida)
}

/** La comanda, si es de alguien con La Cocina encendida. */
export async function comandaDelChef(id: string): Promise<Comanda | null> {
  return leer(id)
}

async function leer(id: string): Promise<Comanda | null> {
  if (!esUuid(id)) return null
  const [c] = await getDb()
    .select()
    .from(comandas)
    .where(and(eq(comandas.id, id), inArray(comandas.ownerId, conCocina())))
  return c ?? null
}

export type ResultadoTomar = { ok: true; comanda: Comanda } | { falla: 'no-existe' | 'de-otro' | 'terminada' }

/**
 * La toma para un trabajador: de `recibida` a `revisando`. Tomarla otra vez el mismo trabajador no
 * hace nada (un reintento es seguro); si la tomó otro, no. La escritura exige `recibida` en su
 * `where`, por la carrera entre dos trabajadores y con una cancelación del usuario.
 */
export async function tomarComanda(id: string, trabajador: string, ahora: Date): Promise<ResultadoTomar> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  const db = getDb()
  const [tomada] = await db
    .update(comandas)
    .set({ estado: 'revisando', tomadaPor: trabajador, tomadaEn: ahora, actualizadaEn: ahora })
    .where(and(eq(comandas.id, id), eq(comandas.estado, 'recibida'), inArray(comandas.ownerId, conCocina())))
    .returning()
  if (tomada) {
    await db.insert(comandaEventos).values({ comandaId: id, estado: 'revisando', creadoEn: ahora })
    return { ok: true, comanda: tomada }
  }
  const actual = await leer(id)
  if (!actual) return { falla: 'no-existe' }
  if (actual.tomadaPor === trabajador && enCurso(actual.estado)) return { ok: true, comanda: actual }
  return { falla: TERMINALES.has(actual.estado) ? 'terminada' : 'de-otro' }
}

export type CambioDeEstado = {
  estado: EstadoComanda
  mensaje?: string | null
  eta?: Date | null
  motivo?: string | null
  tandas?: { servidas: number; total: number | null }
  /** El asunto del correo que dispara este cambio, ya saneado (`asuntoDe`). No se guarda: va solo al correo. */
  asunto?: string | null
}

export type ResultadoCambio =
  /**
   * `aviso` es el correo que este cambio le debe al dueño (`avisarDeLaComanda`), o null. Lo trae
   * solo la llamada que escribió la transición: es lo que hace que salga uno por cambio.
   */
  | { ok: true; comanda: Comanda; aviso: AvisoDeComanda | null }
  | { falla: 'no-existe' | 'sin-tomar' | 'terminada' | 'motivo' }
  | { falla: 'transicion'; de: EstadoComanda }

/**
 * Un cambio de estado del chef, si la transición existe (`puedePasar`). Rechazar o dar por fallida
 * pide el motivo, que es lo que el usuario lee. La escritura exige el estado leído en su `where`:
 * si el usuario canceló entre medio, el cambio no pasa y lo dice.
 *
 * Esa misma condición decide el correo al dueño. Dos peticiones que llevan la comanda a `lista` a
 * la vez —un reintento del chef que sale antes de que vuelva la primera— leen el mismo estado,
 * pero Postgres deja escribir a una sola: la otra espera el candado de la fila, vuelve a mirar el
 * `where`, ya no calza y termina en `409`. Y un reintento posterior choca con la transición
 * (`lista` no pasa a `lista`; lo terminado no se mueve). Así, el `aviso` sale de una sola llamada.
 * La primera tanda, igual: avisa solo el paso que entra a `sirviendo` (`avisoDelCambio`), y uno de
 * `sirviendo` a `sirviendo` —otra tanda, o un reintento— no avisa.
 */
export async function cambiarEstado(id: string, cambio: CambioDeEstado, ahora: Date): Promise<ResultadoCambio> {
  const actual = await leer(id)
  if (!actual) return { falla: 'no-existe' }
  if (actual.estado === 'recibida') return { falla: 'sin-tomar' }
  if (TERMINALES.has(actual.estado)) return { falla: 'terminada' }
  if (!puedePasar(actual.estado, cambio.estado)) return { falla: 'transicion', de: actual.estado }
  const terminaMal = cambio.estado === 'rechazada' || cambio.estado === 'fallida'
  if (terminaMal && !cambio.motivo?.trim()) return { falla: 'motivo' }

  // El cambio, su paso en la línea de tiempo y, si terminó mal, el vencimiento de lo crudo: las
  // tres cosas o ninguna.
  const escrita = await getDb().transaction(async (tx) => {
    const [fila] = await tx
      .update(comandas)
      .set({
        estado: cambio.estado,
        mensaje: cambio.mensaje?.trim() || null,
        ...(cambio.eta !== undefined ? { eta: cambio.eta } : {}),
        ...(terminaMal ? { motivo: cambio.motivo!.trim() } : {}),
        ...(cambio.tandas ? { tandasServidas: cambio.tandas.servidas, tandasTotal: cambio.tandas.total } : {}),
        ...(cambio.estado === 'lista' ? { listaEn: ahora } : {}),
        actualizadaEn: ahora,
      })
      .where(and(eq(comandas.id, id), eq(comandas.estado, actual.estado)))
      .returning()
    if (!fila) return null
    await tx.insert(comandaEventos).values({
      comandaId: id,
      estado: cambio.estado,
      mensaje: fila.mensaje ?? (terminaMal ? fila.motivo : null),
      eta: fila.eta,
      creadoEn: ahora,
    })
    // Rechazada o fallida, lo crudo con archivo propio (lo de antes de la cámara de frío) se guarda
    // `DIAS_INSUMO` más y lo borra el barrido de la cocina. Lo que vino de la cámara no vence.
    if (terminaMal) {
      await tx
        .update(insumos)
        .set({ expiraEn: new Date(ahora.getTime() + DIAS_INSUMO * 86_400_000) })
        .where(and(eq(insumos.comandaId, id), isNull(insumos.expiraEn), isNull(insumos.materialId)))
    }
    return fila
  })
  if (!escrita) {
    const ahoraEsta = await leer(id)
    if (!ahoraEsta) return { falla: 'no-existe' }
    return TERMINALES.has(ahoraEsta.estado) ? { falla: 'terminada' } : { falla: 'transicion', de: ahoraEsta.estado }
  }
  return { ok: true, comanda: escrita, aviso: avisoDelCambio(actual.estado, escrita.estado) }
}

export type ResultadoEnlace = { url: string; vence: string } | { falla: 'no-existe' | 'sin-tomar' | 'terminada' }

/** Un enlace firmado para bajar un insumo, si su comanda está tomada y en curso. Vence en una hora. */
export async function enlaceDeInsumo(id: string, ahora: Date): Promise<ResultadoEnlace> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  const [fila] = await getDb()
    .select({ insumo: insumos, estado: comandas.estado })
    .from(insumos)
    .innerJoin(comandas, eq(comandas.id, insumos.comandaId))
    .where(and(eq(insumos.id, id), isNull(insumos.borradoEn), inArray(comandas.ownerId, conCocina())))
  if (!fila) return { falla: 'no-existe' }
  if (fila.estado === 'recibida') return { falla: 'sin-tomar' }
  if (TERMINALES.has(fila.estado)) return { falla: 'terminada' }
  const base = basePublica()
  const key = base ? keyDesdeUrl(base, fila.insumo.url) : null
  if (!key) return { falla: 'no-existe' }
  return {
    url: await urlParaBajar(key, SUBIDA_SEGUNDOS),
    vence: new Date(ahora.getTime() + SUBIDA_SEGUNDOS * 1000).toISOString(),
  }
}

export type ArchivoParaSubir = {
  nombre: string
  rol: 'media' | 'portada'
  url: string
  subir: string
  cabeceras: Record<string, string>
}

/** `nuevo` dice si este anuncio lo creó (la ruta responde `201`) o si ya existía (`200`). */
export type ResultadoAnuncio =
  | { ok: true; id: string; estado: string; nuevo: boolean; repetido: boolean; archivos: ArchivoParaSubir[]; vence: string | null }
  | { falla: 'no-existe' | 'sin-tomar' | 'terminada' }

/** La clave de un archivo de un creativo, en la carpeta del dueño: programarlo no lo vuelve a bajar. */
export function claveDeCreativo(ownerId: string, comandaId: string, nombre: string, tipo: string, uuid: string): string {
  const extension = typeFromContentType(tipo)?.extension ?? 'bin'
  return `${carpetaDeLaApi(ownerId)}cocina/${comandaId}/${uuid}-${baseDeNombre(nombre)}.${extension}`
}

async function firmar(
  filas: Array<{ nombre: string; rol: 'media' | 'portada'; url: string; tipo: string }>,
): Promise<ArchivoParaSubir[]> {
  const base = basePublica()
  const archivos: ArchivoParaSubir[] = []
  for (const f of filas) {
    const key = base ? keyDesdeUrl(base, f.url) : null
    if (!key) continue
    const { subir } = await urlParaSubir(key, f.tipo)
    archivos.push({
      nombre: f.nombre,
      rol: f.rol,
      url: f.url,
      subir,
      cabeceras: { 'Content-Type': f.tipo, 'Cache-Control': CACHE_INMUTABLE },
    })
  }
  return archivos
}

/**
 * Anuncia un creativo de una comanda en curso: lo crea `subiendo`, con sus archivos ya en la base
 * —así el barrido de huérfanos no los borra mientras suben— y devuelve un PUT firmado por archivo.
 * La `ref` lo hace repetible: anunciarlo otra vez mientras sube devuelve enlaces nuevos para los
 * mismos archivos; ya cerrado, dice `repetido` y no devuelve nada que subir. Dos anuncios de la
 * misma `ref` a la vez —un reintento que sale antes de que vuelva el primero— terminan en el mismo
 * creativo: el segundo choca con la unicidad y vuelve a leer.
 */
export async function anunciarCreativo(
  comandaId: string,
  datos: CreativoAnunciado,
  ahora: Date,
  uuid: () => string = randomUUID,
): Promise<ResultadoAnuncio> {
  const comanda = await leer(comandaId)
  if (!comanda) return { falla: 'no-existe' }
  if (comanda.estado === 'recibida') return { falla: 'sin-tomar' }
  if (TERMINALES.has(comanda.estado)) return { falla: 'terminada' }
  const db = getDb()
  const vence = new Date(ahora.getTime() + SUBIDA_SEGUNDOS * 1000).toISOString()

  const [existente] = await db
    .select()
    .from(creativos)
    .where(and(eq(creativos.comandaId, comandaId), eq(creativos.ref, datos.ref)))
  if (existente) {
    if (existente.estado !== 'subiendo') {
      return { ok: true, id: existente.id, estado: existente.estado, nuevo: false, repetido: true, archivos: [], vence: null }
    }
    const archivos = await db.select().from(creativoMedia).where(eq(creativoMedia.creativoId, existente.id))
    const conTipo = archivos.map((a) => ({ nombre: a.nombre, rol: a.rol, url: a.url, tipo: a.tipoArchivo }))
    return { ok: true, id: existente.id, estado: existente.estado, nuevo: false, repetido: false, archivos: await firmar(conTipo), vence }
  }

  const base = basePublica()
  if (!base) throw new Error(SIN_ALMACEN)
  const conUrl = datos.archivos.map((a) => ({
    ...a,
    url: urlPublica(base, claveDeCreativo(comanda.ownerId, comandaId, a.nombre, a.tipo, uuid())),
  }))

  let creado
  try {
    creado = await crearCreativo(comanda, datos, conUrl, ahora)
  } catch (e) {
    if (esChoqueCon(e, 'creativos_comanda_ref_key')) return anunciarCreativo(comandaId, datos, ahora, uuid)
    throw e
  }
  return { ok: true, id: creado.id, estado: creado.estado, nuevo: true, repetido: false, archivos: await firmar(conUrl), vence }
}

/** El creativo y sus archivos, en una transacción: o están los dos, o ninguno. */
function crearCreativo(
  comanda: Comanda,
  datos: CreativoAnunciado,
  conUrl: Array<CreativoAnunciado['archivos'][number] & { url: string }>,
  ahora: Date,
) {
  const portada = conUrl.find((a) => a.rol === 'portada')
  return getDb().transaction(async (tx) => {
    const [c] = await tx
      .insert(creativos)
      .values({
        ownerId: comanda.ownerId,
        comandaId: comanda.id,
        marcaId: comanda.marcaId,
        ref: datos.ref,
        pieza: datos.pieza,
        tanda: datos.tanda,
        tipo: datos.tipo,
        portadaUrl: portada?.url ?? null,
        texto: datos.texto,
        tituloYoutube: datos.tituloYoutube,
        estilo: datos.estilo,
        atributos: datos.atributos,
        duracionS: datos.duracionS,
        estado: 'subiendo',
        creadoEn: ahora,
      })
      .returning()
    let posicion = 0
    await tx.insert(creativoMedia).values(
      conUrl.map((a) => ({
        creativoId: c!.id,
        url: a.url,
        mediaType: a.mediaType,
        nombre: a.nombre,
        tipoArchivo: a.tipo,
        bytes: a.bytes,
        rol: a.rol,
        position: a.rol === 'portada' ? -1 : posicion++,
      })),
    )
    return c!
  })
}

export type ResultadoCierre = { ok: true; id: string; estado: string } | { falla: 'no-existe' | 'terminada' } | { falla: 'falta'; nombre: string }

/**
 * Lo cierra después de subir: mira que cada archivo esté en el almacén y pese lo anunciado
 * (`objetoEnAlmacen`, el mismo de `POST /api/media`), y recién ahí lo pone en el mesón, con 30
 * días para que alguien lo programe. Cerrarlo otra vez no hace nada.
 */
export async function cerrarCreativo(id: string, ahora: Date): Promise<ResultadoCierre> {
  if (!esUuid(id)) return { falla: 'no-existe' }
  const db = getDb()
  const [fila] = await db
    .select({ creativo: creativos, estadoComanda: comandas.estado })
    .from(creativos)
    .innerJoin(comandas, eq(comandas.id, creativos.comandaId))
    .where(and(eq(creativos.id, id), inArray(creativos.ownerId, conCocina())))
  if (!fila) return { falla: 'no-existe' }
  if (fila.creativo.estado !== 'subiendo') return { ok: true, id, estado: fila.creativo.estado }
  if (TERMINALES.has(fila.estadoComanda)) return { falla: 'terminada' }

  const archivos = await db.select().from(creativoMedia).where(eq(creativoMedia.creativoId, id))
  for (const a of archivos) {
    const objeto = await objetoEnAlmacen(a.url)
    if (!objeto || objeto.bytes !== a.bytes) return { falla: 'falta', nombre: a.nombre }
  }
  const [cerrado] = await db
    .update(creativos)
    .set({ estado: 'mesa', expiraEn: new Date(ahora.getTime() + DIAS_MESON * 86_400_000) })
    .where(and(eq(creativos.id, id), eq(creativos.estado, 'subiendo')))
    .returning({ estado: creativos.estado })
  return { ok: true, id, estado: cerrado?.estado ?? 'mesa' }
}

/** El latido de un trabajador: que está vivo, y lo que cuenta de sí. */
export async function latir(trabajador: string, datos: Record<string, unknown> | null, ahora: Date): Promise<void> {
  await getDb()
    .insert(latidos)
    .values({ trabajador, en: ahora, datos })
    .onConflictDoUpdate({ target: latidos.trabajador, set: { en: ahora, datos } })
}
