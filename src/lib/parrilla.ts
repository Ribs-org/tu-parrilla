/**
 * Las reglas de la parrilla: cuánto fuego tiene un día, qué tan cocido está un post, qué
 * corte es y cómo le fue en cada destino.
 *
 * Están acá y no dentro de `calendar.tsx` porque son reglas, no estilos: las miran el
 * calendario, la vista «Día», «Se quemó» y la API del teléfono, y un umbral mágico escrito
 * dentro de un `className` es exactamente el tipo de decisión que después nadie encuentra.
 *
 * Ver `docs/superpowers/specs/2026-09-18-parrilla-de-verdad-design.md` y
 * `docs/superpowers/specs/2026-10-16-el-corte-que-se-lee-design.md`.
 */

import type { TargetStatus } from '@/db/schema'

/**
 * La cocción de un corte. «parcial» es «se quemó en una red»: algo salió o sigue en la
 * parrilla y algo falló. Antes no existía, y un corte que salió en Instagram y falló en
 * TikTok se pintaba entero quemado, como si no hubiera salido en ninguna.
 */
export type Coccion = 'cruda' | 'sellada' | 'punto' | 'parcial' | 'quemada'
/** Las cuatro carnes que se pintan. Un corte «parcial» se pinta con la de lo que no se quemó. */
export type Carne = 'cruda' | 'sellada' | 'punto' | 'quemada'
export type Calor = 'apagada' | 'prendida' | 'llena'

/**
 * Los tres topes del degradado de cada carne, de la esquina clara a la honda.
 *
 * Ordenadas de clara a oscura, y ese orden es la información: contar la cocción por
 * luminosidad y no por tono es lo que hace que la escala sobreviva a un daltonismo, donde
 * los rojos se vuelven pardos pero siguen ordenados. La escala de antes iba de un café a
 * otro (1,32:1 entre vecinas); esta abre a 6,75:1 entre la cruda y la quemada, y puede
 * hacerlo porque ya ningún texto va encima de la carne: va debajo, en la chapa.
 *
 * El dibujo (`src/components/corte.tsx`) lee estos hexes directo; el teléfono los repite en
 * `mobile/src/lib/parrilla.ts` y el test de este módulo comprueba que no se separaron.
 */
export const CARNE: Record<Carne, { claro: string; medio: string; hondo: string }> = {
  cruda: { claro: '#f0a08f', medio: '#e8907f', hondo: '#c45a52' },
  sellada: { claro: '#d47d50', medio: '#c46a40', hondo: '#9a4a2e' },
  punto: { claro: '#b47640', medio: '#8f5326', hondo: '#6a3a1a' },
  quemada: { claro: '#3a2722', medio: '#2b1d1a', hondo: '#150e0c' },
}

/** El veteado de la grasa y los huesos de la tira. */
export const GRASA = '#e8d7b8'

/**
 * El rojo de «se quemó»: el halo y la banderita de un corte quemado. Tira a frambuesa a
 * propósito: el rojo de los mensajes (#f0614f) es casi el naranjo de la brasa, y con
 * deuteranopía «saliendo» y «se quemó» quedan como dos tonos del mismo color.
 */
export const QUEMO = '#f2557a'

/**
 * La cocción en palabras.
 *
 * El color es la primera señal y esto la segunda, que es la que no depende de ver. Vive acá
 * y no en `calendar.tsx` porque es una regla del producto, como los colores, y no un estilo.
 */
export const NOMBRE_COCCION: Record<Coccion, string> = {
  cruda: 'Programada',
  sellada: 'Saliendo ahora',
  punto: 'Publicada',
  parcial: 'Falló en parte',
  quemada: 'Falló',
}

/** De clara a oscura. El test de luminosidad recorre este orden. */
export const ORDEN_CARNE: readonly Carne[] = ['cruda', 'sellada', 'punto', 'quemada']

/**
 * Cuánto fuego tiene un día según cuántos cortes lleve.
 *
 * El tres de «llena» sale de la promesa del producto, que es publicar a volumen: tiene
 * que alcanzarse en un día de trabajo normal y no ser un trofeo inalcanzable.
 */
