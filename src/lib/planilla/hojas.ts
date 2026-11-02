// Las hojas de «Llevar para la casa»: cuáles son, en qué orden, qué columnas llevan, qué dice de
// cada una la hoja «Léeme» y cómo se pasa cada fila de la base a una fila de Excel. Puro, para
// que lo prueben los tests; lo que lee la base está en `leer.ts` y lo que arma el archivo, en
// `armar.ts`.
//
// La descripción de cada columna vive al lado de la columna a propósito: «Léeme» se arma de acá,
// así que una columna nueva sin explicar no compila, y una explicación no puede hablar de una
// columna que ya no está.
//
// YouTube (`politica-youtube.ts`): sus filas llevan solo lo que entrega su API. Lo ganado, el
// arrastre, las views a los 7 días y «contra su cuenta» ya vienen nulos de `getPostRows`, y lo
// que esta planilla calcula por su cuenta —los seguidores ganados entre dos lecturas— se anula
// acá con `sinMetricasDerivadas`. Lo de más de 30 días lo deja fuera la consulta (`leer.ts`).

import type { AccountCard } from '../account-stats'
import { interaccionesDe } from '../mejores'
import { networkLabel } from '../networks'
import type { FilaComparada } from '../pieza'
import { textoDeAtributo } from '../pieza'
import type { CuentaRow, PostRow } from '../posts-kpis'
import { DIAS_RETENCION_YOUTUBE, sinMetricasDerivadas } from '../social/politica-youtube'
import type { Atributos } from '../social/publish/atributos'
import { countryName } from '../utils'
import { serialDeDia, serialEnZona, type Columna, type Fila, type Formato, type Valor } from './xlsx'

/** Las hojas, en el orden de sus pestañas. «Léeme» va primera. */
export const CLAVES_DE_HOJA = [
  'leeme',
  'resumen',
  'publicaciones',
  'porAtributo',
  'lecturas',
  'cuentas',
  'seguidores',
  'diaADia',
  'visitas',
  'clicks',
  'etiquetas',
  'links',
  'audiencia',
  'cuando',
  'programado',
  'comentarios',
] as const
export type ClaveDeHoja = (typeof CLAVES_DE_HOJA)[number]

export type DefinicionDeHoja = {
  nombre: string
  /** Lo que tiene, en una frase: la tabla de hojas de «Léeme». */
  queTiene: string
  columnas: readonly Columna[]
  /**
   * Cuántas filas lleva como mucho. Lo que pase el tope se queda fuera, y «Léeme» y la ventana
   * del panel lo dicen. Null: no tiene tope propio (cabe siempre).
   */
  tope: number | null
  /** Qué filas se quedan cuando hay más que el tope: «las más recientes». */
  cuales?: string
}

const SIN_YOUTUBE = 'Vacía en YouTube: sus reglas no dejan calcularla.'
const LO_MIDE_TU_PARRILLA = 'Lo mide Tu Parrilla, también en YouTube.'

/**
 * Los topes. Están pensados para que la peor planilla —todas las hojas llenas— se arme en menos
 * de un minuto y no pase de unos 30 MB, lejos de la memoria y del tiempo de la función.
 */
export const TOPES = {
  publicaciones: 10_000,
  lecturas: 100_000,
  seguidores: 50_000,
  visitas: 100_000,
  clicks: 100_000,
  etiquetas: 20_000,
  links: 1_000,
  audiencia: 200,
  programado: 20_000,
  comentarios: 50_000,
} as const

