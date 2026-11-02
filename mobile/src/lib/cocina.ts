/**
 * La Cocina en el teléfono, sin pantalla: lo que responde `/api/mobile/cocina`, cómo se nombra y se
 * describe lo que se graba o se elige, la cuota de la cámara de frío en palabras y qué falta para
 * mandarle la comanda al chef. Lo que copia del panel —la instrucción y sus ejemplos, los ganchos
 * de la cuota— lo compara `src/lib/vocabulario.test.ts` en la raíz. Lo dibuja `app/(tabs)/cocina.tsx`.
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
}

export type UsoDeLaCamara = { cuantos: number; guardados: number; subiendo: number; cuota: number }

/** `GET /api/mobile/cocina`. */
export type Cocina = {
  encendida: boolean
  abierta: boolean
  /** Con qué nombre firma el chef; null si la cuenta no tiene ni marca ni nombre. */
  marca: string | null
  camara: UsoDeLaCamara | null
  materiales: Material[]
  comandas: ComandaDelTelefono[]
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
  /** El uso que se propone, como el panel: un video es material crudo; lo demás, sin uso. */
  uso: 'crudo' | null
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

/* ---- la comanda ---- */

/** El plato principal: el primer video elegido, como en el panel. */
export function principalDe(elegidos: readonly string[], materiales: readonly Material[]): string | null {
  return elegidos.find((id) => materiales.find((m) => m.id === id)?.clase === 'video') ?? null
}

/** Lo elegido que sigue en la cámara, en el orden en que se eligió. */
export function elegidosQueSiguen(elegidos: readonly string[], materiales: readonly Material[]): string[] {
  return elegidos.filter((id) => materiales.some((m) => m.id === id))
}

export const FALTA_SUBIR = 'Espera a que termine de guardarse lo que sube.'
export const FALTA_VIDEO = 'Graba un video o elige uno guardado: es el plato principal.'
export const FALTA_ACORTAR = 'Acorta tu instrucción al chef.'
export const FALTA_MARCA = 'Escribe tu nombre en Tu Cuenta, en el panel web: es con el que el chef firma los videos.'

/** Lo que falta para «Mandar al chef», en una frase, o null si ya se puede. */
export function faltaParaMandar(c: {
  elegidos: readonly string[]
  materiales: readonly Material[]
  subiendo: number
  instruccion: string
  marca: string | null
}): string | null {
  if (c.subiendo > 0) return FALTA_SUBIR
  if (!principalDe(c.elegidos, c.materiales)) return FALTA_VIDEO
  if (c.instruccion.trim().length > MAX_INSTRUCCION) return FALTA_ACORTAR
  if (!c.marca) return FALTA_MARCA
  return null
}

/** El cuerpo de `POST /api/mobile/cocina/comandas`. */
export function cuerpoDeLaComanda(ref: string, elegidos: readonly string[], materiales: readonly Material[], instruccion: string) {
  const principal = principalDe(elegidos, materiales)
  return {
    ref,
    principal,
    acompanamientos: elegidosQueSiguen(elegidos, materiales).filter((id) => id !== principal),
    instruccion: instruccion.trim(),
  }
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