export function calorDelDia(cortes: number): Calor {
  if (cortes <= 0) return 'apagada'
  if (cortes < 3) return 'prendida'
  return 'llena'
}

/**
 * La cocción de un post según el estado de sus destinos.
 *
 * Un fallo gana sobre todo lo demás porque es lo que necesita el ojo: si fallaron todos es
 * «quemada», y si falló alguno, «parcial» —se quemó en una red—. Sin fallos: todos
 * publicados es «a punto»; algo en curso es «sellada»; el resto queda cruda.
 *
 * Un post sin destinos queda crudo y no «a punto»: `every` sobre una lista vacía devuelve
 * `true`, así que sin el largo explícito un post sin destinos se vería como publicado.
 *
 * Toma `TargetStatus` y no `string` a propósito: así, el día que alguien agregue un quinto
 * estado al enum, este archivo queda enlazado a ese cambio. Con `string` el estado nuevo
 * caería en `'cruda'` sin que nada se queje.
 */
export function coccionDe(estados: readonly TargetStatus[]): Coccion {
  const fallidos = estados.filter((estado) => estado === 'failed').length
  if (fallidos > 0) return fallidos === estados.length ? 'quemada' : 'parcial'
  if (estados.length > 0 && estados.every((estado) => estado === 'published')) return 'punto'
  if (estados.some((estado) => estado === 'publishing')) return 'sellada'
  return 'cruda'
}

/**
 * Con qué carne se pinta un post: la de su cocción y, si se quemó en una red, la de lo que
 * no se quemó. Un corte que salió en Instagram y falló en TikTok se ve a punto con el halo
 * rojo; uno que falló en TikTok y espera la hora de Instagram, crudo con el halo.
 */
export function carneDe(estados: readonly TargetStatus[]): Carne {
  const coccion = coccionDe(estados)
  if (coccion !== 'parcial') return coccion
  // Sin los fallidos no queda ninguno que falle, así que no vuelve «parcial» ni «quemada».
  return coccionDe(estados.filter((estado) => estado !== 'failed')) as Carne
}

/**
 * Qué corte es un post, por sus archivos: la silueta dice el formato antes de leer nada.
 * Un video es una entraña; dos archivos o más, una tira de asado con un hueso por archivo;
 * una foto, un bife; sin archivos —un tuit, un post de Threads—, un chori.
 */
export type Formato = 'entrana' | 'tira' | 'bife' | 'chori'

/** Los huesos que se dibujan, como mucho: a 120 de ancho, once ya no se cuentan. */
export const MAX_HUESOS = 10

/** El formato en palabras: lo que lee el lector de pantalla en vez de la silueta. */
export const NOMBRE_FORMATO: Record<Formato, string> = {
  entrana: 'Video',
  tira: 'Carrusel',
  bife: 'Foto',
  chori: 'Texto',
}

export function formatoDe(media: readonly { mediaType: string }[]): { formato: Formato; huesos: number } {
  if (media.length === 0) return { formato: 'chori', huesos: 0 }
  if (media.length > 1) return { formato: 'tira', huesos: Math.min(media.length, MAX_HUESOS) }
  return { formato: media[0]!.mediaType === 'video' ? 'entrana' : 'bife', huesos: 0 }
}

/**
 * Cómo le fue a un destino, para su marca en el corte y su chip debajo. Una marca por
 * destino, que se quema cuando ese destino confirma: es lo que deja leer «salió en dos de
 * tres» sin abrir nada.
 *
 * - `bandeja`: TikTok recibió el borrador y falta que el dueño lo termine en su app. Salió,
 *   pero falta su mano: queda a medio quemar y en ámbar, sin que nada haya fallado.
 * - `reintento`: falló y espera otro intento (vuelve a `scheduled` con su `lastError`; ver
 *   `etiquetaDestino` en `schedule/etiqueta.ts`).
 * - `frio`: programado en una cuenta con el fierro frío —desconectada, vencida o con la
 *   sincronización rota—: así como está, no va a salir.
 */
