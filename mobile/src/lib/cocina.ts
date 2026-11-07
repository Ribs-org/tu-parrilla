/**
 * La Cocina en el teléfono, sin pantalla: lo que responde `/api/mobile/cocina`, cómo atiende la
 * cocina, lo que falta para contestarle al chef, cómo se nombra y se describe lo que se graba o se
 * elige, la cuota de la cámara de frío en palabras, lo que va en el riel de la comanda —qué es el
 * plato principal y qué es cada cosa que lo acompaña— y qué falta para mandarle la comanda al chef.
 * Lo que copia del panel —la instrucción y sus ejemplos, los ganchos de la cuota, los nombres de
 * cada clase— lo compara `src/lib/vocabulario.test.ts` en la raíz; las opciones del pedido con sus
 * nombres no se copian: las manda el servidor (`opciones`). Lo dibuja `app/(tabs)/cocina.tsx`.
 */

export type ClaseMaterial = 'video' | 'audio' | 'imagen' | 'otro'

/** Un material de la cámara, como lo manda el servidor. `enMarcha`: cuántas comandas en marcha lo usan. */
export type Material = {
  id: string
  nombre: string
  uso: string | null
  bytes: number
  duracionS: number | null
  tipoArchivo: string
  clase: ClaseMaterial
  creadoEn: string
  enMarcha: number
  /** Cómo se llama por lo que pesa, de noche y de día («un lomo», «un filete»). Lo recién subido no lo trae. */
  pieza?: { noche: string; dia: string }
}

export type EstadoComanda =
  | 'recibida'
  | 'revisando'
  | 'en_preparacion'
  | 'probando'
  | 'pregunta'
  | 'en_el_horno'
  | 'sirviendo'
  | 'lista'
  | 'servida'
  | 'rechazada'
  | 'cancelada'
  | 'fallida'

export type ComandaDelTelefono = {
  id: string
  estado: EstadoComanda
  palabras: { noche: string; dia: string }
  enMarcha: boolean
  /** De 0 (colgada) a 5 (toda en el mesón); null si terminó sin cocinarse. */
  tramo: number | null
  creadaEn: string
  eta: string | null
  principal: string | null
  instruccion: string | null
  fila: string | null
  mensaje: string | null
  /** Lo que el chef pregunta mientras espera respuesta. Un servidor de antes del 2026-11-06 no lo manda. */
  pregunta?: PreguntaDelChef | null
  /** Desde el 2026-11-06 (un servidor de antes no los manda): si todavía se puede cancelar, */
  cancelable?: boolean
  /** cuántos creativos esperan en el mesón, */
  enElMeson?: number
  /** y «Lo que pasó», paso por paso. */
  pasos?: PasoDeLaComanda[]
}

export type PasoDeLaComanda = { estado: EstadoComanda; palabras: { noche: string; dia: string }; mensaje: string | null; creadoEn: string }

/** Una opción del pedido como la manda el servidor, con el nombre (y la ayuda) del panel. */
export type Opcion<V extends string = string> = { valor: V; nombre: string; ayuda?: string }

export type RolDeVideo = 'imagen' | 'camara' | 'pantalla'

/** Lo que ofrece el formulario, con los nombres del panel (`OPCIONES_DEL_PEDIDO` en `src/lib/cocina/telefono.ts`). */
export type OpcionesDelPedido = {
  subtipos: Opcion[]
  roles: Opcion<RolDeVideo>[]
  formatos: Opcion[]
  cantidades: Opcion[]
  usos: Opcion[]
  maxAcompanamientos: number
}

export type MarcaBasica = { nombre: string; handle: string | null; acento: string | null; ctaTexto: string | null }

/** Una pregunta del chef, como la manda el servidor: `siNoContestas` ya viene en palabras. */
export type PreguntaDelChef = {
  id: string
  texto: string
  /** Null: la respuesta es libre. */
  opciones: string[] | null
  porDefecto: string
  plazo: string
  siNoContestas: string
}

export type UsoDeLaCamara = { cuantos: number; guardados: number; subiendo: number; cuota: number }