const DEFINICIONES: Record<Exclude<ClaveDeHoja, 'leeme'>, DefinicionDeHoja> = {
  resumen: {
    nombre: 'Resumen',
    queTiene: 'Las cifras grandes de Los Números para el período, con las del período anterior de igual largo.',
    tope: null,
    columnas: [
      { titulo: 'Mitad', formato: 'texto', ancho: 16, descripcion: '«En las redes» (lo cuentan las redes) o «En tu página» (lo cuenta Tu Parrilla).' },
      { titulo: 'Métrica', formato: 'texto', ancho: 30, descripcion: 'El nombre de la cifra, como en Los Números.' },
      { titulo: 'Valor', formato: 'decimal', ancho: 14, descripcion: 'La cifra del período. Vacía cuando no se sabe, que no es lo mismo que cero.' },
      { titulo: 'Período anterior', formato: 'decimal', ancho: 16, descripcion: 'La misma cifra en los días justo antes, del mismo largo. Solo en las de «En tu página».' },
      { titulo: 'Qué es', formato: 'texto', ancho: 80, descripcion: 'Cómo se calcula y qué deja fuera.' },
    ],
  },
  publicaciones: {
    nombre: 'Publicaciones',
    queTiene:
      'Cada publicación con actividad en el período (una lectura de la red o una visita por su link), de cualquier fecha, con sus números y sus atributos. Incluye las borradas en la red.',
    tope: TOPES.publicaciones,
    cuales: 'las publicadas más recientemente',
    columnas: [
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'Dónde se publicó.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'La cuenta conectada de la que salió: su nombre en la red, sin la @.' },
      { titulo: 'Publicada', formato: 'fechaHora', descripcion: 'Cuándo salió, en tu zona horaria.' },
      { titulo: 'Texto', formato: 'texto', ancho: 50, descripcion: 'El texto de la publicación (en YouTube, el título). En YouTube queda vacío si el video lleva 30 días sin llegar.' },
      { titulo: 'Tipo', formato: 'texto', ancho: 14, descripcion: 'El tipo que informa la red: video, reel, imagen, carrusel…' },
      { titulo: 'Enlace', formato: 'texto', ancho: 40, descripcion: 'La dirección de la publicación en la red.' },
      { titulo: 'Etiqueta ?s=', formato: 'texto', ancho: 16, descripcion: 'La etiqueta del link de la publicación: las visitas que llegan con ella se le cuentan. Es la que une esta hoja con «Visitas» y «Etiquetas y UTM».' },
      { titulo: 'Id en la red', formato: 'texto', ancho: 22, descripcion: 'El id que le da la red.' },
      { titulo: 'Borrada en la red', formato: 'texto', ancho: 10, descripcion: '«Sí» si ya no está en la red. Se guarda porque sus visitas pasaron de verdad.' },
      { titulo: 'Views', formato: 'entero', descripcion: 'Las views acumuladas en la última lectura del período, como las da la red.' },
      { titulo: 'Likes', formato: 'entero', descripcion: 'Acumulados, en la última lectura del período.' },
      { titulo: 'Comentarios', formato: 'entero', descripcion: 'Acumulados, en la última lectura del período.' },
      { titulo: 'Compartidos', formato: 'entero', descripcion: 'Acumulados. Vacío donde la red no los informa (YouTube).' },
      { titulo: 'Guardados', formato: 'entero', descripcion: 'Acumulados. Vacío donde la red no los informa (TikTok, YouTube).' },
      { titulo: 'Alcance', formato: 'entero', descripcion: 'Cuentas distintas que la vieron, según la red. Vacío donde no lo informa.' },
      { titulo: 'Views ganadas', formato: 'entero', descripcion: `Cuánto crecieron las views dentro del período: la última lectura menos la de antes del período. ${SIN_YOUTUBE}` },
      { titulo: 'Likes ganados', formato: 'entero', descripcion: `Lo mismo con los likes. ${SIN_YOUTUBE}` },
      { titulo: 'Comentarios ganados', formato: 'entero', descripcion: `Lo mismo con los comentarios. ${SIN_YOUTUBE}` },
      { titulo: 'Compartidos ganados', formato: 'entero', descripcion: `Lo mismo con los compartidos. ${SIN_YOUTUBE}` },
      { titulo: 'Interacciones ganadas', formato: 'entero', descripcion: `Likes, comentarios y compartidos ganados, sumados. ${SIN_YOUTUBE}` },
      { titulo: 'Views a los 7 días', formato: 'entero', descripcion: `Las views a la semana de publicada, para comparar a la misma edad. Vacía si no cumplió 7 días o no se leyó esos días. ${SIN_YOUTUBE}` },
      { titulo: 'Contra su cuenta', formato: 'veces', descripcion: `Sus views a los 7 días divididas por la mediana de su cuenta: ×2 es el doble de lo normal de esa cuenta. Solo para las publicadas en el período, como en «Comparar por atributo»; hacen falta 5 de la cuenta. ${SIN_YOUTUBE}` },
      { titulo: 'Visitas', formato: 'entero', descripcion: `Visitas a tus páginas que llegaron por su link en el período, sin bots. Vacía si su etiqueta nunca llegó a una visita (el link no se pegó). ${LO_MIDE_TU_PARRILLA}` },
      { titulo: 'Únicos', formato: 'entero', descripcion: `Visitantes distintos entre esas visitas (se cuentan por día, sin cookies). ${LO_MIDE_TU_PARRILLA}` },
      { titulo: 'Clicks', formato: 'entero', descripcion: `Clicks en los links de tu página de quienes llegaron por esta publicación. ${LO_MIDE_TU_PARRILLA}` },
      { titulo: 'CTR', formato: 'porcentaje', descripcion: `Clicks sobre visitas. ${LO_MIDE_TU_PARRILLA}` },
      { titulo: 'Arrastre', formato: 'porcentaje', descripcion: `Visitas sobre views ganadas: de quienes la vieron en el período, cuántos llegaron a tu página. ${SIN_YOUTUBE}` },
    ],
  },
  porAtributo: {
    nombre: 'Por atributo',
    queTiene:
      'Lo de «Comparar por atributo»: para cada atributo (hook, tema, serie…) y cada valor, cuántas publicaciones del período lo llevan y sus medianas.',
    tope: null,
    columnas: [
      { titulo: 'Atributo', formato: 'texto', ancho: 16, descripcion: 'La clave del atributo, como se escribió al programar (hook, tema, serie, pieza…).' },
      { titulo: 'Valor', formato: 'texto', ancho: 30, descripcion: 'El valor. «—» son las publicaciones sin ese atributo, incluidas las subidas a mano en la red.' },
      { titulo: 'Publicaciones', formato: 'entero', descripcion: 'Cuántas publicaciones del período (publicadas entre las dos fechas, sin las borradas) lo llevan.' },
      { titulo: 'Contra su cuenta', formato: 'veces', descripcion: 'La mediana de «Contra su cuenta» (ver «Publicaciones»). Sin YouTube.' },
      { titulo: 'Views a los 7 días', formato: 'entero', descripcion: 'La mediana de las views a los 7 días. Sin YouTube.' },
      { titulo: 'Views ganadas', formato: 'entero', descripcion: 'La mediana de las views ganadas en el período. Sin YouTube.' },
      { titulo: 'Visitas', formato: 'entero', descripcion: 'La mediana de las visitas por su link. Lo mide Tu Parrilla: incluye YouTube.' },
      { titulo: 'Arrastre', formato: 'porcentaje', descripcion: 'La mediana del arrastre. Sin YouTube.' },
    ],
  },
  lecturas: {
    nombre: 'Lecturas diarias',
    queTiene:
      'Cada lectura diaria de cada publicación dentro del período: los contadores tal como los dio la red ese día. Para ver cómo creció cada una.',
    tope: TOPES.lecturas,
    cuales: 'las de los días más recientes',
    columnas: [
      { titulo: 'Día', formato: 'fecha', descripcion: 'El día de la lectura, en tu zona horaria.' },
      { titulo: 'Leída', formato: 'fechaHora', descripcion: 'La hora en que se tomó la lectura.' },
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red de la publicación.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'La cuenta de la que salió.' },
      { titulo: 'Etiqueta ?s=', formato: 'texto', ancho: 16, descripcion: 'La etiqueta de la publicación: búscala en «Publicaciones» para ver su texto.' },
      { titulo: 'Id en la red', formato: 'texto', ancho: 22, descripcion: 'El id de la publicación en la red.' },
      { titulo: 'Views', formato: 'entero', descripcion: 'Acumuladas a esa lectura.' },
      { titulo: 'Likes', formato: 'entero', descripcion: 'Acumulados a esa lectura.' },
      { titulo: 'Comentarios', formato: 'entero', descripcion: 'Acumulados a esa lectura.' },
      { titulo: 'Compartidos', formato: 'entero', descripcion: 'Acumulados; vacío donde la red no los informa.' },
      { titulo: 'Guardados', formato: 'entero', descripcion: 'Acumulados; vacío donde la red no los informa.' },
      { titulo: 'Alcance', formato: 'entero', descripcion: 'El alcance a esa lectura; vacío donde la red no lo informa.' },
    ],
  },
  cuentas: {
    nombre: 'Cuentas',
    queTiene: 'Cada cuenta conectada: su conexión y, como en «Tus cuentas», sus seguidores y lo ganado en el período.',
    tope: null,
    columnas: [
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'Su nombre en la red, sin la @.' },
      { titulo: 'Id en la red', formato: 'texto', ancho: 22, descripcion: 'El id con que Tu Parrilla la lee.' },
      { titulo: 'Conectada', formato: 'texto', ancho: 10, descripcion: '«Sí» si Tu Parrilla tiene permiso guardado para leerla y publicar.' },
      { titulo: 'Última sincronización', formato: 'fechaHora', descripcion: 'La última vez que se leyó.' },
      { titulo: 'Error de la sincronización', formato: 'texto', ancho: 40, descripcion: 'Lo que falló en la última lectura, si falló.' },
      { titulo: 'Vence la conexión', formato: 'fechaHora', descripcion: 'Cuándo vence el permiso. Vacío si la red no lo dice.' },
      { titulo: 'Seguidores', formato: 'entero', descripcion: 'Seguidores (suscriptores en YouTube) en la última lectura del período, como los da la red.' },
      { titulo: 'Seguidores ganados', formato: 'entero', descripcion: `Lo ganado en el período: la última lectura menos la de antes del período. ${SIN_YOUTUBE}` },
      { titulo: 'Visitas al perfil', formato: 'entero', descripcion: 'Las del último día leído del período. Hoy solo las entrega Instagram.' },
      { titulo: 'Alcance', formato: 'entero', descripcion: 'El del último día leído del período. Hoy solo lo entrega Instagram.' },
      { titulo: 'Día de esa lectura', formato: 'fecha', descripcion: 'El día del que salen las visitas al perfil y el alcance.' },
    ],
  },
  seguidores: {
    nombre: 'Seguidores',
    queTiene: 'Cada lectura diaria de cada cuenta dentro del período: seguidores y lo que la red da del día.',
    tope: TOPES.seguidores,
    cuales: 'las de los días más recientes',
    columnas: [
      { titulo: 'Día', formato: 'fecha', descripcion: 'El día de la lectura, en tu zona horaria.' },
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'La cuenta.' },
      { titulo: 'Seguidores', formato: 'entero', descripcion: 'Seguidores (suscriptores en YouTube) ese día, como los da la red.' },
      { titulo: 'Ganados desde la lectura anterior', formato: 'entero', descripcion: `Seguidores de ese día menos los de la lectura anterior de la cuenta (puede ser de días antes si un día no se leyó). ${SIN_YOUTUBE}` },
      { titulo: 'Views totales de la cuenta', formato: 'entero', descripcion: 'El acumulado de la cuenta, donde la red lo da (YouTube).' },
      { titulo: 'Videos', formato: 'entero', descripcion: 'Cuántos videos tiene la cuenta, donde la red lo da (YouTube).' },
      { titulo: 'Visitas al perfil', formato: 'entero', descripcion: 'Las de ese día, según la red (hoy, Instagram).' },
      { titulo: 'Alcance', formato: 'entero', descripcion: 'El de ese día, según la red (hoy, Instagram).' },
      { titulo: 'Views del día', formato: 'entero', descripcion: 'Las views de toda la cuenta ese día, según la red.' },
      { titulo: 'Cuentas que interactuaron', formato: 'entero', descripcion: 'Las de ese día, según la red.' },
    ],
  },
  diaADia: {
    nombre: 'Día a día',
    queTiene:
      'Un día por fila: las visitas y los clicks de tu página, y las views ganadas por todas tus publicaciones contra las visitas que trajeron.',
    tope: null,
    columnas: [
      { titulo: 'Día', formato: 'fecha', descripcion: 'El día, en tu zona horaria.' },
      { titulo: 'Visitas', formato: 'entero', descripcion: 'Visitas a tus páginas ese día (con los filtros de página y bots de arriba).' },
      { titulo: 'Clicks', formato: 'entero', descripcion: 'Clicks en los links de tus páginas ese día.' },
      { titulo: 'Views ganadas', formato: 'entero', descripcion: 'Lo que crecieron las views de todas tus publicaciones ese día, de todas tus cuentas. Sin YouTube: sus reglas no dejan calcularlo.' },
      { titulo: 'Visitas desde publicaciones', formato: 'entero', descripcion: 'Las visitas de ese día que llegaron por el link de una de tus publicaciones (su etiqueta ?s=).' },
    ],
  },
  visitas: {
    nombre: 'Visitas',
    queTiene:
      'Cada visita a tus páginas en el período, con su etiqueta ?s=, sus UTM, de dónde llegó y con qué equipo. Sin IP, sin cookies y sin coordenadas: Tu Parrilla no las guarda o no las entrega.',
    tope: TOPES.visitas,
    cuales: 'las más recientes',
    columnas: [
      { titulo: 'Fecha y hora', formato: 'fechaHora', descripcion: 'Cuándo llegó, en tu zona horaria.' },
      { titulo: 'Página', formato: 'texto', ancho: 18, descripcion: 'La página que visitó, por su dirección (/tu-nombre).' },
      { titulo: 'De dónde', formato: 'texto', ancho: 12, descripcion: 'La red de origen que dedujo Tu Parrilla del referrer y de utm_source.' },
      { titulo: 'Referrer', formato: 'texto', ancho: 30, descripcion: 'La página de la que venía, como la mandó el navegador. Muchas apps no la mandan.' },
      { titulo: 'Etiqueta ?s=', formato: 'texto', ancho: 16, descripcion: 'La etiqueta del link por el que llegó: una publicación, un mensaje privado (dm-…) o una escrita a mano.' },
      { titulo: 'utm_source', formato: 'texto', ancho: 14, descripcion: 'Tal como venía en el link.' },
      { titulo: 'utm_medium', formato: 'texto', ancho: 14, descripcion: 'Tal como venía en el link.' },
      { titulo: 'utm_campaign', formato: 'texto', ancho: 16, descripcion: 'Tal como venía en el link.' },
      { titulo: 'utm_content', formato: 'texto', ancho: 16, descripcion: 'Tal como venía en el link.' },
      { titulo: 'País', formato: 'texto', ancho: 14, descripcion: 'Deducido de la conexión.' },
      { titulo: 'Región', formato: 'texto', ancho: 14, descripcion: 'Deducida de la conexión.' },
      { titulo: 'Ciudad', formato: 'texto', ancho: 14, descripcion: 'Deducida de la conexión.' },
      { titulo: 'Zona horaria del visitante', formato: 'texto', ancho: 18, descripcion: 'La del lugar de la conexión, no la tuya.' },
      { titulo: 'Dispositivo', formato: 'texto', ancho: 12, descripcion: 'Celular, computador, tablet…' },
      { titulo: 'Sistema', formato: 'texto', ancho: 12, descripcion: 'El sistema operativo.' },
      { titulo: 'Navegador', formato: 'texto', ancho: 14, descripcion: 'El navegador o la app.' },
      { titulo: 'Idioma', formato: 'texto', ancho: 10, descripcion: 'El idioma del navegador.' },
      { titulo: 'Bot', formato: 'texto', ancho: 6, descripcion: '«Sí» si parecía un programa y no una persona. Solo aparecen si en Los Números estaba prendido «Bots».' },
      { titulo: 'Id de la visita', formato: 'texto', ancho: 38, descripcion: 'Para unirla con sus clicks, en «Clicks».' },
    ],
  },
  clicks: {
    nombre: 'Clicks',
    queTiene: 'Cada click en un link de tus páginas en el período, con la etiqueta ?s= de la visita en que pasó.',
    tope: TOPES.clicks,
    cuales: 'los más recientes',
    columnas: [
      { titulo: 'Fecha y hora', formato: 'fechaHora', descripcion: 'Cuándo fue, en tu zona horaria.' },
      { titulo: 'Página', formato: 'texto', ancho: 18, descripcion: 'La página donde estaba el link.' },
      { titulo: 'Link', formato: 'texto', ancho: 24, descripcion: 'El nombre del link. «(link eliminado)» si ya no existe.' },
      { titulo: 'Dirección del link', formato: 'texto', ancho: 36, descripcion: 'Adónde llevaba.' },
      { titulo: 'Posición', formato: 'entero', descripcion: 'Su lugar en la página, desde arriba.' },
      { titulo: 'Segundos en la página', formato: 'decimal', descripcion: 'Cuánto pasó entre que cargó la página y el click.' },
      { titulo: 'Etiqueta ?s=', formato: 'texto', ancho: 16, descripcion: 'La etiqueta de la visita en que pasó el click.' },
      { titulo: 'Bot', formato: 'texto', ancho: 6, descripcion: '«Sí» si parecía un programa. Solo aparecen con «Bots» prendido.' },
      { titulo: 'Id de la visita', formato: 'texto', ancho: 38, descripcion: 'La visita en que pasó, en «Visitas».' },
    ],
  },
  etiquetas: {
    nombre: 'Etiquetas y UTM',
    queTiene:
      'Las visitas, únicos y clicks del período agrupados por etiqueta ?s= y por sus cuatro UTM, con la publicación de cada etiqueta. Completa aunque «Visitas» se corte.',
    tope: TOPES.etiquetas,
    cuales: 'los grupos con más visitas',
    columnas: [
      { titulo: 'Etiqueta ?s=', formato: 'texto', ancho: 16, descripcion: 'La etiqueta, o «(sin etiqueta)» para las visitas que llegaron sin ?s=.' },
      { titulo: 'Publicación', formato: 'texto', ancho: 40, descripcion: 'El texto de la publicación de esa etiqueta, si es de una.' },
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red de esa publicación.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'La cuenta de esa publicación.' },
      { titulo: 'utm_source', formato: 'texto', ancho: 14, descripcion: 'Tal como venía en el link; vacío si no traía.' },
      { titulo: 'utm_medium', formato: 'texto', ancho: 14, descripcion: 'Tal como venía en el link.' },
      { titulo: 'utm_campaign', formato: 'texto', ancho: 16, descripcion: 'Tal como venía en el link.' },
      { titulo: 'utm_content', formato: 'texto', ancho: 16, descripcion: 'Tal como venía en el link.' },
      { titulo: 'Visitas', formato: 'entero', descripcion: 'Visitas con esa etiqueta y esas UTM.' },
      { titulo: 'Únicos', formato: 'entero', descripcion: 'Visitantes distintos entre ellas (se cuentan por día, sin cookies).' },
      { titulo: 'Clicks', formato: 'entero', descripcion: 'Clicks hechos en esas visitas.' },
      { titulo: 'CTR', formato: 'porcentaje', descripcion: 'Clicks sobre visitas.' },
    ],
  },
  links: {
    nombre: 'Links',
    queTiene: 'Cada link de tus páginas con los clicks que tuvo en el período.',
    tope: TOPES.links,
    cuales: 'los más clickeados',
    columnas: [
      { titulo: 'Link', formato: 'texto', ancho: 28, descripcion: 'El nombre del link. «(link eliminado)» si ya no existe.' },
      { titulo: 'Dirección', formato: 'texto', ancho: 40, descripcion: 'Adónde lleva.' },
      { titulo: 'Clicks', formato: 'entero', descripcion: 'Clicks en el período.' },
      { titulo: 'CTR', formato: 'porcentaje', descripcion: 'Clicks sobre las visitas del período a tus páginas.' },
    ],
  },
  audiencia: {
    nombre: 'Audiencia',
    queTiene: 'Las visitas del período por país, ciudad, dispositivo, sistema, navegador, idioma y red de origen.',
    tope: null,
    columnas: [
      { titulo: 'Por', formato: 'texto', ancho: 16, descripcion: 'Qué se cuenta: país, ciudad, dispositivo, sistema, navegador, idioma o de dónde llegó.' },
      { titulo: 'Valor', formato: 'texto', ancho: 24, descripcion: `El país, la ciudad, etc. «Desconocido» si no se supo. Hasta ${TOPES.audiencia} por tipo, de más a menos visitas.` },
      { titulo: 'Visitas', formato: 'entero', descripcion: 'Visitas del período.' },
      { titulo: 'De las visitas', formato: 'porcentaje', descripcion: 'Qué parte de todas las visitas del período.' },
    ],
  },
  cuando: {
    nombre: 'Cuándo te visitan',
    queTiene: 'Las visitas del período por día de la semana y hora, en tu zona horaria: el mapa de calor de Los Números.',
    tope: null,
    columnas: [
      { titulo: 'Día', formato: 'texto', ancho: 11, descripcion: 'El día de la semana.' },
      ...Array.from({ length: 24 }, (_, h) => ({
        titulo: `${String(h).padStart(2, '0')}:00`,
        formato: 'entero' as const,
        ancho: 7,
        descripcion: h === 0 ? 'Una columna por hora, de 00:00 a 23:00: las visitas que llegaron en esa hora, sumando todas las semanas del período.' : '',
      })),
      { titulo: 'Total', formato: 'entero', descripcion: 'Las visitas de ese día de la semana.' },
    ],
  },
  programado: {
    nombre: 'Programado',
    queTiene:
      'Lo programado, lo publicado y lo quemado: cada destino de cada post de La Parrilla con hora en el período, más todo lo que todavía está por salir.',
    tope: TOPES.programado,
    cuales: 'los de hora más reciente',
    columnas: [
      { titulo: 'Hora', formato: 'fechaHora', descripcion: 'La hora para la que está programado, en tu zona horaria.' },
      { titulo: 'Estado', formato: 'texto', ancho: 14, descripcion: '«Programado», «Reintentando», «Publicando…», «Publicado», «En tu bandeja de TikTok» o «Se quemó» (no salió; de día, «Se echó a perder»).' },
      { titulo: 'Archivado', formato: 'texto', ancho: 10, descripcion: '«Sí» si lo quemado se archivó: ya no pide nada.' },
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red del destino.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'La cuenta del destino.' },
      { titulo: 'Texto', formato: 'texto', ancho: 50, descripcion: 'El texto con que sale a esa cuenta (el propio del destino, si tiene uno).' },
      { titulo: 'Motivo', formato: 'texto', ancho: 40, descripcion: 'Por qué no salió, o por qué se está reintentando.' },
      { titulo: 'Intentos', formato: 'entero', descripcion: 'Cuántas veces se intentó publicar.' },
      { titulo: 'Id en la red', formato: 'texto', ancho: 22, descripcion: 'El id de la publicación, cuando salió.' },
      { titulo: 'Medios', formato: 'texto', ancho: 14, descripcion: 'Cuántos videos e imágenes lleva.' },
      { titulo: 'Atributos', formato: 'texto', ancho: 30, descripcion: 'Los atributos del post (hook, tema…), como se guardaron.' },
      { titulo: 'Referencia', formato: 'texto', ancho: 16, descripcion: 'La referencia que le puso la API al cargarlo, si vino por ahí.' },
      { titulo: 'Creado', formato: 'fechaHora', descripcion: 'Cuándo se programó.' },
    ],
  },
  comentarios: {
    nombre: 'Comentarios',
    queTiene: 'Los comentarios de La Mesa que llegaron en el período, con lo que se hizo con cada uno.',
    tope: TOPES.comentarios,
    cuales: 'los más recientes',
    columnas: [
      { titulo: 'Fecha y hora', formato: 'fechaHora', descripcion: 'Cuándo se comentó, en tu zona horaria.' },
      { titulo: 'Red', formato: 'texto', ancho: 11, descripcion: 'La red.' },
      { titulo: 'Cuenta', formato: 'texto', ancho: 18, descripcion: 'Tu cuenta, donde se comentó.' },
      { titulo: 'Publicación', formato: 'texto', ancho: 36, descripcion: 'El texto de la publicación comentada.' },
      { titulo: 'Enlace de la publicación', formato: 'texto', ancho: 36, descripcion: 'Su dirección en la red.' },
      { titulo: 'Autor', formato: 'texto', ancho: 18, descripcion: 'Quién comentó, como lo muestra la red.' },
      { titulo: 'Comentario', formato: 'texto', ancho: 50, descripcion: 'Lo que escribió, tal cual.' },
      { titulo: 'Estado', formato: 'texto', ancho: 16, descripcion: '«Pendiente», «No salió», «Respondido», «Respondido desde la red», «Descartado» o «Tuyo» (un comentario tuyo).' },
      { titulo: 'Respuesta', formato: 'texto', ancho: 50, descripcion: 'La respuesta: la enviada, la que escribiste en la red, o el borrador si sigue pendiente.' },
      { titulo: 'Automática', formato: 'texto', ancho: 10, descripcion: '«Sí» si la respondió una palabra clave.' },
      { titulo: 'Palabra clave', formato: 'texto', ancho: 14, descripcion: 'La palabra clave del post, si tiene.' },
      { titulo: 'Privado', formato: 'texto', ancho: 10, descripcion: 'El mensaje privado de la palabra clave: «Pendiente», «Enviado» o «No salió».' },
      { titulo: 'Error', formato: 'texto', ancho: 30, descripcion: 'Por qué no salió la respuesta o el privado, o por qué se descartó.' },
    ],
  },
}