export type Sello = 'pendiente' | 'saliendo' | 'servido' | 'bandeja' | 'reintento' | 'quemado' | 'frio'

export function selloDe(
  destino: { network: string; status: string; lastError?: string | null; opciones: unknown; externalId?: string | null },
  fierro: Fierro = 'al-rojo',
): Sello {
  if (destino.status === 'failed') return 'quemado'
  if (destino.status === 'published') {
    const borrador =
      typeof destino.opciones === 'object' &&
      destino.opciones !== null &&
      (destino.opciones as { modo?: unknown }).modo === 'borrador'
    // Con su id, el borrador ya salió de la bandeja: el dueño lo publicó y la sincronización
    // encontró su video (`vincularVideosTikTok`).
    return destino.network === 'tiktok' && borrador && !destino.externalId ? 'bandeja' : 'servido'
  }
  if (destino.status === 'publishing') return 'saliendo'
  if (destino.lastError) return 'reintento'
  return fierro === 'frio' ? 'frio' : 'pendiente'
}

/** Cómo salió un corte comparado con los demás del período. */
export type Marca = 'se-paso' | 'salio-bien' | 'normal' | 'sin-datos'

/**
 * La mediana de un conjunto de números, o `null` si no hay ninguno.
 *
 * Mediana y no promedio, y esa elección es el corazón de la comparación: a un creador
 * con un post viral el promedio se le va arriba y entonces todo lo demás le aparece
 * frío, que es justo el mensaje contrario al que el producto quiere dar. La mediana
 * aguanta el outlier sin moverse.
 */
export function medianaDe(valores: readonly number[]): number | null {
  if (valores.length === 0) return null
  const orden = [...valores].sort((a, b) => a - b)
  const medio = Math.floor(orden.length / 2)
  return orden.length % 2 === 0 ? (orden[medio - 1]! + orden[medio]!) / 2 : orden[medio]!
}

/**
 * Cómo salió un corte, comparado con la mediana del período.
 *
 * La tabla de Contenido ya dice cuántas vistas tiene cada post, pero no dice lo único
 * que el dueño realmente pregunta: si eso es mucho **para él**. Un número grande puede
 * ser nada más un post viejo que lleva meses acumulando.
 *
 * Por eso se compara contra vistas **ganadas en el período** y no contra el acumulado:
 * el acumulado premia la antigüedad y haría que los posts nuevos, que son los que hay
 * que evaluar, salgan siempre fríos.
 *
 * Con la mediana en cero o negativa no se compara nada: en una semana sin movimiento,
 * cualquier post con una sola vista sería «se pasó», y eso es ruido, no información.
 */
export function comoSalio(ganadas: number | null, mediana: number | null): Marca {
  if (ganadas === null || mediana === null || mediana <= 0) return 'sin-datos'
  if (ganadas >= mediana * 2) return 'se-paso'
  if (ganadas >= mediana) return 'salio-bien'
  return 'normal'
}

/** Cómo está el fierro de una cuenta: al rojo, enfriándose o frío. */
export type Fierro = 'al-rojo' | 'enfriandose' | 'frio'

/**
 * Cuántos días antes de que el token muera empieza el aviso.
 *
 * Siete porque los tokens largos de Meta duran sesenta días y el de refresco de TikTok
 * un año: una semana alcanza de sobra para reconectar sin que el aviso viva encendido
 * la mitad del tiempo y se vuelva paisaje.
 */
export const DIAS_AVISO_FIERRO = 7

/**
 * El estado de una conexión, leído como temperatura.
 *
 * Existe porque `expires_at` está en la base desde siempre y **no se mostraba en ninguna
 * parte**: el dueño se enteraba de que un token había muerto cuando le fallaba una
 * publicación, o sea tarde. La temperatura convierte una fecha que hay que calcular en
 * algo que se ve.
 *
 * Un error de sincronización deja el fierro frío aunque el token siga vigente: la
 * credencial puede estar viva y la conexión rota igual —permisos revocados desde la red,
 * por ejemplo— y para el caso da lo mismo, hay que reconectar.
 */