/** `GET /api/mobile/cocina`. */
export type Cocina = {
  encendida: boolean
  abierta: boolean
  /** Cómo atiende: sola, a mano o nadie. Un servidor de antes del 2026-11-06 no lo manda. */
  atiende?: AtiendeLaCocina
  /** La línea que lo dice, la misma del panel (`src/lib/cocina/latido.ts`); null con la cocina apagada. */
  cocina?: string | null
  /** Con qué nombre firma el chef; null si la cuenta no tiene ni marca ni nombre. */
  marca: string | null
  camara: UsoDeLaCamara | null
  materiales: Material[]
  comandas: ComandaDelTelefono[]
  /**
   * Desde el 2026-11-06: las opciones del formulario, la marca entera y el lugar que tendría en la
   * fila una comanda nueva. Un servidor de antes no los manda, y entonces la app pide con el camino
   * corto y no ofrece cambiar, sacar ni cancelar: ese servidor no sabe hacerlo.
   */
  opciones?: OpcionesDelPedido
  tuMarca?: MarcaBasica | null
  nueva?: { antes: number; eta: string | null }
}

export type AtiendeLaCocina = 'sola' | 'a-mano' | 'cerrada'

/* ---- cómo atiende la cocina ---- */

const COCINA_CERRADA = 'La cocina está cerrada por ahora: lo que pidas espera su turno.'

/**
 * La línea de arriba de La Cocina y cómo se pinta su punto: en verde si atiende sola, en ámbar a
 * mano o cerrada. La frase la manda el servidor; uno de antes solo decía si latía.
 */
export function lineaDeLaCocina(c: Pick<Cocina, 'abierta' | 'atiende' | 'cocina'>): { texto: string; tono: 'verde' | 'ambar' } {
  const atiende: AtiendeLaCocina = c.atiende ?? (c.abierta ? 'sola' : 'cerrada')
  const texto = c.cocina ?? (c.abierta ? 'La cocina está abierta.' : COCINA_CERRADA)
  return { texto, tono: atiende === 'sola' ? 'verde' : 'ambar' }
}

/* ---- las preguntas del chef, como en el panel (`src/lib/cocina/pregunta.ts`) ---- */

export const MAX_RESPUESTA = 500

/** Lo que falta para «Responder» una pregunta libre, o null si ya se puede. */
export function faltaParaResponder(texto: string): string | null {
  const largo = texto.trim().length
  if (largo === 0) return 'Escribe tu respuesta al chef.'
  return largo > MAX_RESPUESTA ? `Tu respuesta llega hasta ${MAX_RESPUESTA} caracteres.` : null
}

/* ---- la instrucción, como en el panel (`src/lib/cocina/pedido.ts`) ---- */

export const MAX_INSTRUCCION = 1000

/** Ejemplos, no opciones: un toque los suma al texto, y el chef lee lo que quede escrito. */
export const EJEMPLOS_DE_INSTRUCCION: readonly string[] = [
  'Clips de menos de 30 segundos.',
  'Destaca la parte de ventas.',
  'No uses la anécdota del final.',
  'Empieza cada clip con la pregunta, no con la respuesta.',
  'Tono cercano, como una conversación.',
]

/** Suma un ejemplo a lo escrito, en un renglón propio; si ya está, no lo repite. */
export function sumarEjemplo(texto: string, ejemplo: string): string {
  if (texto.includes(ejemplo)) return texto
  const limpio = texto.trimEnd()
  return limpio ? `${limpio}\n${ejemplo}` : ejemplo
}

/* ---- la cuota, como en el panel (`src/lib/cocina/bodega.ts`) ---- */

/** Los ganchos del riel de la cámara (de día, los lugares sobre el hielo): cada uno, un décimo de la cuota. */
export const GANCHOS = 10
/** Desde cuánto se avisa que se está llenando. */
export const UMBRAL_LLENANDOSE = 0.85

export type EstadoDeLaCuota = 'holgada' | 'llenandose' | 'llena'

export function estadoDeLaCuota(ocupados: number, cuota: number): EstadoDeLaCuota {
  if (ocupados >= cuota) return 'llena'
  if (ocupados >= cuota * UMBRAL_LLENANDOSE) return 'llenandose'
  return 'holgada'
}

/** Cuántos ganchos van ocupados: con algo adentro, al menos uno; llena, todos. */
export function ganchosOcupados(ocupados: number, cuota: number): number {
  if (ocupados <= 0 || cuota <= 0) return ocupados > 0 ? GANCHOS : 0
  return Math.min(GANCHOS, Math.ceil((ocupados / cuota) * GANCHOS))
}

const NUMERO = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 })