export function definicion(clave: Exclude<ClaveDeHoja, 'leeme'>): DefinicionDeHoja {
  return DEFINICIONES[clave]
}

export const NOMBRE_LEEME = 'Léeme'

export function nombreDeHoja(clave: ClaveDeHoja): string {
  return clave === 'leeme' ? NOMBRE_LEEME : DEFINICIONES[clave].nombre
}

// --- de la base a la fila ------------------------------------------------------------------------

const siNo = (valor: boolean): string => (valor ? 'Sí' : 'No')
const fraccion = (porcentaje: number | null): number | null => (porcentaje === null ? null : porcentaje / 100)
const fechaHora = (fecha: Date | null, zona: string): number | null => (fecha ? serialEnZona(fecha, zona) : null)

/**
 * El nombre de una cuenta en la red, sin la «@» del principio: una celda que empieza con «@» se
 * escribe con un apóstrofo adelante (`textoSeguro`), y en cada fila se leería «'@cuenta». La red
 * va en su propia columna.
 */
export function sinArroba(handle: string | null | undefined): string | null {
  if (!handle) return null
  return handle.replace(/^@+/, '') || null
}

/** La columna extra de un atributo en «Publicaciones». */
export function columnaDeAtributo(clave: string): Columna {
  return { titulo: `Atributo: ${clave}`, formato: 'texto', ancho: 16, descripcion: '' }
}