export function estadoDelFierro(
  cuenta: { connected: boolean; expiraEn: string | null; ultimoError: string | null; red?: string },
  ahora: Date,
): Fierro {
  if (!cuenta.connected) return 'frio'
  if (cuenta.ultimoError) return 'frio'
  // TikTok entrega tokens de acceso de 24 horas y los renueva solo con uno de refresco
  // que dura un año (`ensureCredential`, `social/tiktok.ts`): `expiraEn` guarda el corto.
  // Medirlo por ahí hacía que toda cuenta de TikTok dijera «vence mañana» siempre, recién
  // conectada o no. Lo que de verdad dice si vive es que tenga credencial y que la última
  // sincronización no haya fallado — y eso ya se comprobó arriba.
  //
  // YouTube es el mismo caso con una hora en vez de un día (`social/publish/youtube.ts`
  // lo renueva antes de publicar). Google no dice cuándo muere el de refresco: con la app
  // en «Testing» son siete días, y en producción no vence mientras se use.
  //
  // Y X, con dos horas: `social/publish/x.ts` lo renueva al publicar con el de refresco, que
  // rota en cada uso. Medido por ahí, X decía «vence hoy» al conectarla y quedaba fría a las
  // dos horas; con el punto del engranaje, eso habría sido una alarma encendida para siempre.
  if (cuenta.red === 'tiktok' || cuenta.red === 'youtube' || cuenta.red === 'x') return 'al-rojo'
  if (!cuenta.expiraEn) return 'al-rojo'

  const faltan = new Date(cuenta.expiraEn).getTime() - ahora.getTime()
  if (faltan <= 0) return 'frio'
  if (faltan <= DIAS_AVISO_FIERRO * 86_400_000) return 'enfriandose'
  return 'al-rojo'
}

/**
 * Las cuentas con el fierro frío —desconectadas, vencidas o con la sincronización rota—: lo
 * que se programó ahí no va a salir así como está, y su marca lo dice antes de que falle.
 */
export function cuentasFrias(
  cuentas: ReadonlyArray<{ id: string; network: string; connected: boolean; expiresAt: string | null; lastSyncError: string | null }>,
  ahora: Date,
): Set<string> {
  return new Set(
    cuentas
      .filter(
        (c) =>
          estadoDelFierro({ connected: c.connected, expiraEn: c.expiresAt, ultimoError: c.lastSyncError, red: c.network }, ahora) ===
          'frio',
      )
      .map((c) => c.id),
  )
}

/**
 * Lo que dice el engranaje de Ajustes: si algún fierro se apagó o se está enfriando, y
 * cuántos. Solo las cuentas con credencial: una que el dueño desconectó a propósito guarda su
 * historia y no tiene por qué encender un aviso todos los días. «apagado» gana sobre
 * «enfriandose», porque es el que ya está dejando de publicar.
 */
export function avisoDeFierros(
  cuentas: ReadonlyArray<{ network: string; connected: boolean; expiresAt: string | null; lastSyncError: string | null }>,
  ahora: Date,
): { nivel: 'apagado' | 'enfriandose'; cuantos: number } | null {
  const fierros = cuentas
    .filter((c) => c.connected)
    .map((c) => estadoDelFierro({ connected: true, expiraEn: c.expiresAt, ultimoError: c.lastSyncError, red: c.network }, ahora))
  const apagados = fierros.filter((f) => f === 'frio').length
  if (apagados > 0) return { nivel: 'apagado', cuantos: apagados }
  const enfriandose = fierros.filter((f) => f === 'enfriandose').length
  return enfriandose > 0 ? { nivel: 'enfriandose', cuantos: enfriandose } : null
}

/** El aviso en palabras: «1 se enfría», «2 se apagaron». */
export function fraseDelAviso(aviso: { nivel: 'apagado' | 'enfriandose'; cuantos: number }): string {
  if (aviso.nivel === 'apagado') return aviso.cuantos === 1 ? '1 se apagó' : `${aviso.cuantos} se apagaron`
  return aviso.cuantos === 1 ? '1 se enfría' : `${aviso.cuantos} se enfrían`
}