/** El peso en palabras, como el panel: «4,2 GB», «350,2 MB». Bajo un mega, «0,1 MB». */
export function pesoEnPalabras(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${NUMERO.format(bytes / 1024 ** 3)} GB`
  const megas = bytes / 1024 ** 2
  return `${megas > 0 && megas < 0.1 ? '0,1' : NUMERO.format(megas)} MB`
}

/** «1:35» o «1:02:10»: lo que dura un video, para reconocerlo en la lista. */
export function duracionEnPalabras(segundos: number | null): string | null {
  if (segundos === null || !Number.isFinite(segundos) || segundos <= 0) return null
  const s = Math.round(segundos)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const resto = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${resto}` : `${m}:${resto}`
}

/* ---- lo que se graba o se elige ---- */

/** Lo que el teléfono sabe de un archivo antes de subirlo a la cámara. */
export type ParaLaCamara = {
  nombre: string
  tipo: string
  clase: ClaseMaterial
  /** El uso que se propone al grabar para la comanda: un video es material crudo; lo demás, sin uso. */
  uso: string | null
  duracionS: number | null
}

const POR_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
}

const EXTENSION: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/**
 * El nombre de lo recién grabado, para reconocerlo en la cámara y que el chef sepa qué es: la
 * cámara del teléfono le pone un nombre de números, o ninguno. «Video del 2 de nov, 14.05.mp4».
 */
export function nombreDeLoGrabado(clase: 'video' | 'imagen', tipo: string, fecha: Date): string {
  const hora = `${String(fecha.getHours()).padStart(2, '0')}.${String(fecha.getMinutes()).padStart(2, '0')}`
  const cuando = `${fecha.getDate()} de ${MESES[fecha.getMonth()]}, ${hora}`
  return `${clase === 'video' ? 'Video' : 'Foto'} del ${cuando}.${EXTENSION[tipo] ?? (clase === 'video' ? 'mp4' : 'jpg')}`
}

/**
 * Lo que dice el selector de un archivo (la cámara o la galería), listo para abrir la subida. El
 * tipo es el que dice el selector, o el de la extensión si no dijo nada; el servidor decide si se
 * guarda, con su frase. `duration` llega en milisegundos.
 */
export function paraLaCamara(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null; type?: string | null; duration?: number | null },
  grabado: boolean,
  ahora: Date,
): ParaLaCamara {
  const delSelector = asset.fileName?.trim() || asset.uri.split(/[\\/]/).pop()?.split('?')[0] || ''
  const extension = delSelector.includes('.') ? (delSelector.split('.').pop()?.toLowerCase() ?? '') : ''
  const declarado = asset.mimeType?.split(';')[0]?.trim().toLowerCase() ?? ''
  const tipo = declarado.startsWith('video/') || declarado.startsWith('image/') ? declarado.replace('image/jpg', 'image/jpeg') : (POR_EXTENSION[extension] ?? declarado)
  const clase: ClaseMaterial = tipo.startsWith('video/') || asset.type === 'video' ? 'video' : tipo.startsWith('image/') ? 'imagen' : 'otro'
  const nombre =
    grabado || !delSelector
      ? nombreDeLoGrabado(clase === 'video' ? 'video' : 'imagen', tipo, ahora)
      : delSelector.slice(-200)
  const duracionS = clase === 'video' && typeof asset.duration === 'number' && asset.duration > 0 ? asset.duration / 1000 : null
  return { nombre, tipo, clase, uso: clase === 'video' ? 'crudo' : null, duracionS }
}

/* ---- lo que quedó subiendo ---- */

/**
 * Lo que se estaba subiendo, guardado en el teléfono (AsyncStorage) para retomarlo si la app se
 * cierra a medias: con el archivo donde está y el id de su subida, el servidor dice qué partes
 * llegaron. Se borra al cerrar sesión (`session.ts`).
 */
export const CLAVE_PENDIENTES = 'cocina-pendientes'

export type Pendiente = {
  clave: string
  nombre: string
  clase: ClaseMaterial
  uri: string
  tipo: string
  bytes: number
  uso: string | null
  duracionS: number | null
  subidaId: string | null
  /** Si el archivo es una copia de la app (lo grabado), que hay que borrar al terminar. */
  propio: boolean
  /**
   * Si al terminar entra a la comanda (lo que se graba o se elige en «Tu comanda») o solo queda
   * guardado (lo de «Guardar en la cámara»). Lo guardado antes del 2026-11-06 no lo trae: entraba.
   */
  aLaComanda?: boolean
}

