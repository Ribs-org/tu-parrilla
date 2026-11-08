
// La cámara de frío de La Cocina (de día, la nevera), sin base y sin almacén: qué se puede guardar,
// cuánto pesa cada cosa en palabras, cómo se llama según lo que pesa, y la cuenta de la cuota. Lo
// leen el servidor al abrir una subida y el navegador al elegir el archivo, para decir al tiro lo
// que no va a entrar. El diseño, con el porqué de los nombres, está en
// `docs/superpowers/specs/2026-11-02-la-bodega-design.md`.

/** Para qué es un material, si el dueño lo dice. Lo recibe el chef como `uso`. */
export const USOS_MATERIAL = ['crudo', 'intro', 'outro', 'broll', 'musica', 'logo', 'letras', 'otro'] as const
export type UsoMaterial = (typeof USOS_MATERIAL)[number]

/** Lo que distingue a un material para dibujarlo y para sus topes. */
export const CLASES = ['video', 'audio', 'imagen', 'otro'] as const
export type ClaseMaterial = (typeof CLASES)[number]

/**
 * El tipo de archivo de cada cosa que se guarda, con la extensión de su clave. El chef corta con
 * ffmpeg, así que entra también lo que no se publica tal cual, como el MKV que graba OBS. Lo otro
 * es lo que una marca le lleva al chef: sus letras, un PDF con la guía, unos subtítulos.
 */
const TIPOS: Record<string, { clase: ClaseMaterial; extension: string }> = {
  'video/mp4': { clase: 'video', extension: 'mp4' },
  'video/quicktime': { clase: 'video', extension: 'mov' },
  'video/webm': { clase: 'video', extension: 'webm' },
  'video/x-matroska': { clase: 'video', extension: 'mkv' },
  'audio/mpeg': { clase: 'audio', extension: 'mp3' },
  'audio/mp4': { clase: 'audio', extension: 'm4a' },
  'audio/aac': { clase: 'audio', extension: 'aac' },
  'audio/wav': { clase: 'audio', extension: 'wav' },
  'audio/ogg': { clase: 'audio', extension: 'ogg' },
  'audio/flac': { clase: 'audio', extension: 'flac' },
  'image/jpeg': { clase: 'imagen', extension: 'jpg' },
  'image/png': { clase: 'imagen', extension: 'png' },
  'image/webp': { clase: 'imagen', extension: 'webp' },
  'image/heic': { clase: 'imagen', extension: 'heic' },
  'image/gif': { clase: 'imagen', extension: 'gif' },
  'font/ttf': { clase: 'otro', extension: 'ttf' },
  'font/otf': { clase: 'otro', extension: 'otf' },
  'font/woff': { clase: 'otro', extension: 'woff' },
  'font/woff2': { clase: 'otro', extension: 'woff2' },
  'application/pdf': { clase: 'otro', extension: 'pdf' },
  'application/x-subrip': { clase: 'otro', extension: 'srt' },
  'text/vtt': { clase: 'otro', extension: 'vtt' },
  'text/plain': { clase: 'otro', extension: 'txt' },
  'application/zip': { clase: 'otro', extension: 'zip' },
}

/** Lo que cada navegador dice de un mismo archivo: Windows llama `x-zip-compressed` a un ZIP, Safari `x-m4a` a un M4A. */
const ALIAS: Record<string, string> = {
  'image/jpg': 'image/jpeg',
  'audio/mp3': 'audio/mpeg',
  'audio/x-m4a': 'audio/mp4',
  'audio/x-wav': 'audio/wav',
  'audio/wave': 'audio/wav',
  'audio/vnd.wave': 'audio/wav',
  'audio/x-flac': 'audio/flac',
  'audio/x-aac': 'audio/aac',
  'font/sfnt': 'font/ttf',
  'application/x-font-ttf': 'font/ttf',
  'application/x-font-otf': 'font/otf',
  'application/font-woff': 'font/woff',
  'application/x-zip-compressed': 'application/zip',
  'text/srt': 'application/x-subrip',
}

const POR_EXTENSION: Record<string, string> = {
  mp4: 'video/mp4',
  m4v: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  flac: 'audio/flac',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  gif: 'image/gif',
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  pdf: 'application/pdf',
  srt: 'application/x-subrip',
  vtt: 'text/vtt',
  txt: 'text/plain',
  zip: 'application/zip',
}

