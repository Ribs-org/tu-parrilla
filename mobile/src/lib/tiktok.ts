import type { Medidas } from './historias'
import type { CuentaApp } from './tipos'

// El bloque de TikTok de Publicar, sin pantalla. Es el del compositor del panel
// (`src/app/admin/(dash)/schedule/tiktok-opciones.tsx`), que copia la guía de TikTok para
// publicar directo: los datos de la cuenta (`creator_info`) a la vista, la privacidad sin elegir,
// las interacciones apagadas, la marca declarada y el consentimiento antes de publicar. Los
// textos son los del panel letra por letra: los compara `src/lib/telefono-copias.test.ts`.

export type PrivacidadTikTok = 'PUBLIC_TO_EVERYONE' | 'MUTUAL_FOLLOW_FRIENDS' | 'FOLLOWER_OF_CREATOR' | 'SELF_ONLY'

export const PRIVACIDADES_TIKTOK: readonly PrivacidadTikTok[] = [
  'PUBLIC_TO_EVERYONE',
  'MUTUAL_FOLLOW_FRIENDS',
  'FOLLOWER_OF_CREATOR',
  'SELF_ONLY',
]

export const ETIQUETA_PRIVACIDAD: Record<PrivacidadTikTok, string> = {
  PUBLIC_TO_EVERYONE: 'Todos',
  MUTUAL_FOLLOW_FRIENDS: 'Amigos mutuos',
  FOLLOWER_OF_CREATOR: 'Seguidores',
  SELF_ONLY: 'Solo yo',
}

/** Lo que dice `creator_info` de una cuenta (`GET /api/mobile/schedule/accounts/{id}/tiktok`). */
export type CreadorTikTok = {
  nombre: string
  avatarUrl: string | null
  privacidades: PrivacidadTikTok[]
  comentariosDeshabilitados: boolean
  duoDeshabilitado: boolean
  pegarDeshabilitado: boolean
  maxDuracionSeg: number | null
}

/**
 * Lo que el bloque de una cuenta tiene elegido, con los nombres que lee el compositor del panel
 * (`TikTokInicial`, en `src/lib/borrador.ts`). `privacidad` vacía es sin elegir. `musica` falta
 * mientras «Música de TikTok» no se ha visto (un video, o sin archivos todavía).
 */
export type TikTokElegido = {
  borrador: boolean
  privacidad: string
  comentarios: boolean
  duo: boolean
  pegar: boolean
  comercial: 'no' | 'marca_propia' | 'patrocinado'
  ia: boolean
  musica?: boolean
}

export const TIKTOK_CREADOR_ILEGIBLE = 'No pude leer tu cuenta de TikTok.'
export const LEYENDO_LA_CUENTA = 'Leyendo tu cuenta…'

export const MUSIC_USAGE = 'https://www.tiktok.com/legal/page/global/music-usage-confirmation/en'
export const BRANDED_CONTENT = 'https://www.tiktok.com/legal/page/global/bc-policy/en'

/** Los textos del bloque, los del panel. */
export const TEXTOS_TIKTOK = {
  bandeja: 'Enviar como borrador a mi bandeja de TikTok',
  bandejaPista: 'Te llegará una notificación en TikTok para terminar la publicación desde el teléfono.',
  quienPuedeVerlo: 'Quién puede verlo',
  eligeQuien: 'Elige quién puede verlo',
  permitir: 'Permitir',
  comentarios: 'Comentarios',
  duos: 'Dúos',
  pegar: 'Pegar (Stitch)',
  marca: 'Este contenido promociona una marca',
  miMarca: 'Mi marca',
  miMarcaPista: 'Se etiquetará como Contenido promocional',
  patrocinado: 'Contenido patrocinado',
  patrocinadoPista: 'Se etiquetará como Colaboración pagada',
  patrocinadoPrivado: 'Un contenido patrocinado no puede ser privado. Vuelve a elegir quién puede verlo.',
  ia: 'Hecho con IA',
  iaEncendida: 'TikTok lo etiquetará como contenido generado con IA.',
  iaApagada: 'Enciéndelo si la imagen o la voz se hicieron o se cambiaron con IA de forma realista.',
  musica: 'Música de TikTok',
  musicaPista:
    'TikTok le pone a las fotos una canción recomendada; la puedes cambiar después en la app de TikTok. Esta cuenta lo recuerda para la próxima vez.',
  despues: 'Después de publicar, TikTok puede tardar unos minutos en mostrarlo en tu perfil.',
} as const

/** «Se publicará en la cuenta …», o lo que pasó al leerla, o que se está leyendo. */
export function lineaDeLaCuenta(creador: CreadorTikTok | null, aviso: string | null): string {
  return creador ? `Se publicará en la cuenta ${creador.nombre}` : (aviso ?? LEYENDO_LA_CUENTA)
}

/**
 * Cómo nace el bloque: lo que traía el borrador, o como la guía de TikTok exige —privacidad sin
 * elegir, interacciones y marca apagadas—. La música es lo único que nace de lo que la cuenta
 * recuerda (`tiktokMusica`, lo que se eligió al programar fotos ahí la última vez), como en el
 * panel: la guía prohíbe dejar puestas la privacidad y las casillas, no esto.
 */
export function tiktokInicial(guardado: TikTokElegido | undefined, cuenta: Pick<CuentaApp, 'tiktokMusica'>): TikTokElegido {
  return {
    borrador: guardado?.borrador ?? false,
    privacidad: (PRIVACIDADES_TIKTOK as readonly string[]).includes(guardado?.privacidad ?? '') ? guardado!.privacidad : '',
    comentarios: guardado?.comentarios ?? false,
    duo: guardado?.duo ?? false,
    pegar: guardado?.pegar ?? false,
    comercial: guardado?.comercial ?? 'no',
    ia: guardado?.ia ?? false,
    musica: guardado?.musica ?? Boolean(cuenta.tiktokMusica),
  }
}

