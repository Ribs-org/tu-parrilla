import 'server-only'
import { randomUUID } from 'node:crypto'
import { and, asc, count, desc, eq, inArray, isNull } from 'drizzle-orm'
import { getDb, paseComentarios, pasePiezas, pases, type EstadoPiezaDelPase } from '@/db'
import { copiarMedia } from '@/lib/social/publish/batch'
import { MAX_BYTES_ARCHIVO } from '@/lib/social/publish/limites'
import { basePublica, keyDesdeUrl, objetoEnAlmacen, urlParaSubir } from '@/lib/storage'
import { isoInZone } from '@/lib/metrics-api'
import { esUuid } from '@/lib/uuid'
import {
  ARCHIVO_NO_LLEGO,
  COMENTARIO_NO_EXISTE,
  DEMASIADAS_PIEZAS,
  ESTADOS_DE_PIEZA,
  ESTADO_INVALIDO,
  FALTA_AUTOR,
  FALTA_TEXTO,
  FALTA_TITULO,
  MAX_AUTOR,
  MAX_INSTRUCCIONES,
  MAX_NOTAS,
  MAX_PIEZAS,
  MAX_TEXTO,
  MAX_TITULO,
  MUY_GRANDE,
  PIEZA_NO_EXISTE,
  TIPOS_DE_ARCHIVO,
  TIPO_NO_SIRVE,
  VARIANTE_INVALIDA,
  VARIANTE_REPETIDA,
  CLAVES_DE_ETIQUETA,
  ETIQUETA_INVALIDA,
  codigoNuevo,
  cuandoEnTexto,
  rolDelCodigo,
  type ComentarioNuevo,
  type PaseParaLaApi,
  type RolDelPase,
} from './reglas'

// El Pase contra la base (`reglas.ts` tiene lo puro). El admin lo administra desde el panel, atado a
// su `owner_id`; todo lo demás entra por un código (`entrarConCodigo`), y desde ahí cada consulta va
// acotada al pase de ese código: una pieza o un comentario de otro pase no existe para él.

export type Pase = typeof pases.$inferSelect
export type Pieza = typeof pasePiezas.$inferSelect
export type Comentario = typeof paseComentarios.$inferSelect

/** La zona con que se escriben las fechas que entrega la API. */
const ZONA = 'America/Santiago'

// --- Lo del admin, en el panel -------------------------------------------------------------------

function tituloLimpio(titulo: unknown): string | null {
  const t = typeof titulo === 'string' ? titulo.trim() : ''
  return t && t.length <= MAX_TITULO ? t : null
}

function instruccionesLimpias(instrucciones: unknown): string {
  return typeof instrucciones === 'string' ? instrucciones.trim().slice(0, MAX_INSTRUCCIONES) : ''
}

export async function crearPase(ownerId: string, datos: { titulo: unknown; instrucciones?: unknown }): Promise<{ pase: Pase } | { error: string }> {
  const titulo = tituloLimpio(datos.titulo)
  if (!titulo) return { error: FALTA_TITULO }
  const [pase] = await getDb()
    .insert(pases)
    .values({
      ownerId,
      titulo,
      instrucciones: instruccionesLimpias(datos.instrucciones),
      codigoRevisor: codigoNuevo('revisor'),
      codigoEditor: codigoNuevo('editor'),
    })
    .returning()
  return { pase: pase! }
}

/** Los pases del dueño, los vivos primero, con cuántas piezas y críticas abiertas tiene cada uno. */
export async function pasesDe(ownerId: string): Promise<Array<Pase & { piezas: number; abiertos: number }>> {
  const db = getDb()
  const lista = await db.select().from(pases).where(eq(pases.ownerId, ownerId)).orderBy(desc(pases.creadoEn))
  if (lista.length === 0) return []
  const ids = lista.map((p) => p.id)
  const piezas = await db
    .select({ paseId: pasePiezas.paseId, n: count() })
    .from(pasePiezas)
    .where(inArray(pasePiezas.paseId, ids))
    .groupBy(pasePiezas.paseId)
  const abiertos = await db
    .select({ paseId: paseComentarios.paseId, n: count() })
    .from(paseComentarios)
    .where(and(inArray(paseComentarios.paseId, ids), eq(paseComentarios.estado, 'abierto')))
    .groupBy(paseComentarios.paseId)
  const nPiezas = new Map(piezas.map((f) => [f.paseId, f.n]))
  const nAbiertos = new Map(abiertos.map((f) => [f.paseId, f.n]))
  return lista
    .map((p) => ({ ...p, piezas: nPiezas.get(p.id) ?? 0, abiertos: nAbiertos.get(p.id) ?? 0 }))
    .sort((a, b) => Number(a.archivadoEn !== null) - Number(b.archivadoEn !== null))
}