/** Lo guardado, leído con cuidado: lo que no tiene forma de pendiente se descarta. */
export function leerPendientes(crudo: string | null): Pendiente[] {
  if (!crudo) return []
  try {
    const lista: unknown = JSON.parse(crudo)
    if (!Array.isArray(lista)) return []
    return lista.filter(
      (p): p is Pendiente =>
        typeof p === 'object' &&
        p !== null &&
        typeof p.clave === 'string' &&
        typeof p.uri === 'string' &&
        typeof p.nombre === 'string' &&
        typeof p.tipo === 'string' &&
        typeof p.bytes === 'number' &&
        p.bytes > 0,
    )
  } catch {
    return []
  }
}

/* ---- la cámara por dentro, como en el panel (`src/app/admin/(dash)/ia/bodega/camara.tsx`) ---- */

/** Cada clase en palabras, para los filtros y la etiqueta de lo que no tiene uso. */
export const CLASE_EN_PALABRAS: Record<ClaseMaterial, { uno: string; varios: string }> = {
  video: { uno: 'Video', varios: 'Videos' },
  audio: { uno: 'Audio', varios: 'Audios' },
  imagen: { uno: 'Imagen', varios: 'Imágenes' },
  otro: { uno: 'Otro archivo', varios: 'Otros' },
}

const ORDEN_DE_CLASES: ClaseMaterial[] = ['video', 'audio', 'imagen', 'otro']

/** Los filtros de arriba —«Todo», «Videos»…—, cada uno con cuántos hay; solo si hay de más de una clase. */
export function filtrosDeClase(materiales: readonly Pick<Material, 'clase'>[]): { clase: ClaseMaterial | null; texto: string }[] {
  const presentes = ORDEN_DE_CLASES.filter((c) => materiales.some((m) => m.clase === c))
  if (presentes.length < 2) return []
  return [
    { clase: null, texto: `Todo (${materiales.length})` },
    ...presentes.map((c) => ({ clase: c, texto: `${CLASE_EN_PALABRAS[c].varios} (${materiales.filter((m) => m.clase === c).length})` })),
  ]
}

/** La etiqueta de un material: su uso, con el nombre del panel, o sin uso, lo que es. */
export function etiquetaDe(m: Pick<Material, 'uso' | 'clase'>, usos: readonly Opcion[] | undefined): string {
  const uso = m.uso ? usos?.find((u) => u.valor === m.uso)?.nombre : null
  return uso ?? CLASE_EN_PALABRAS[m.clase].uno
}

/** «En una comanda en marcha», «En 2 comandas en marcha»: lo que no deja sacarlo. */
export function enMarchaEnPalabras(n: number): string {
  return n === 1 ? 'En una comanda en marcha' : `En ${n} comandas en marcha`
}

/* ---- la comanda ---- */

/** Cuántos materiales acompañan al principal, como en el panel; el servidor manda el suyo en `opciones`. */
export const MAX_ACOMPANAMIENTOS = 20

/** Una cosa colgada en el riel, con lo que es en la comanda si es un video. */
export type Elegido = { id: string; rol: RolDeVideo }

/** Lo que va en la comanda: lo elegido, en el orden en que se eligió, y cuál es el plato principal. */
export type Riel = { elegidos: Elegido[]; principal: string | null }

export const RIEL_VACIO: Riel = { elegidos: [], principal: null }

function esVideo(id: string, materiales: readonly Pick<Material, 'id' | 'clase'>[]): boolean {
  return materiales.find((m) => m.id === id)?.clase === 'video'
}

/** El primer video del riel que no es `salvo`: el que pasa a ser el principal cuando el de antes se va. */
function otroVideo(elegidos: readonly Elegido[], materiales: readonly Pick<Material, 'id' | 'clase'>[], salvo?: string): string | null {
  return elegidos.find((e) => e.id !== salvo && esVideo(e.id, materiales))?.id ?? null
}

/**
 * Cuelga algo en el riel, para intercalar: el primer video que se elige es el plato principal,
 * como en el panel. Caben el principal y `max` más.
 */
export function colgar(riel: Riel, id: string, materiales: readonly Pick<Material, 'id' | 'clase'>[], max: number = MAX_ACOMPANAMIENTOS): Riel {
  if (riel.elegidos.some((e) => e.id === id) || riel.elegidos.length >= max + 1) return riel
  return {
    elegidos: [...riel.elegidos, { id, rol: 'imagen' }],
    principal: riel.principal ?? (esVideo(id, materiales) ? id : null),
  }
}