/** Lo que ofrece el selector de archivos: los tipos y, para los que el navegador no nombra bien, las extensiones. */
export const ACEPTA = [...Object.keys(TIPOS), ...Object.keys(POR_EXTENSION).map((e) => `.${e}`)].join(',')

/** El tope de cada clase. Un video, el de un largo crudo; lo demás, lo que razonablemente pesa. */
export const MAX_BYTES: Record<ClaseMaterial, number> = {
  video: 20 * 1024 ** 3,
  audio: 2 * 1024 ** 3,
  imagen: 50 * 1024 ** 2,
  otro: 500 * 1024 ** 2,
}
const TOPE_EN_PALABRAS: Record<ClaseMaterial, string> = {
  video: '20 GB, el tope de un video',
  audio: '2 GB, el tope de un audio',
  imagen: '50 MB, el tope de una imagen',
  otro: '500 MB, el tope de un archivo así',
}

/**
 * El tipo de un archivo, ya normalizado: el que dice el navegador si lo conocemos, y si no (un .mov
 * o un .srt llegan vacíos, un .ttf con nombres distintos según el sistema), el de su extensión.
 * Vacío si no es nada que se guarde.
 */
export function tipoDeArchivo(nombre: string, tipo: string): string {
  const limpio = tipo.trim().toLowerCase()
  const normal = ALIAS[limpio] ?? limpio
  if (normal in TIPOS) return normal
  return POR_EXTENSION[nombre.split('.').pop()?.toLowerCase() ?? ''] ?? ''
}

/** La clase de un tipo de archivo ya normalizado. Lo que no conocemos es «otro». */
export function claseDe(tipoArchivo: string): ClaseMaterial {
  return TIPOS[tipoArchivo]?.clase ?? 'otro'
}

export function extensionDe(tipoArchivo: string): string {
  return TIPOS[tipoArchivo]?.extension ?? 'bin'
}

const NUMERO = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 })