/** Un cambio del admin sobre su pase: false si el pase no es suyo. */
async function cambiarPase(ownerId: string, id: string, cambios: Partial<typeof pases.$inferInsert>): Promise<boolean> {
  if (!esUuid(id)) return false
  const filas = await getDb()
    .update(pases)
    .set({ ...cambios, actualizadoEn: new Date() })
    .where(and(eq(pases.id, id), eq(pases.ownerId, ownerId)))
    .returning({ id: pases.id })
  return filas.length > 0
}

export async function editarPase(ownerId: string, id: string, datos: { titulo: unknown; instrucciones?: unknown }): Promise<{ ok: true } | { error: string }> {
  const titulo = tituloLimpio(datos.titulo)
  if (!titulo) return { error: FALTA_TITULO }
  const ok = await cambiarPase(ownerId, id, { titulo, instrucciones: instruccionesLimpias(datos.instrucciones) })
  return ok ? { ok: true } : { error: 'Ese pase no existe.' }
}

/** Dos códigos nuevos: los enlaces de antes dejan de servir, para quien los tenga. */
export function cambiarCodigos(ownerId: string, id: string): Promise<boolean> {
  return cambiarPase(ownerId, id, { codigoRevisor: codigoNuevo('revisor'), codigoEditor: codigoNuevo('editor') })
}

/** Archivado, sus enlaces no abren; desarchivado, vuelven a abrir los mismos. */
export function archivarPase(ownerId: string, id: string, archivar: boolean): Promise<boolean> {
  return cambiarPase(ownerId, id, { archivadoEn: archivar ? new Date() : null })
}

// --- Por código ----------------------------------------------------------------------------------

/** El pase de un código, y lo que ese código deja hacer. Null si no existe o el pase está archivado. */
export async function entrarConCodigo(codigo: string): Promise<{ pase: Pase; rol: RolDelPase } | null> {
  const rol = rolDelCodigo(codigo)
  if (!rol) return null
  const columna = rol === 'revisor' ? pases.codigoRevisor : pases.codigoEditor
  const [pase] = await getDb()
    .select()
    .from(pases)
    .where(and(eq(columna, codigo), isNull(pases.archivadoEn)))
  return pase ? { pase, rol } : null
}

function piezaParaLaApi(p: Pieza, comentarios: Comentario[]): PaseParaLaApi['piezas'][number] {
  return {
    id: p.id,
    grupo: p.grupo,
    version: p.version,
    variante: p.variante,
    titulo: p.titulo,
    tipo: p.tipo,
    url: p.url,
    notas: p.notas,
    respondeA: p.respondeA,
    estado: p.estado,
    estadoPor: p.estadoPor,
    creadaEn: isoInZone(p.creadaEn, ZONA),
    comentarios: comentarios
      .filter((c) => c.piezaId === p.id)
      .sort((a, b) => (a.desdeMs ?? -1) - (b.desdeMs ?? -1) || a.creadoEn.getTime() - b.creadoEn.getTime())
      .map((c) => ({
        id: c.id,
        autor: c.autor,
        etiqueta: c.etiqueta,
        texto: c.texto,
        desde: c.desdeMs === null ? null : c.desdeMs / 1000,
        hasta: c.hastaMs === null ? null : c.hastaMs / 1000,
        cuando: cuandoEnTexto(c.desdeMs, c.hastaMs),
        zona: c.zona,
        estado: c.estado,
        respuesta: c.respuesta,
        resueltoEn: c.resueltoEn,
        creadoEn: isoInZone(c.creadoEn, ZONA),
      })),
  }
}