/** Lo que «Léeme» dice de las columnas «Atributo: …», que cambian según lo que se programó. */
export const DESCRIPCION_ATRIBUTOS =
  'Una columna por cada atributo que llevan las publicaciones (hook, tema, serie…), con su valor. Vacía en las que no lo llevan y en las subidas a mano en la red.'

export function filaDePublicacion(
  fila: PostRow,
  zona: string,
  cuenta: CuentaRow | undefined,
  atributos: Atributos | null,
  claves: readonly string[],
  contraSuCuenta: number | null,
): Fila {
  return [
    networkLabel(fila.network),
    sinArroba(cuenta?.handle),
    serialEnZona(fila.publishedAt, zona),
    fila.caption,
    fila.mediaType,
    fila.permalink,
    fila.campaign,
    fila.externalId,
    siNo(fila.archived),
    fila.views,
    fila.likes,
    fila.comments,
    fila.shares,
    fila.saves,
    fila.reach,
    fila.viewsChange,
    fila.likesChange,
    fila.commentsChange,
    fila.sharesChange,
    interaccionesDe(fila),
    fila.viewsA7Dias,
    // `contraSuCuenta` sale de las views a los 7 días, que ya vienen nulas en YouTube; la guarda
    // va igual, para que un cambio allá no la cuele acá.
    sinMetricasDerivadas(fila.network) ? null : contraSuCuenta,
    fila.visits,
    fila.uniques,
    fila.clicks,
    fraccion(fila.ctr),
    fraccion(fila.pull),
    ...claves.map((clave) => (atributos && clave in atributos ? textoDeAtributo(atributos[clave]) : null)),
  ]
}

