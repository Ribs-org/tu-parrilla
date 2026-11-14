import type { EstadoPiezaDelPase, ZonaDelCuadro } from '@/db/schema'

// El Pase, sin base y sin nada de Node: lo usan el servidor y la pantalla. Los códigos, lo que vale
// una crítica, los tiempos en texto y la crítica para una IA. El diseño está en `docs/superpowers/specs/2026-11-13-el-pase-design.md`; lo que lee y
// escribe la base, en `pase.ts`, al lado.

export type RolDelPase = 'revisor' | 'editor'

/** Cada código dice de qué es en su prefijo, para que una persona (o una IA) sepa qué enlace tiene. */
export const PREFIJO_DEL_ROL: Record<RolDelPase, string> = { revisor: 'rev_', editor: 'edi_' }

/** Un código nuevo: el prefijo y 20 caracteres al azar (120 bits), aptos para una dirección. */
export function codigoNuevo(rol: RolDelPase): string {
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  const base64url = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_')
  return `${PREFIJO_DEL_ROL[rol]}${base64url}`
}

/** El rol que dice el prefijo, o null si el texto no tiene forma de código: ni se busca en la base. */
export function rolDelCodigo(codigo: string): RolDelPase | null {
  if (!/^(rev|edi)_[A-Za-z0-9_-]{20}$/.test(codigo)) return null
  return codigo.startsWith(PREFIJO_DEL_ROL.revisor) ? 'revisor' : 'editor'
}

/** Las etiquetas de una crítica: una lista corta, para que el editor las agrupe de un vistazo. */
export const ETIQUETAS = [
  { clave: 'ritmo', nombre: 'Ritmo y cortes' },
  { clave: 'transicion', nombre: 'Transición' },
  { clave: 'subtitulos', nombre: 'Subtítulos y texto' },
  { clave: 'audio', nombre: 'Audio y música' },
  { clave: 'encuadre', nombre: 'Encuadre' },
  { clave: 'color', nombre: 'Color y luz' },
  { clave: 'otro', nombre: 'Otro' },
] as const
export type Etiqueta = (typeof ETIQUETAS)[number]['clave']
export const CLAVES_DE_ETIQUETA = new Set<string>(ETIQUETAS.map((e) => e.clave))
export function nombreDeEtiqueta(clave: string): string {
  return ETIQUETAS.find((e) => e.clave === clave)?.nombre ?? 'Otro'
}

/** El veredicto de una pieza, en palabras. */
export const NOMBRE_DEL_ESTADO: Record<EstadoPiezaDelPase, string> = {
  en_revision: 'En revisión',
  aprobada: 'Aprobada',
  cambios: 'Pide cambios',
  descartada: 'Descartada',
}
export const ESTADOS_DE_PIEZA = Object.keys(NOMBRE_DEL_ESTADO) as EstadoPiezaDelPase[]

export const MAX_TITULO = 120
export const MAX_INSTRUCCIONES = 4000
export const MAX_AUTOR = 60
export const MAX_TEXTO = 2000
export const MAX_NOTAS = 2000
/** Cuántas piezas entran en un pase: las suficientes para una semana de shorts con sus versiones. */
export const MAX_PIEZAS = 300

/** Lo que se sube al pase: lo que un navegador reproduce o muestra sin plugins. */
export const TIPOS_DE_ARCHIVO: Record<string, { tipo: 'video' | 'imagen'; extension: string }> = {
  'video/mp4': { tipo: 'video', extension: 'mp4' },
  'video/quicktime': { tipo: 'video', extension: 'mov' },
  'video/webm': { tipo: 'video', extension: 'webm' },
  'image/jpeg': { tipo: 'imagen', extension: 'jpg' },
  'image/png': { tipo: 'imagen', extension: 'png' },
  'image/webp': { tipo: 'imagen', extension: 'webp' },
  'image/gif': { tipo: 'imagen', extension: 'gif' },
}

// --- Las frases ----------------------------------------------------------------------------------