/** El peso en palabras: «4,2 GB», «350,2 MB», «20 GB». Bajo un mega, «0,3 MB». */
export function pesoEnPalabras(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${NUMERO.format(bytes / 1024 ** 3)} GB`
  const megas = bytes / 1024 ** 2
  return `${megas > 0 && megas < 0.1 ? '0,1' : NUMERO.format(megas)} MB`
}

// --- Para qué es ----------------------------------------------------------------------------

export const NOMBRE_USO: Record<UsoMaterial, string> = {
  crudo: 'Material crudo',
  intro: 'Intro',
  outro: 'Outro',
  broll: 'B-roll',
  musica: 'Música',
  logo: 'Logo',
  letras: 'Tipografía',
  otro: 'Otro',
}

/** El uso que se propone al guardar, según lo que es: lo puede cambiar, o dejarlo sin uso. */
export function usoSugerido(clase: ClaseMaterial): UsoMaterial | null {
  if (clase === 'video') return 'crudo'
  if (clase === 'audio') return 'musica'
  return null
}

export function esUso(valor: unknown): valor is UsoMaterial {
  return typeof valor === 'string' && (USOS_MATERIAL as readonly string[]).includes(valor)
}

// --- Cómo se llama según lo que pesa ---------------------------------------------------------

/**
 * Los cortes de cada clase, del más chico al más grande: el peso desde el que empieza cada uno
 * después del primero. Un video va de un corte a la vaca entera; un audio, de una longaniza a la
 * ristra larga; una imagen, de un pimentón a un cajón; lo demás, de un paquete a un fardo.
 */
export const CORTES: Record<ClaseMaterial, readonly number[]> = {
  video: [100 * 1024 ** 2, 1024 ** 3, 5 * 1024 ** 3, 10 * 1024 ** 3],
  audio: [10 * 1024 ** 2, 100 * 1024 ** 2, 1024 ** 3],
  imagen: [2 * 1024 ** 2, 10 * 1024 ** 2],
  otro: [50 * 1024 ** 2],
}

/** Qué tan grande es, de 0 (el más chico) al último corte de su clase. */
export function nivelDePeso(clase: ClaseMaterial, bytes: number): number {
  return CORTES[clase].filter((desde) => bytes >= desde).length
}

/**
 * El nombre de cada nivel, de noche (la carnicería) y de día (la barra de sushi). Van todos a «El
 * modo día» de la wiki (`PALABRAS_DE_DIA`), y el dibujo de cada uno está en
 * `src/components/dibujos-material.tsx`.
 */
export const NOMBRES_DE_PESO: Record<ClaseMaterial, ReadonlyArray<{ noche: string; dia: string }>> = {
  video: [
    { noche: 'un corte', dia: 'un trozo' },
    { noche: 'un lomo', dia: 'un filete' },
    { noche: 'un cuarto', dia: 'un salmón entero' },
    { noche: 'media res', dia: 'un atún' },
    { noche: 'la vaca entera', dia: 'un atún gigante' },
  ],
  audio: [
    { noche: 'una longaniza', dia: 'un tentáculo' },
    { noche: 'un par de longanizas', dia: 'medio pulpo' },
    { noche: 'una ristra', dia: 'un pulpo' },
    { noche: 'la ristra larga', dia: 'un pulpo gigante' },
  ],
  imagen: [
    { noche: 'un pimentón', dia: 'un onigiri' },
    { noche: 'el choclo y el pimentón', dia: 'un bol de arroz' },
    { noche: 'un cajón de verduras', dia: 'una tina de arroz' },
  ],
  otro: [
    { noche: 'un paquete', dia: 'un furoshiki' },
    { noche: 'un fardo', dia: 'un furoshiki grande' },
  ],
}

export function nombreDePeso(clase: ClaseMaterial, bytes: number): { noche: string; dia: string } {
  return NOMBRES_DE_PESO[clase][nivelDePeso(clase, bytes)]!
}

// --- La cuota -------------------------------------------------------------------------------

// Lo que le cabe a cada uno en la cámara lo dice su plan (`planes.bodega_bytes`: 20 GB el gratis,
// lo que pidió el dueño el 2026-11-02 «para jugar»), salvo que el admin le haya puesto otra a mano
// en Los Maestros (`users.bodega_bytes`). Ver `cuotaDeLaCamara`, en `src/lib/planes/plan.ts`.

/** Desde cuánto se avisa que se está llenando. */
export const UMBRAL_LLENANDOSE = 0.85

/** Los ganchos del riel de la cámara (de día, los lugares sobre el hielo): cada uno, un décimo de la cuota. */
export const GANCHOS = 10

/** El tope de la cuota que el admin puede escribir: 10 TB, para que un cero de más no pase. */
export const MAX_CUOTA_GB = 10_000

export const CUOTA_ILEGIBLE = `La cuota es un número de GB, de 1 a ${MAX_CUOTA_GB.toLocaleString('es-CL')}, como 20 o 50. Vacía, vuelve a la de su plan.`

/**
 * La cuota que escribe el admin en Los Maestros, en GB («20», «7,5»), pasada a bytes; vacía es la
 * de su plan (null), y lo que no es un número razonable, la frase de por qué.
 */
export function leerCuotaEnGb(texto: unknown): number | null | { error: string } {
  const limpio = typeof texto === 'string' ? texto.trim().replace(',', '.') : ''
  if (limpio === '') return null
  if (!/^\d+(\.\d+)?$/.test(limpio)) return { error: CUOTA_ILEGIBLE }
  const gigas = Number(limpio)
  if (gigas < 1 || gigas > MAX_CUOTA_GB) return { error: CUOTA_ILEGIBLE }
  return Math.round(gigas * 1024 ** 3)
}

export type EstadoDeLaCuota = 'holgada' | 'llenandose' | 'llena'

export function estadoDeLaCuota(ocupados: number, cuota: number): EstadoDeLaCuota {
  if (ocupados >= cuota) return 'llena'
  if (ocupados >= cuota * UMBRAL_LLENANDOSE) return 'llenandose'
  return 'holgada'
}

/** Cuántos ganchos van ocupados: con algo adentro, al menos uno; llena, todos. */
export function ganchosOcupados(ocupados: number, cuota: number): number {
  if (ocupados <= 0) return 0
  return Math.min(GANCHOS, Math.ceil((ocupados / cuota) * GANCHOS))
}

// --- La subida ------------------------------------------------------------------------------

const MAX_NOMBRE = 200

export const SUBIDA_ILEGIBLE = 'No entendimos el archivo: falta su nombre, su tipo o su tamaño.'
export const DERECHOS_FALTAN = 'Marca que tienes los derechos de este material y el permiso de quienes aparecen.'
export const USO_DESCONOCIDO = 'Ese uso no existe: elige uno de la lista, o ninguno.'
export const NOMBRE_VACIO = 'Ponle un nombre: es como lo vas a reconocer.'
export const NOMBRE_LARGO = `El nombre cabe en ${MAX_NOMBRE} caracteres.`
export const MATERIAL_NO_EXISTE = 'Ese material ya no está: recarga la página.'
export const MATERIAL_EN_USO = 'Ese material va en una comanda en marcha: lo puedes sacar cuando termine.'

export function tipoNoAceptado(nombre: string): string {
  return `«${nombre}»: ese tipo de archivo no se guarda. Van videos (MP4, MOV, WebM o MKV), audios (MP3, M4A, WAV, AAC, OGG o FLAC), imágenes (JPG, PNG, WebP, HEIC o GIF), tipografías, PDF, subtítulos, texto o ZIP.`
}

export function muyGrande(nombre: string, clase: ClaseMaterial): string {
  return `«${nombre}» pesa más de ${TOPE_EN_PALABRAS[clase]}.`
}

/** Lo que dice el servidor cuando no cabe: cuánto pesa, cuánto queda y qué hacer. Sin el nombre del lugar, que cambia de día. */
export function noCabe(nombre: string, bytes: number, libres: number, cuota: number): string {
  return `No hay espacio para «${nombre}»: pesa ${pesoEnPalabras(bytes)} y te quedan ${pesoEnPalabras(Math.max(0, libres))} libres de ${pesoEnPalabras(cuota)}. Saca algo que ya no uses, o pide más espacio.`
}

export type SubidaPedida = {
  nombre: string
  tipoArchivo: string
  bytes: number
  uso: UsoMaterial | null
  duracionS: number | null
}

/** Lo que el navegador puede decir de un archivo antes de subirlo: si se guarda, y si no, por qué. */
export function motivoParaNoSubir(nombre: string, tipoArchivo: string, bytes: number): string | null {
  if (!tipoArchivo) return tipoNoAceptado(nombre)
  const clase = claseDe(tipoArchivo)
  return bytes > MAX_BYTES[clase] ? muyGrande(nombre, clase) : null
}

/** El cuerpo con que se abre una subida a la cámara, validado, o la frase de por qué no. */
export function leerSubida(crudo: unknown): SubidaPedida | { error: string } {
  if (typeof crudo !== 'object' || crudo === null || Array.isArray(crudo)) return { error: SUBIDA_ILEGIBLE }
  const c = crudo as Record<string, unknown>
  const nombre = typeof c.nombre === 'string' ? c.nombre.trim() : ''
  const bytes = c.bytes
  if (!nombre || nombre.length > MAX_NOMBRE || typeof bytes !== 'number' || !Number.isInteger(bytes) || bytes <= 0) {
    return { error: SUBIDA_ILEGIBLE }
  }
  if (c.derechos !== true) return { error: DERECHOS_FALTAN }
  if (c.uso !== undefined && c.uso !== null && !esUso(c.uso)) return { error: USO_DESCONOCIDO }

  const tipoArchivo = tipoDeArchivo(nombre, typeof c.tipo === 'string' ? c.tipo : '')
  const motivo = motivoParaNoSubir(nombre, tipoArchivo, bytes)
  if (motivo) return { error: motivo }

  // La duración la lee el navegador de los metadatos, si puede (algunos HEVC no): es un dato, no
  // una condición, así que una que no se entiende se deja vacía en vez de rechazar el archivo.
  const duracionS = typeof c.duracionS === 'number' && Number.isFinite(c.duracionS) && c.duracionS >= 0 ? c.duracionS : null
  return { nombre, tipoArchivo, bytes, uso: esUso(c.uso) ? c.uso : null, duracionS }
}

/** Un nombre nuevo para un material, validado: sin espacios en las puntas y no vacío. */
export function leerNombre(crudo: unknown): string | { error: string } {
  const nombre = typeof crudo === 'string' ? crudo.trim() : ''
  if (!nombre) return { error: NOMBRE_VACIO }
  if (nombre.length > MAX_NOMBRE) return { error: NOMBRE_LARGO }
  return nombre
}