export function filaPorAtributo(clave: string, comparada: FilaComparada): Fila {
  return [
    clave,
    comparada.valor ?? '—',
    comparada.publicaciones,
    comparada.contraSuCuenta,
    comparada.viewsA7Dias,
    comparada.viewsGanadas,
    comparada.visitas,
    fraccion(comparada.arrastre),
  ]
}

export type LecturaDePublicacion = {
  dia: string
  leidaEn: Date
  red: string
  handle: string | null
  etiqueta: string
  externalId: string
  views: number | null
  likes: number | null
  comments: number | null
  shares: number | null
  saves: number | null
  reach: number | null
}

export function filaDeLectura(l: LecturaDePublicacion, zona: string): Fila {
  return [
    serialDeDia(l.dia),
    serialEnZona(l.leidaEn, zona),
    networkLabel(l.red),
    sinArroba(l.handle),
    l.etiqueta,
    l.externalId,
    l.views,
    l.likes,
    l.comments,
    l.shares,
    l.saves,
    l.reach,
  ]
}

export function filaDeCuenta(cuenta: CuentaRow, tarjeta: AccountCard | null, ultimoDia: string | null, zona: string): Fila {
  return [
    networkLabel(cuenta.network),
    sinArroba(cuenta.handle),
    cuenta.externalId,
    siNo(cuenta.connected),
    fechaHora(cuenta.lastSyncedAt ? new Date(cuenta.lastSyncedAt) : null, zona),
    cuenta.lastSyncError,
    fechaHora(cuenta.expiresAt ? new Date(cuenta.expiresAt) : null, zona),
    tarjeta?.followers ?? null,
    // `buildAccountCards` ya lo anula en YouTube; la guarda va igual.
    tarjeta && !sinMetricasDerivadas(cuenta.network) ? tarjeta.followersChange : null,
    tarjeta?.profileViews ?? null,
    tarjeta?.reach ?? null,
    ultimoDia === null ? null : serialDeDia(ultimoDia),
  ]
}