/** Lo saca del riel; si era el plato principal, lo es el siguiente video. */
export function soltar(riel: Riel, id: string, materiales: readonly Pick<Material, 'id' | 'clase'>[]): Riel {
  const elegidos = riel.elegidos.filter((e) => e.id !== id)
  return { elegidos, principal: riel.principal === id ? otroVideo(elegidos, materiales) : riel.principal }
}

/**
 * Qué es un video en la comanda: el plato principal, o uno que lo acompaña. Si el principal pasa a
 * acompañar, el principal es otro video del riel, si hay.
 */
export function cambiarRol(riel: Riel, id: string, rol: RolDeVideo | 'principal', materiales: readonly Pick<Material, 'id' | 'clase'>[]): Riel {
  if (rol === 'principal') return esVideo(id, materiales) ? { ...riel, principal: id } : riel
  const elegidos = riel.elegidos.map((e) => (e.id === id ? { ...e, rol } : e))
  return { elegidos, principal: riel.principal === id ? otroVideo(elegidos, materiales, id) : riel.principal }
}

/** El riel sin lo que ya no está en la cámara (se sacó desde el panel, o acá): el principal, otro si se fue. */
export function rielQueSigue(riel: Riel, materiales: readonly Pick<Material, 'id' | 'clase'>[]): Riel {
  const elegidos = riel.elegidos.filter((e) => materiales.some((m) => m.id === e.id))
  const principal = riel.principal && elegidos.some((e) => e.id === riel.principal) ? riel.principal : otroVideo(elegidos, materiales)
  return { elegidos, principal }
}

/** Lo que el formulario completo deja elegir además del riel y la instrucción. */
export type OpcionesElegidas = {
  subtipo: string
  formatos: string[]
  cantidad: string
  /** `AAAA-MM-DD`, o null: informativo, la hora real la estima el chef. */
  paraCuando: string | null
  marca: MarcaBasica
}

/** Lo que el panel trae marcado: un video largo, clips verticales y lo que dé el material. */
export const COMO_VIENE: Omit<OpcionesElegidas, 'marca'> = { subtipo: 'largo', formatos: ['clips'], cantidad: 'lo-que-de', paraCuando: null }

/** Marca o desmarca un formato, en el orden en que el servidor los ofrece. */
export function alternarFormato(formatos: readonly string[], formato: string, orden: readonly Opcion[]): string[] {
  const marcados = formatos.includes(formato) ? formatos.filter((f) => f !== formato) : [...formatos, formato]
  return orden.map((o) => o.valor).filter((v) => marcados.includes(v))
}

export const FALTA_SUBIR = 'Espera a que termine de guardarse lo que sube.'
export const FALTA_VIDEO = 'Graba un video o elige uno guardado: es el plato principal.'
export const FALTA_FORMATO = 'Elige qué quieres que salga.'
export const FALTA_ACORTAR = 'Acorta tu instrucción al chef.'
export const FALTA_MARCA = 'Escribe tu nombre en Tu Cuenta, en el panel web: es con el que el chef firma los videos.'
/** La del panel (`MARCA_SIN_NOMBRE`): con el formulario completo, el nombre se escribe ahí mismo. */
export const FALTA_NOMBRE_DE_MARCA = 'Ponle nombre a tu marca: es el que el chef usa en los videos.'

/**
 * Lo que falta para «Mandar al chef», en una frase, o null si ya se puede. Con `opciones` es el
 * formulario completo: mira los formatos y el nombre de la marca que se escribió; sin ellas, el
 * camino corto, con la marca que tiene la cuenta.
 */
export function faltaParaMandar(c: {
  riel: Riel
  materiales: readonly Material[]
  subiendo: number
  instruccion: string
  marca: string | null
  opciones?: OpcionesElegidas | null
}): string | null {
  if (c.subiendo > 0) return FALTA_SUBIR
  if (!rielQueSigue(c.riel, c.materiales).principal) return FALTA_VIDEO
  if (c.opciones && c.opciones.formatos.length === 0) return FALTA_FORMATO
  if (c.instruccion.trim().length > MAX_INSTRUCCION) return FALTA_ACORTAR
  if (c.opciones) return c.opciones.marca.nombre.trim() ? null : FALTA_NOMBRE_DE_MARCA
  if (!c.marca) return FALTA_MARCA
  return null
}

/**
 * El cuerpo de `POST /api/mobile/cocina/comandas`. Con `opciones`, el de hoy: cada cosa con su rol,
 * lo que se pide y la marca. Sin ellas —contra un servidor de antes—, el de la 1.2.0: los ids de lo
 * que acompaña y la instrucción, y el servidor completa lo demás como el panel lo trae marcado.
 */
