import type { Formato, Sello } from './parrilla'

export type PostProgramado = {
  id: string
  texto: string
  cuando: string
  // `id` es el del destino (`scheduled_post_targets.id`), no el de la cuenta: es la
  // clave de React en La Parrilla. Con dos cuentas de una red, `red` ya
  // no es única dentro de un post — solo el destino lo es. `sello` es la marca de ese
  // destino en el corte; un servidor de antes no lo manda.
  redes: { id: string; red: string; handle: string | null; estado: string; error?: string | null; sello?: Sello }[]
  portada?: string | null
  miniatura?: string | null
  /** Qué corte se dibuja; un servidor de antes no lo manda y queda el bife. */
  formato?: Formato
  huesos?: number
}

/**
 * Lo que trae `GET /api/mobile/fierros`: todas tus cuentas con la temperatura de su fierro,
 * y el aviso del botón de Ajustes con su frase ya armada («1 se enfría»).
 */
export type Fierros = {
  cuentas: { id: string; red: string; handle: string | null; conectada: boolean; fierro: 'al-rojo' | 'enfriandose' | 'frio' }[]
  aviso: { nivel: 'apagado' | 'enfriandose'; cuantos: number; frase: string } | null
}

/** Una cuenta del dueño, para elegir destino por cuenta y no por red (Tarea 7). */
export type CuentaApp = { id: string; red: string; handle: string | null; conectada: boolean }

export type Overview = {
  desde: string
  hasta: string
  truncado: boolean
  kpis: {
    viewsGanadas: number | null
    visitasAlSitio: number | null
    arrastre: number | null
    seguidores: number | null
  }
  hoy: PostProgramado[]
  proximos: PostProgramado[]
}

export type PostMetrica = {
  red: string
  externalId: string
  permalink: string | null
  texto: string | null
  publicadoEl: string
  etiqueta: string
  atributos: Record<string, string | number | boolean> | null
  archivado: boolean
  miniatura: string | null
  metricas: {
    views: number | null
    viewsGanadas: number | null
    likes: number | null
    comentarios: number | null
    compartidos: number | null
    alcance: number | null
    visitasAlSitio: number | null
    clicks: number | null
    ctr: number | null
    arrastre: number | null
  }
}

export type Posts = { desde: string; hasta: string; truncado: boolean; posts: PostMetrica[] }

export type Cuentas = {
  desde: string
  hasta: string
  cuentas: {
    red: string
    seguidores: number | null
    seguidoresGanados: number | null
    visitasAlPerfil: number | null
    alcance: number | null
    dia: string | null
  }[]
  serie: { fecha: string; visitasAlPerfil: number | null; alcance: number | null }[]
}

/**
 * Un borrador en La Parrilla, el mismo que lista el panel. `cuando` es el instante con la
 * zona del dueño, como el de un post, o null sin fecha; `guardado`, igual.
 */
export type BorradorResumido = { id: string; texto: string; cuando: string | null; guardado: string; archivos: number }

/** Un borrador abierto en Publicar (`GET /api/mobile/borradores/:id`). */
export type BorradorAbierto = {
  id: string
  texto: string
  /** Sin las cuentas de redes que el teléfono no publica: esas las conserva el servidor. */
  cuentas: string[]
  cuando: string | null
  trial: string[]
  media: { url: string; mediaType: 'image' | 'video'; nombre: string }[]
  /** Por qué este borrador se programa solo en el panel web, o null si se puede desde acá. */
  soloEnElPanel: string | null
}

/**
 * `hoy` es el día en la zona del dueño; falta en lo guardado antes del 2026-10-16.
 * `borradores` falta en lo guardado antes de que la app los mostrara.
 */
export type Calendario = { hoy?: string; posts: PostProgramado[]; borradores?: BorradorResumido[] }

/** Una cuenta como la nombra la API: su id, su red y su nombre en la red. */
export type CuentaNombrada = { id: string; red: string; nombre: string | null }

/** Los Números: las dos mitades del tablero del panel (`/api/mobile/numeros`). */
export type Numeros = {
  rango: Rango
  cuenta: string | null
  cuentas: CuentaNombrada[]
  redes: {
    viewsGanadas: number | null
    seguidoresGanados: number | null
    loQueMasCrecio: (PostMetrica & { cuenta: CuentaNombrada | null })[]
  }
  pagina: {
    visitas: number
    cambioVisitas: number | null
    clicks: number
    cambioClicks: number | null
    queTeTrajoGente: {
      etiqueta: string
      visitas: number
      texto: string | null
      red: string | null
      cuenta: CuentaNombrada | null
    }[]
  }
}

export const RANGOS = ['hoy', '7d', '30d', '90d', 'todo'] as const

export type Rango = (typeof RANGOS)[number]

/** Los cinco períodos del panel, con sus mismos nombres. */
export const ETIQUETA_RANGO: Record<Rango, string> = {
  hoy: 'Hoy',
  '7d': '7 días',
  '30d': '30 días',
  '90d': '90 días',
  todo: 'Todo',
}

export const NOMBRE_RED: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  youtube: 'YouTube',
  threads: 'Threads',
  x: 'X',
  tiktok: 'TikTok',
}