export const PASE_NO_EXISTE = 'Este enlace ya no sirve: pídele uno nuevo a quien te lo mandó.'
export const SOLO_REVISOR = 'Esto lo hace quien revisa: tu enlace es para editar.'
export const SOLO_EDITOR = 'Esto lo hace quien edita: tu enlace es para revisar.'
export const PIEZA_NO_EXISTE = 'Esa pieza no está en este pase.'
export const COMENTARIO_NO_EXISTE = 'Ese comentario no está en este pase.'
export const CUERPO_ILEGIBLE = 'El cuerpo no se entendió: tiene que ser JSON.'
export const FALTA_AUTOR = `Escribe tu nombre (hasta ${MAX_AUTOR} letras): así el editor sabe quién lo dijo.`
export const FALTA_TEXTO = `Escribe el comentario (hasta ${MAX_TEXTO} letras).`
export const ETIQUETA_INVALIDA = `La etiqueta tiene que ser una de: ${ETIQUETAS.map((e) => e.clave).join(', ')}.`
export const TIEMPO_INVALIDO = '«desde» y «hasta» van en segundos, desde 0, y «hasta» después de «desde».'
export const ZONA_INVALIDA = 'La zona va con x, y, ancho y alto entre 0 y 1, dentro del cuadro.'
export const ESTADO_INVALIDO = `El estado de una pieza tiene que ser uno de: ${ESTADOS_DE_PIEZA.join(', ')}.`
export const FALTA_TITULO = `Ponle un título (hasta ${MAX_TITULO} letras).`
export const TIPO_NO_SIRVE = `Ese archivo no se puede revisar acá: sube MP4, MOV o WebM, o JPG, PNG, WebP o GIF.`
export const MUY_GRANDE = 'El archivo es muy grande: hasta 500 MB un video y 50 MB una imagen.'
export const VARIANTE_INVALIDA = 'La variante es una letra mayúscula: A, B, C…'
export const VARIANTE_REPETIDA = 'Esa versión ya tiene esa variante: usa otra letra.'
export const ARCHIVO_NO_LLEGO = 'El archivo no se pudo traer: revisa que la subida haya terminado o que la URL sea pública.'
export const DEMASIADAS_PIEZAS = `Un pase lleva hasta ${MAX_PIEZAS} piezas: abre otro.`

// --- Los tiempos ---------------------------------------------------------------------------------