export function cuerpoDeLaComanda(ref: string, riel: Riel, materiales: readonly Material[], instruccion: string, opciones?: OpcionesElegidas | null) {
  const vigente = rielQueSigue(riel, materiales)
  const acompanan = vigente.elegidos.filter((e) => e.id !== vigente.principal)
  const base = { ref, principal: vigente.principal, instruccion: instruccion.trim() }
  if (!opciones) return { ...base, acompanamientos: acompanan.map((e) => e.id) }
  return {
    ...base,
    subtipo: opciones.subtipo,
    acompanamientos: acompanan.map((e) => ({ id: e.id, rol: e.rol })),
    formatos: opciones.formatos,
    cantidad: opciones.cantidad,
    paraCuando: opciones.paraCuando,
    marca: {
      nombre: opciones.marca.nombre.trim(),
      handle: opciones.marca.handle?.trim() || null,
      acento: opciones.marca.acento,
      ctaTexto: opciones.marca.ctaTexto?.trim() || null,
    },
  }
}

/** Cuántas comandas van antes, en palabras, como en el panel. */
export function antesEnLaFila(antes: number): string {
  if (antes === 0) return 'Es la próxima en la fila.'
  return antes === 1 ? 'Hay 1 comanda antes que la tuya.' : `Hay ${antes} comandas antes que la tuya.`
}

const nombreDe = (lista: readonly Opcion[], valor: string) => lista.find((o) => o.valor === valor)?.nombre ?? valor

/**
 * Lo que dice «Confirmar» antes de mandarla, un renglón por cosa, como el bloque del panel: el plato
 * principal y qué es, lo que lo acompaña, qué sale, para cuándo y la marca.
 */
export function resumenDeLaComanda(
  riel: Riel,
  materiales: readonly Material[],
  elegidas: OpcionesElegidas,
  opciones: OpcionesDelPedido,
  paraCuandoEnPalabras: (dia: string) => string,
): string[] {
  const vigente = rielQueSigue(riel, materiales)
  const nombre = (id: string) => materiales.find((m) => m.id === id)?.nombre ?? ''
  const lineas = [
    vigente.principal ? `Plato principal: ${nombre(vigente.principal)} (${nombreDe(opciones.subtipos, elegidas.subtipo)})` : 'Plato principal: todavía no',
  ]
  const acompanan = vigente.elegidos.filter((e) => e.id !== vigente.principal)
  if (acompanan.length > 0) {
    const que = (e: Elegido) => {
      const m = materiales.find((x) => x.id === e.id)
      if (m?.clase === 'video') return nombreDe(opciones.roles, e.rol).toLowerCase()
      if (m?.clase === 'imagen') return nombreDe(opciones.roles, 'imagen').toLowerCase()
      return m?.uso ? nombreDe(opciones.usos, m.uso).toLowerCase() : 'aparte'
    }
    lineas.push(`Lo acompañan: ${acompanan.map((e) => `${nombre(e.id)} (${que(e)})`).join(', ')}`)
  }
  const formatos = elegidas.formatos.map((f) => nombreDe(opciones.formatos, f)).join(' y ') || 'nada todavía'
  lineas.push(`Qué sale: ${formatos} · ${nombreDe(opciones.cantidades, elegidas.cantidad)}`)
  lineas.push('Los estilos: los elige el chef')
  if (elegidas.paraCuando) lineas.push(`Para cuándo: ${paraCuandoEnPalabras(elegidas.paraCuando)}`)
  const m = elegidas.marca
  lineas.push(`Tu marca: ${m.nombre.trim() || 'sin nombre'}${m.handle?.trim() ? ` · ${m.handle.trim()}` : ''}${m.ctaTexto?.trim() ? ` · «${m.ctaTexto.trim()}»` : ''}`)
  return lineas
}

/** Un id para la `ref` de la comanda: mandarla dos veces con la misma no la duplica. */
export function nuevaRef(azar: () => number = Math.random): string {
  const hex = Array.from({ length: 32 }, () => Math.floor(azar() * 16).toString(16))
  hex[12] = '4'
  hex[16] = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16)
  const s = hex.join('')
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
}

/** Si conviene volver a preguntar solo: mientras alguna comanda está en marcha. */
export function hayEnMarcha(cocina: Pick<Cocina, 'comandas'> | null): boolean {
  return Boolean(cocina?.comandas.some((c) => c.enMarcha))
}