/** El pase entero, como lo entregan la página y la API: las piezas en el orden en que llegaron. */
export async function paseParaLaApi(pase: Pase, rol: RolDelPase): Promise<PaseParaLaApi> {
  const db = getDb()
  const piezas = await db.select().from(pasePiezas).where(eq(pasePiezas.paseId, pase.id)).orderBy(asc(pasePiezas.creadaEn))
  const comentarios = await db.select().from(paseComentarios).where(eq(paseComentarios.paseId, pase.id))
  return {
    rol,
    titulo: pase.titulo,
    instrucciones: pase.instrucciones,
    piezas: piezas.map((p) => piezaParaLaApi(p, comentarios)),
  }
}

async function piezaDelPase(paseId: string, piezaId: string): Promise<Pieza | null> {
  if (!esUuid(piezaId)) return null
  const [pieza] = await getDb()
    .select()
    .from(pasePiezas)
    .where(and(eq(pasePiezas.id, piezaId), eq(pasePiezas.paseId, paseId)))
  return pieza ?? null
}

async function comentarioDelPase(paseId: string, id: string): Promise<Comentario | null> {
  if (!esUuid(id)) return null
  const [c] = await getDb()
    .select()
    .from(paseComentarios)
    .where(and(eq(paseComentarios.id, id), eq(paseComentarios.paseId, paseId)))
  return c ?? null
}

async function tocarPase(paseId: string): Promise<void> {
  await getDb().update(pases).set({ actualizadoEn: new Date() }).where(eq(pases.id, paseId))
}

/** Una crítica nueva, ya validada (`comentarioNuevo`), sobre una pieza de este pase. */
export async function comentar(pase: Pase, nuevo: ComentarioNuevo): Promise<{ comentario: Comentario } | { error: string }> {
  const pieza = await piezaDelPase(pase.id, nuevo.piezaId)
  if (!pieza) return { error: PIEZA_NO_EXISTE }
  const [comentario] = await getDb()
    .insert(paseComentarios)
    .values({
      paseId: pase.id,
      piezaId: pieza.id,
      autor: nuevo.autor,
      texto: nuevo.texto,
      etiqueta: nuevo.etiqueta,
      desdeMs: nuevo.desdeMs,
      hastaMs: nuevo.hastaMs,
      zona: nuevo.zona,
    })
    .returning()
  await tocarPase(pase.id)
  return { comentario: comentario! }
}

/**
 * Cambiar una crítica. Quien revisa corrige su texto o su etiqueta, o la vuelve a abrir; quien edita
 * la contesta y la marca hecha (o la vuelve a abrir, si se apuró). Lo que el rol no puede tocar no se
 * ignora: se rechaza con su frase, para que una IA sepa que no pasó.
 */
export async function cambiarComentario(
  pase: Pase,
  rol: RolDelPase,
  id: string,
  cuerpo: unknown,
): Promise<{ comentario: Comentario } | { error: string }> {
  const actual = await comentarioDelPase(pase.id, id)
  if (!actual) return { error: COMENTARIO_NO_EXISTE }
  if (!cuerpo || typeof cuerpo !== 'object') return { error: 'El cuerpo no se entendió: tiene que ser JSON.' }
  const c = cuerpo as Record<string, unknown>
  const cambios: Partial<typeof paseComentarios.$inferInsert> = {}

  const permitidas = rol === 'revisor' ? ['texto', 'etiqueta', 'estado'] : ['estado', 'respuesta']
  const ajenas = Object.keys(c).filter((k) => !permitidas.includes(k))
  if (ajenas.length > 0) {
    return { error: `Con este enlace se cambia solo ${permitidas.map((p) => `«${p}»`).join(', ')}.` }
  }
  if (c.texto !== undefined) {
    const texto = typeof c.texto === 'string' ? c.texto.trim() : ''
    if (!texto || texto.length > MAX_TEXTO) return { error: FALTA_TEXTO }
    cambios.texto = texto
  }
  if (c.etiqueta !== undefined) {
    if (typeof c.etiqueta !== 'string' || !CLAVES_DE_ETIQUETA.has(c.etiqueta)) return { error: ETIQUETA_INVALIDA }
    cambios.etiqueta = c.etiqueta
  }
  if (c.respuesta !== undefined) {
    if (c.respuesta !== null && typeof c.respuesta !== 'string') return { error: FALTA_TEXTO }
    const respuesta = typeof c.respuesta === 'string' ? c.respuesta.trim().slice(0, MAX_TEXTO) : ''
    cambios.respuesta = respuesta || null
  }
  if (c.estado !== undefined) {
    if (c.estado !== 'abierto' && c.estado !== 'resuelto') return { error: '«estado» es «abierto» o «resuelto».' }
    cambios.estado = c.estado
    cambios.resueltoAt = c.estado === 'resuelto' ? (actual.resueltoAt ?? new Date()) : null
    if (c.estado === 'abierto') cambios.resueltoEn = null
  }
  if (Object.keys(cambios).length === 0) return { comentario: actual }
  const [comentario] = await getDb().update(paseComentarios).set(cambios).where(eq(paseComentarios.id, actual.id)).returning()
  await tocarPase(pase.id)
  return { comentario: comentario! }
}