/** «0:20.3»: minutos, segundos y décimas; con hora, «1:02:03.4». Lo que se lee en la pantalla y en la crítica. */
export function tiempoEnTexto(ms: number): string {
  const decimas = Math.floor(Math.max(0, ms) / 100)
  const d = decimas % 10
  const totalS = Math.floor(decimas / 10)
  const s = totalS % 60
  const m = Math.floor(totalS / 60) % 60
  const h = Math.floor(totalS / 3600)
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}.${d}` : `${m}:${ss}.${d}`
}

/** El momento o el tramo de una crítica en texto, o null si es general. */
export function cuandoEnTexto(desdeMs: number | null, hastaMs: number | null): string | null {
  if (desdeMs === null) return null
  return hastaMs === null ? tiempoEnTexto(desdeMs) : `${tiempoEnTexto(desdeMs)}–${tiempoEnTexto(hastaMs)}`
}

// --- Una crítica nueva ---------------------------------------------------------------------------

export type ComentarioNuevo = {
  piezaId: string
  autor: string
  texto: string
  etiqueta: Etiqueta
  desdeMs: number | null
  hastaMs: number | null
  zona: ZonaDelCuadro | null
}

const numero = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

/** La zona, si tiene forma: cuatro fracciones, dentro del cuadro y no un punto. */
export function zonaDe(cruda: unknown): ZonaDelCuadro | null | 'invalida' {
  if (cruda === undefined || cruda === null) return null
  if (typeof cruda !== 'object') return 'invalida'
  const z = cruda as Record<string, unknown>
  const { x, y, ancho, alto } = z
  if (![x, y, ancho, alto].every(numero)) return 'invalida'
  const [nx, ny, na, nl] = [x, y, ancho, alto] as number[]
  const dentro = nx >= 0 && ny >= 0 && na >= 0.005 && nl >= 0.005 && nx + na <= 1.0001 && ny + nl <= 1.0001
  if (!dentro) return 'invalida'
  const redondo = (n: number) => Math.round(n * 10_000) / 10_000
  return { x: redondo(nx), y: redondo(ny), ancho: redondo(Math.min(na, 1 - nx)), alto: redondo(Math.min(nl, 1 - ny)) }
}

/**
 * Lo que manda quien revisa, ya validado: los tiempos llegan en segundos (lo natural para una
 * persona y para una IA) y se guardan en milisegundos.
 */
export function comentarioNuevo(cuerpo: unknown): { comentario: ComentarioNuevo } | { error: string } {
  if (!cuerpo || typeof cuerpo !== 'object') return { error: CUERPO_ILEGIBLE }
  const c = cuerpo as Record<string, unknown>
  const piezaId = typeof c.pieza === 'string' ? c.pieza : ''
  if (!piezaId) return { error: PIEZA_NO_EXISTE }
  const autor = typeof c.autor === 'string' ? c.autor.trim() : ''
  if (!autor || autor.length > MAX_AUTOR) return { error: FALTA_AUTOR }
  const texto = typeof c.texto === 'string' ? c.texto.trim() : ''
  if (!texto || texto.length > MAX_TEXTO) return { error: FALTA_TEXTO }
  const etiqueta = c.etiqueta === undefined ? 'otro' : c.etiqueta
  if (typeof etiqueta !== 'string' || !CLAVES_DE_ETIQUETA.has(etiqueta)) return { error: ETIQUETA_INVALIDA }

  const desde = c.desde ?? null
  const hasta = c.hasta ?? null
  if (desde !== null && (!numero(desde) || desde < 0 || desde > 6 * 3600)) return { error: TIEMPO_INVALIDO }
  if (hasta !== null && (desde === null || !numero(hasta) || hasta <= (desde as number) || hasta > 6 * 3600)) {
    return { error: TIEMPO_INVALIDO }
  }
  const zona = zonaDe(c.zona)
  if (zona === 'invalida') return { error: ZONA_INVALIDA }

  return {
    comentario: {
      piezaId,
      autor,
      texto,
      etiqueta: etiqueta as Etiqueta,
      desdeMs: desde === null ? null : Math.round((desde as number) * 1000),
      hastaMs: hasta === null ? null : Math.round((hasta as number) * 1000),
      zona,
    },
  }
}

// --- La crítica para una IA ----------------------------------------------------------------------

/** Una pieza del pase como la entrega la API (`GET /api/pase/{código}`). */
export type PiezaParaLaApi = {
  id: string
  grupo: string
  version: number
  variante: string | null
  titulo: string
  tipo: 'video' | 'imagen'
  url: string
  notas: string
  respondeA: string | null
  estado: EstadoPiezaDelPase
  estadoPor: string | null
  creadaEn: string
  comentarios: ComentarioParaLaApi[]
}

export type ComentarioParaLaApi = {
  id: string
  autor: string
  etiqueta: string
  texto: string
  /** Segundos, o null si la crítica es de la pieza entera. */
  desde: number | null
  hasta: number | null
  /** «0:20.3» o «0:20.3–0:22.0», para leerlo; null si es general. */
  cuando: string | null
  zona: ZonaDelCuadro | null
  estado: 'abierto' | 'resuelto'
  respuesta: string | null
  /** La pieza (la versión) que lo resolvió, si el editor la nombró. */
  resueltoEn: string | null
  creadoEn: string
}

export type PaseParaLaApi = {
  rol: RolDelPase
  titulo: string
  instrucciones: string
  piezas: PiezaParaLaApi[]
}

/** El nombre corto de una versión: «v2», «v2 B». */
export function nombreDeVersion(p: { version: number; variante: string | null }): string {
  return p.variante ? `v${p.version} ${p.variante}` : `v${p.version}`
}

/** Dónde está una zona, en palabras, para quien no la ve dibujada. */
export function zonaEnTexto(z: ZonaDelCuadro): string {
  const pct = (n: number) => `${Math.round(n * 100)} %`
  const centroX = z.x + z.ancho / 2
  const centroY = z.y + z.alto / 2
  const horizontal = centroX < 1 / 3 ? 'izquierda' : centroX > 2 / 3 ? 'derecha' : 'centro'
  const vertical = centroY < 1 / 3 ? 'arriba' : centroY > 2 / 3 ? 'abajo' : 'al medio'
  return `zona ${vertical}, ${horizontal} (x ${pct(z.x)}, y ${pct(z.y)}, ${pct(z.ancho)} de ancho y ${pct(z.alto)} de alto)`
}

/**
 * La crítica del pase como una lista de tareas en Markdown, por pieza y en orden de tiempo: lo que
 * se pega en el prompt de una IA que edita, o lo que lee una persona sin abrir la pantalla. Primero
 * lo abierto; lo resuelto, al final de cada pieza y tachado.
 */
export function criticaEnTexto(pase: PaseParaLaApi, enlace: string | null = null): string {
  const lineas: string[] = [`# ${pase.titulo}`, '']
  if (pase.instrucciones.trim()) lineas.push(`Lo que pide quien revisa: ${pase.instrucciones.trim()}`, '')
  if (enlace) lineas.push(`Para subir versiones y marcar lo hecho: ${enlace}`, '')
  const abiertas = pase.piezas.reduce((n, p) => n + p.comentarios.filter((c) => c.estado === 'abierto').length, 0)
  lineas.push(`${pase.piezas.length} piezas, ${abiertas} críticas abiertas.`, '')

  for (const p of pase.piezas) {
    lineas.push(`## «${p.titulo}» ${nombreDeVersion(p)} — ${NOMBRE_DEL_ESTADO[p.estado]}`)
    lineas.push(`Pieza ${p.id} · ${p.tipo} · ${p.url}`)
    if (p.notas.trim()) lineas.push(`Notas del editor: ${p.notas.trim()}`)
    const orden = [...p.comentarios].sort(
      (a, b) =>
        (a.estado === b.estado ? 0 : a.estado === 'abierto' ? -1 : 1) || (a.desde ?? -1) - (b.desde ?? -1),
    )
    if (orden.length === 0) lineas.push('Sin críticas.')
    for (const c of orden) {
      const donde = [c.cuando ? `[${c.cuando}]` : '[general]', c.zona ? zonaEnTexto(c.zona) : null].filter(Boolean).join(' ')
      const marca = c.estado === 'abierto' ? '- [ ]' : '- [x]'
      const texto = c.estado === 'abierto' ? c.texto : `~~${c.texto}~~`
      lineas.push(`${marca} ${donde} (${nombreDeEtiqueta(c.etiqueta)}) ${texto} — ${c.autor} · id ${c.id}`)
      if (c.respuesta) lineas.push(`  - Respuesta del editor: ${c.respuesta}`)
    }
    lineas.push('')
  }
  return lineas.join('\n').trimEnd() + '\n'
}