/** Las cuentas de TikTok marcadas: un bloque por cada una, como en el panel. */
export function cuentasDeTikTok(disponibles: CuentaApp[], marcadas: string[]): CuentaApp[] {
  return disponibles.filter((c) => c.red === 'tiktok' && c.conectada && marcadas.includes(c.id))
}

/**
 * Todo fotos: TikTok no ofrece dúo ni pegar en un carrusel, y solo les pone música a las fotos
 * publicadas directo. Sin archivos todavía no es «todo fotos», como en el panel.
 */
export function soloFotos(archivos: { mediaType: 'image' | 'video' }[]): boolean {
  return archivos.length > 0 && archivos.every((a) => a.mediaType === 'image')
}

/**
 * Las privacidades que se ofrecen: las que `creator_info` permite. Sin él se ofrecen las cuatro:
 * el publicador vuelve a consultar antes de subir y falla con frase propia si la elegida ya no
 * está permitida.
 */
export function privacidadesDe(creador: CreadorTikTok | null): readonly PrivacidadTikTok[] {
  return creador?.privacidades ?? PRIVACIDADES_TIKTOK
}

/** «Solo yo» y patrocinado no coexisten: elegir patrocinado vacía «Solo yo». */
export function elegirComercial(e: TikTokElegido, comercial: TikTokElegido['comercial']): TikTokElegido {
  return { ...e, comercial, privacidad: comercial === 'patrocinado' && e.privacidad === 'SELF_ONLY' ? '' : e.privacidad }
}

/** Si va el aviso de que un patrocinado no puede ser privado: patrocinado con «Solo yo» o sin elegir. */
export function avisoPatrocinado(e: TikTokElegido): boolean {
  return e.comercial === 'patrocinado' && (e.privacidad === 'SELF_ONLY' || e.privacidad === '')
}

/**
 * Lo que viaja en `opciones` al programar, como lo arma el formulario del panel
 * (`opcionesDesdeFormularioPorCuenta`): a la bandeja, solo el modo; directo, todo, con lo que el
 * bloque no muestra apagado —dúo y pegar con fotos, lo que `creator_info` bloquea— y la música
 * solo con fotos. Una privacidad que la cuenta ya no permite viaja vacía, para que el servidor
 * responda «TikTok necesita que elijas la privacidad.» en vez de aceptar algo que TikTok rechaza.
 */
export function opcionesTikTok(
  e: TikTokElegido,
  fotos: boolean,
  creador: CreadorTikTok | null,
): Record<string, unknown> {
  if (e.borrador) return { modo: 'borrador' }
  return {
    modo: 'directo',
    privacidad: (privacidadesDe(creador) as readonly string[]).includes(e.privacidad) ? e.privacidad : '',
    comentarios: e.comentarios && !creador?.comentariosDeshabilitados,
    duo: !fotos && e.duo && !creador?.duoDeshabilitado,
    pegar: !fotos && e.pegar && !creador?.pegarDeshabilitado,
    comercial: e.comercial,
    ia: e.ia,
    musica: fotos && e.musica === true,
  }
}

/**
 * Lo que el borrador guarda del bloque: todo lo elegido, aunque esté escondido —pasar a la
 * bandeja y volver no pierde la privacidad—, y la música solo si estaba a la vista (fotos).
 * El servidor lo lee sin validar (`tiktokDelTelefono`): un borrador puede estar a medias.
 */
export function tiktokParaGuardar(e: TikTokElegido, fotos: boolean): Record<string, unknown> {
  return {
    modo: e.borrador ? 'borrador' : 'directo',
    privacidad: e.privacidad,
    comentarios: e.comentarios,
    duo: e.duo,
    pegar: e.pegar,
    comercial: e.comercial,
    ia: e.ia,
    ...(fotos ? { musica: e.musica === true } : {}),
  }
}

/** «10 min», «3 min 30 s», «45 s». */
export function segundosLegibles(segundos: number): string {
  const s = Math.round(segundos)
  const min = Math.floor(s / 60)
  const resto = s % 60
  if (min === 0) return `${resto} s`
  return resto === 0 ? `${min} min` : `${min} min ${resto} s`
}

/** Lo que dice el bloque del largo máximo de un video en esa cuenta, o null sin dato. */
export function duracionMaxima(creador: CreadorTikTok | null): string | null {
  if (!creador?.maxDuracionSeg) return null
  return `En esta cuenta, TikTok publica videos de hasta ${segundosLegibles(creador.maxDuracionSeg)}.`
}

/**
 * Si el video elegido dura más de lo que `creator_info` deja publicar en esa cuenta: la guía de
 * TikTok pide no dejar mandarlo, porque TikTok lo rechaza después de subirlo. Null si cabe, si no
 * hay video o si no se sabe la duración (un archivo que vuelve de un borrador no la trae).
 */
export function videoMuyLargo(
  archivos: { mediaType: 'image' | 'video'; medidas?: Medidas | null }[],
  creador: CreadorTikTok | null,
): string | null {
  const max = creador?.maxDuracionSeg
  if (!max) return null
  const video = archivos.find((a) => a.mediaType === 'video' && a.medidas?.duracionMs)
  if (!video) return null
  const segundos = video.medidas!.duracionMs! / 1000
  if (segundos <= max) return null
  return `Este video dura ${segundosLegibles(segundos)} y TikTok publica en esta cuenta videos de hasta ${segundosLegibles(max)}.`
}