/** Quien revisa borra una crítica que no quería dejar. */
export async function borrarComentario(pase: Pase, id: string): Promise<boolean> {
  const actual = await comentarioDelPase(pase.id, id)
  if (!actual) return false
  await getDb().delete(paseComentarios).where(eq(paseComentarios.id, actual.id))
  await tocarPase(pase.id)
  return true
}

/** El veredicto de quien revisa sobre una pieza. */
export async function darVeredicto(pase: Pase, piezaId: string, estado: unknown, autor: unknown): Promise<{ pieza: Pieza } | { error: string }> {
  if (typeof estado !== 'string' || !ESTADOS_DE_PIEZA.includes(estado as EstadoPiezaDelPase)) return { error: ESTADO_INVALIDO }
  const quien = typeof autor === 'string' ? autor.trim() : ''
  if (!quien || quien.length > MAX_AUTOR) return { error: FALTA_AUTOR }
  const actual = await piezaDelPase(pase.id, piezaId)
  if (!actual) return { error: PIEZA_NO_EXISTE }
  const [pieza] = await getDb()
    .update(pasePiezas)
    .set({ estado: estado as EstadoPiezaDelPase, estadoPor: quien, estadoEn: new Date() })
    .where(eq(pasePiezas.id, actual.id))
    .returning()
  await tocarPase(pase.id)
  return { pieza: pieza! }
}

// --- Los archivos --------------------------------------------------------------------------------

/** La carpeta del almacén de un pase: lo que se sube con su enlace firmado va ahí, y solo ahí. */
export function carpetaDelPase(paseId: string): string {
  return `pase/${paseId}/`
}

/** Un enlace firmado para subir un archivo al pase, directo al almacén, sin pasar por la función. */
export async function enlaceDeSubida(
  pase: Pase,
  cuerpo: unknown,
): Promise<{ subir: string; url: string; contentType: string } | { error: string }> {
  const c = (cuerpo && typeof cuerpo === 'object' ? cuerpo : {}) as Record<string, unknown>
  const contentType = typeof c.tipo === 'string' ? c.tipo.split(';')[0]!.trim().toLowerCase() : ''
  const archivo = TIPOS_DE_ARCHIVO[contentType]
  if (!archivo) return { error: TIPO_NO_SIRVE }
  const bytes = typeof c.bytes === 'number' ? c.bytes : 0
  const tope = archivo.tipo === 'video' ? MAX_BYTES_ARCHIVO : 50 * 1024 * 1024
  if (bytes > tope) return { error: MUY_GRANDE }
  const { subir, publica } = await urlParaSubir(`${carpetaDelPase(pase.id)}${randomUUID()}.${archivo.extension}`, contentType)
  return { subir, url: publica, contentType }
}

/**
 * El archivo de una pieza nueva: lo que se subió con el enlace del pase (ya está en su carpeta: solo
 * se comprueba que llegó y qué es), o una URL pública cualquiera, que se copia al almacén.
 */