export type LecturaDeCuenta = {
  dia: string
  red: string
  handle: string | null
  followers: number | null
  /** Los seguidores de la lectura anterior de la misma cuenta, de cualquier día. */
  followersAntes: number | null
  totalViews: number | null
  videoCount: number | null
  profileViews: number | null
  reach: number | null
  views: number | null
  accountsEngaged: number | null
}

export function filaDeSeguidores(l: LecturaDeCuenta): Fila {
  const ganados =
    !sinMetricasDerivadas(l.red) && l.followers !== null && l.followersAntes !== null ? l.followers - l.followersAntes : null
  return [
    serialDeDia(l.dia),
    networkLabel(l.red),
    sinArroba(l.handle),
    l.followers,
    ganados,
    l.totalViews,
    l.videoCount,
    l.profileViews,
    l.reach,
    l.views,
    l.accountsEngaged,
  ]
}

export type DiaDeLaSerie = { dia: string; visitas: number; clicks: number; viewsGanadas: number | null; visitasDesdePublicaciones: number | null }

export function filaDeDia(d: DiaDeLaSerie): Fila {
  return [serialDeDia(d.dia), d.visitas, d.clicks, d.viewsGanadas, d.visitasDesdePublicaciones]
}

const DISPOSITIVOS: Record<string, string> = {
  mobile: 'Celular',
  desktop: 'Computador',
  tablet: 'Tablet',
  wearable: 'Wearable',
  console: 'Consola',
  smarttv: 'Smart TV',
}