async function traerArchivo(paseId: string, url: string): Promise<{ url: string; tipo: 'video' | 'imagen' } | { error: string }> {
  const base = basePublica()
  const key = base ? keyDesdeUrl(base, url) : null
  if (key?.startsWith(carpetaDelPase(paseId))) {
    const objeto = await objetoEnAlmacen(url)
    const archivo = objeto ? TIPOS_DE_ARCHIVO[objeto.tipo.split(';')[0]!.trim().toLowerCase()] : undefined
    if (!objeto || !archivo) return { error: ARCHIVO_NO_LLEGO }
    return { url, tipo: archivo.tipo }
  }
  if (!/^https:\/\//i.test(url)) return { error: ARCHIVO_NO_LLEGO }
  const copia = await copiarMedia(url, null)
  if (!copia.ok) return { error: copia.motivo === 'muy grande' ? MUY_GRANDE : ARCHIVO_NO_LLEGO }
  return { url: copia.url, tipo: copia.mediaType === 'video' ? 'video' : 'imagen' }
}

/**
 * Una pieza nueva, o la versión siguiente de una (`responde_a`): comparte su grupo, lleva el número
 * siguiente y, con `variante`, se suma a las alternativas de esa versión para compararlas. `resuelve`
 * marca hechas las críticas que arregla, de cualquier versión anterior del mismo creativo.
 */
export async function nuevaPieza(pase: Pase, cuerpo: unknown): Promise<{ pieza: Pieza; resueltas: number } | { error: string }> {
  if (!cuerpo || typeof cuerpo !== 'object') return { error: 'El cuerpo no se entendió: tiene que ser JSON.' }
  const c = cuerpo as Record<string, unknown>
  const db = getDb()

  const [{ n } = { n: 0 }] = await db.select({ n: count() }).from(pasePiezas).where(eq(pasePiezas.paseId, pase.id))
  if (n >= MAX_PIEZAS) return { error: DEMASIADAS_PIEZAS }

  let base: Pieza | null = null
  if (c.responde_a !== undefined && c.responde_a !== null) {
    base = typeof c.responde_a === 'string' ? await piezaDelPase(pase.id, c.responde_a) : null
    if (!base) return { error: PIEZA_NO_EXISTE }
  }
  const variante = c.variante === undefined || c.variante === null || c.variante === '' ? null : c.variante
  if (variante !== null && (typeof variante !== 'string' || !/^[A-Z]$/.test(variante))) return { error: VARIANTE_INVALIDA }
  const titulo = c.titulo === undefined && base ? base.titulo : tituloLimpio(c.titulo)
  if (!titulo) return { error: FALTA_TITULO }
  const notas = typeof c.notas === 'string' ? c.notas.trim().slice(0, MAX_NOTAS) : ''
  const grupo = base?.grupo ?? randomUUID()
  const version = base ? base.version + 1 : 1

  if (base) {
    const hermanas = await db
      .select({ variante: pasePiezas.variante })
      .from(pasePiezas)
      .where(and(eq(pasePiezas.paseId, pase.id), eq(pasePiezas.grupo, grupo), eq(pasePiezas.version, version)))
    if (hermanas.some((h) => h.variante === variante)) {
      return { error: variante === null ? 'Esa versión ya existe: ponle una variante (A, B…) para compararlas.' : VARIANTE_REPETIDA }
    }
  }

  const resuelve = Array.isArray(c.resuelve) ? c.resuelve.filter((id): id is string => typeof id === 'string' && esUuid(id)) : []
  if (typeof c.url !== 'string' || !c.url.trim()) return { error: ARCHIVO_NO_LLEGO }
  const archivo = await traerArchivo(pase.id, c.url.trim())
  if ('error' in archivo) return archivo

  const [pieza] = await db
    .insert(pasePiezas)
    .values({ paseId: pase.id, grupo, version, variante, titulo, tipo: archivo.tipo, url: archivo.url, notas, respondeA: base?.id ?? null })
    .returning()

  let resueltas = 0
  if (resuelve.length > 0 && base) {
    const delGrupo = db.select({ id: pasePiezas.id }).from(pasePiezas).where(and(eq(pasePiezas.paseId, pase.id), eq(pasePiezas.grupo, grupo)))
    const filas = await db
      .update(paseComentarios)
      .set({ estado: 'resuelto', resueltoEn: pieza!.id, resueltoAt: new Date() })
      .where(and(eq(paseComentarios.paseId, pase.id), inArray(paseComentarios.id, resuelve), inArray(paseComentarios.piezaId, delGrupo)))
      .returning({ id: paseComentarios.id })
    resueltas = filas.length
  }
  await tocarPase(pase.id)
  return { pieza: pieza!, resueltas }
}