export function nombreDeDispositivo(tipo: string | null): string | null {
  if (tipo === null) return null
  return DISPOSITIVOS[tipo] ?? tipo
}

function nombreDePais(codigo: string | null): string | null {
  return codigo ? countryName(codigo) : null
}

export type VisitaCruda = {
  id: string
  creadaEn: Date
  slug: string | null
  referrerNetwork: string | null
  referrer: string | null
  campaign: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  country: string | null
  region: string | null
  city: string | null
  timezone: string | null
  deviceType: string | null
  os: string | null
  browser: string | null
  language: string | null
  isBot: boolean
}

export function filaDeVisita(v: VisitaCruda, zona: string): Fila {
  return [
    serialEnZona(v.creadaEn, zona),
    v.slug ? `/${v.slug}` : null,
    networkLabel(v.referrerNetwork),
    v.referrer,
    v.campaign,
    v.utmSource,
    v.utmMedium,
    v.utmCampaign,
    v.utmContent,
    nombreDePais(v.country),
    v.region,
    v.city,
    v.timezone,
    nombreDeDispositivo(v.deviceType),
    v.os,
    v.browser,
    v.language,
    siNo(v.isBot),
    v.id,
  ]
}

export type ClickCrudo = {
  creadoEn: Date
  slug: string | null
  link: string | null
  url: string | null
  linkBorrado: boolean
  position: number | null
  msOnPage: number | null
  campaign: string | null
  isBot: boolean
  visitId: string | null
}

export function filaDeClick(c: ClickCrudo, zona: string): Fila {
  return [
    serialEnZona(c.creadoEn, zona),
    c.slug ? `/${c.slug}` : null,
    c.linkBorrado ? '(link eliminado)' : c.link,
    c.url,
    c.position,
    c.msOnPage === null ? null : c.msOnPage / 1000,
    c.campaign,
    siNo(c.isBot),
    c.visitId,
  ]
}

export type GrupoDeEtiqueta = {
  campaign: string | null
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  utmContent: string | null
  visitas: number
  unicos: number
  clicks: number
}

export function filaDeEtiqueta(
  g: GrupoDeEtiqueta,
  publicacion: { caption: string | null; network: string; handle: string | null } | undefined,
): Fila {
  return [
    g.campaign ?? '(sin etiqueta)',
    publicacion?.caption ?? null,
    publicacion ? networkLabel(publicacion.network) : null,
    sinArroba(publicacion?.handle),
    g.utmSource,
    g.utmMedium,
    g.utmCampaign,
    g.utmContent,
    g.visitas,
    g.unicos,
    g.clicks,
    g.visitas > 0 ? g.clicks / g.visitas : null,
  ]
}

export function filaDeLink(l: { label: string; url: string; clicks: number; ctr: number }): Fila {
  return [l.label, l.url || null, l.clicks, fraccion(l.ctr)]
}

/** Lo que se cuenta en «Audiencia», en el orden de la hoja. */
export const DIMENSIONES = ['pais', 'ciudad', 'dispositivo', 'sistema', 'navegador', 'idioma', 'origen'] as const
export type Dimension = (typeof DIMENSIONES)[number]

const NOMBRE_DIMENSION: Record<Dimension, string> = {
  pais: 'País',
  ciudad: 'Ciudad',
  dispositivo: 'Dispositivo',
  sistema: 'Sistema',
  navegador: 'Navegador',
  idioma: 'Idioma',
  origen: 'De dónde',
}

export function filaDeAudiencia(dimension: Dimension, clave: string, visitas: number, total: number): Fila {
  const valor =
    clave === 'Desconocido'
      ? clave
      : dimension === 'pais'
        ? countryName(clave)
        : dimension === 'dispositivo'
          ? (nombreDeDispositivo(clave) ?? clave)
          : dimension === 'origen'
            ? networkLabel(clave)
            : clave
  return [NOMBRE_DIMENSION[dimension], valor, visitas, total > 0 ? visitas / total : null]
}

const DIAS_DE_LA_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Las 168 celdas del mapa de calor (día ISO 1–7 × hora 0–23) en siete filas. */
export function filasDelMapa(celdas: ReadonlyArray<{ dow: number; hour: number; visits: number }>): Fila[] {
  return DIAS_DE_LA_SEMANA.map((nombre, i) => {
    const horas = Array.from({ length: 24 }, (_, h) => celdas.find((c) => c.dow === i + 1 && c.hour === h)?.visits ?? 0)
    return [nombre, ...horas, horas.reduce((a, b) => a + b, 0)]
  })
}

const ESTADO_DESTINO: Record<string, string> = {
  scheduled: 'Programado',
  publishing: 'Publicando…',
  published: 'Publicado',
  failed: 'Se quemó',
}

export type DestinoProgramado = {
  hora: Date
  status: string
  archivado: boolean
  red: string
  handle: string | null
  texto: string
  lastError: string | null
  intentos: number
  externalId: string | null
  /** TikTok: el destino salió como borrador a la bandeja del dueño. */
  aLaBandeja: boolean
  videos: number
  imagenes: number
  atributos: unknown
  referencia: string | null
  creado: Date
}

/** Lo mismo que dice el chip de un destino en La Parrilla (`schedule/etiqueta.ts`). */
export function estadoDeDestino(d: Pick<DestinoProgramado, 'status' | 'lastError' | 'red' | 'aLaBandeja' | 'externalId'>): string {
  if (d.red === 'tiktok' && d.status === 'published' && d.aLaBandeja && !d.externalId) return 'En tu bandeja de TikTok'
  if (d.status === 'scheduled' && d.lastError) return 'Reintentando'
  return ESTADO_DESTINO[d.status] ?? d.status
}

function medios(videos: number, imagenes: number): string | null {
  const partes = [
    videos > 0 ? `${videos} ${videos === 1 ? 'video' : 'videos'}` : null,
    imagenes > 0 ? `${imagenes} ${imagenes === 1 ? 'imagen' : 'imágenes'}` : null,
  ].filter((p): p is string => p !== null)
  return partes.length > 0 ? partes.join(', ') : null
}

export function filaDeDestino(d: DestinoProgramado, zona: string): Fila {
  const atributos =
    d.atributos && typeof d.atributos === 'object' && Object.keys(d.atributos).length > 0 ? JSON.stringify(d.atributos) : null
  return [
    serialEnZona(d.hora, zona),
    estadoDeDestino(d),
    siNo(d.archivado),
    networkLabel(d.red),
    sinArroba(d.handle),
    d.texto,
    d.status === 'scheduled' || d.status === 'failed' ? d.lastError : null,
    d.intentos,
    d.externalId,
    medios(d.videos, d.imagenes),
    atributos,
    d.referencia,
    serialEnZona(d.creado, zona),
  ]
}

const ESTADO_COMENTARIO: Record<string, string> = {
  pendiente: 'Pendiente',
  fallido: 'No salió',
  enviado: 'Respondido',
  en_la_red: 'Respondido desde la red',
  descartado: 'Descartado',
  propio: 'Tuyo',
}

const ESTADO_PRIVADO: Record<string, string | null> = {
  no: null,
  pendiente: 'Pendiente',
  enviado: 'Enviado',
  fallido: 'No salió',
}

export type ComentarioCrudo = {
  publicadoEn: Date
  red: string
  handle: string | null
  publicacion: string | null
  enlace: string | null
  autor: string | null
  texto: string
  estado: string
  respuesta: string | null
  automatico: boolean
  palabra: string | null
  privado: string
  error: string | null
  errorPrivado: string | null
}

export function filaDeComentario(c: ComentarioCrudo, zona: string): Fila {
  const errores = [c.error, c.errorPrivado].filter((e): e is string => Boolean(e))
  return [
    serialEnZona(c.publicadoEn, zona),
    networkLabel(c.red),
    sinArroba(c.handle),
    c.publicacion,
    c.enlace,
    c.autor,
    c.texto,
    ESTADO_COMENTARIO[c.estado] ?? c.estado,
    c.respuesta,
    siNo(c.automatico),
    c.palabra,
    ESTADO_PRIVADO[c.privado] ?? null,
    errores.length > 0 ? errores.join(' · ') : null,
  ]
}

// --- el resumen ----------------------------------------------------------------------------------

export type CifrasDelResumen = {
  redes: {
    viewsGanadas: number | null
    seguidoresGanados: number | null
    interacciones: number
    visitasDesdePublicaciones: number
    arrastre: number | null
    publicaciones: number
  }
  pagina: {
    ahora: { visits: number; uniques: number; clicks: number; ctr: number; conClick: number }
    antes: { visits: number; uniques: number; clicks: number; ctr: number; conClick: number }
  }
}

const conteo = (n: number | null): Valor => (n === null ? null : { numero: n, formato: 'entero' as Formato })
const pct = (n: number | null): Valor => (n === null ? null : { numero: n / 100, formato: 'porcentaje' as Formato })

export function filasDelResumen(c: CifrasDelResumen): Fila[] {
  const { ahora, antes } = c.pagina
  return [
    ['En las redes', 'Views ganadas', conteo(c.redes.viewsGanadas), null, 'Lo que crecieron las views de tus publicaciones dentro del período. Sin YouTube.'],
    ['En las redes', 'Seguidores ganados', conteo(c.redes.seguidoresGanados), null, 'La suma de lo ganado por cada cuenta en el período. Sin YouTube.'],
    ['En las redes', 'Interacciones', conteo(c.redes.interacciones), null, 'Likes, comentarios y compartidos ganados en el período. Sin YouTube.'],
    ['En las redes', 'Visitas desde posts', conteo(c.redes.visitasDesdePublicaciones), null, 'Visitas a tus páginas que llegaron por el link de una publicación. Incluye YouTube: las mide Tu Parrilla.'],
    ['En las redes', 'Arrastre', pct(c.redes.arrastre), null, 'De quienes vieron tus publicaciones en el período, cuántos llegaron a tu página: visitas sobre views ganadas. Sin YouTube.'],
    ['En las redes', 'Publicaciones con actividad', conteo(c.redes.publicaciones), null, 'Las que tuvieron una lectura o una visita en el período, sin las borradas: las que suman arriba.'],
    ['En tu página', 'Visitas', conteo(ahora.visits), conteo(antes.visits), 'Visitas a tus páginas de links.'],
    ['En tu página', 'Únicos', conteo(ahora.uniques), conteo(antes.uniques), 'Visitantes distintos (se cuentan por día, sin cookies).'],
    ['En tu página', 'Clicks en tus links', conteo(ahora.clicks), conteo(antes.clicks), 'Clicks en los links de tus páginas.'],
    ['En tu página', 'CTR', pct(ahora.ctr), pct(antes.ctr), 'Clicks sobre visitas.'],
    ['En tu página', 'Visitas con al menos un click', conteo(ahora.conClick), conteo(antes.conClick), 'El embudo: de las visitas, cuántas apretaron algo.'],
  ]
}

/** Lo que «Léeme» dice de YouTube, una vez, arriba. */
export const NOTA_YOUTUBE = [
  `YouTube: sus reglas no dejan que Tu Parrilla calcule métricas con sus datos ni que guarde lo que lleva más de ${DIAS_RETENCION_YOUTUBE} días sin refrescarse.`,
  'Por eso, de YouTube va solo lo que entrega YouTube —views, likes, comentarios, suscriptores, títulos y comentarios de tus videos—,',
  `de lecturas de los últimos ${DIAS_RETENCION_YOUTUBE} días, tal como llegó. Lo ganado, el arrastre, las views a los 7 días, «Contra su cuenta», los seguidores ganados`,
  'y las medianas quedan vacíos en sus filas, y sus números no entran en ninguna suma. Las visitas, los clicks y el CTR los mide Tu Parrilla, no YouTube: van para todas las redes.',
].join(' ')
