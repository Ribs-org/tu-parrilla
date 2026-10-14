import { dayKey, dayLabelConMes, hourLabel } from '@/lib/schedule-week'
import { formatNumber } from '@/lib/utils'

// Lo que La Parrilla decide sin tocar la base para lo que pide una acción: qué se quemó, a
// qué hora y día, y qué dice el pie de ayer (cuántos cortes y cuántas miradas). La página
// solo compone; esto se prueba con fixtures. El nombre viene de El Fuego, la pantalla de
// entrada que lo usaba antes de fundirse en La Parrilla.

/**
 * Lo mínimo que estas funciones necesitan de un corte. Las tres que seleccionan son
 * genéricas sobre esta forma y devuelven lo que recibieron: la lectura real
 * (`CorteCargado`, en `social/publish/cortes.ts`) trae además la media y el handle de cada
 * destino, y la pantalla los pinta. Estrechar a `Corte` en la salida obligaría a la página
 * a volver a ensanchar con un cast.
 */
export type Corte = {
  post: { id: string; caption: string; scheduledAt: Date }
  targets: Array<{
    id: string
    network: string
    handle: string | null
    status: string
    externalId: string | null
    opciones: unknown
    lastError: string | null
  }>
}

/**
 * Cada destino que se quemó, con su corte: es lo único de La Parrilla que pide una acción
 * sin que nadie la busque.
 *
 * Del más reciente al más viejo, y el orden es la información: esta lectura no tiene
 * ventana de fecha —un fallo viejo sigue pidiendo la acción hasta que alguien lo
 * reprograma—, así que sin ordenarla lo de la semana pasada quedaría arriba de lo de hoy. Se ordena acá y no en la
 * página para no depender del orden en que la base los entregue.
 */
export function quemados<T extends Corte>(cortes: T[]): Array<{ corte: T; destino: T['targets'][number] }> {
  return cortes
    .flatMap((corte) => corte.targets.filter((t) => t.status === 'failed').map((destino) => ({ corte, destino })))
    .sort((a, b) => b.corte.post.scheduledAt.getTime() - a.corte.post.scheduledAt.getTime())
}

/**
 * La hora de un corte, con su día y su mes delante si no es de hoy: «vie 25 de sep · 09:15».
 *
 * Lo pide «Se quemó», que no tiene ventana de fecha ninguna: sin el día, un fallo de la
 * semana pasada se lee «09:15», idéntico a uno de esta mañana. Y el mes va **siempre** que
 * no sea de hoy, sin regla de «si cae fuera de esta semana»: es la única lista de la
 * parrilla que puede traer algo de hace dos meses, así que «mié 12» a secas sería otra vez
 * el problema que el mes vino a resolver — con la agravante de que acá no hay ventana que
 * acote cuánto puede alejarse.
 */
export function horaConDia(scheduledAt: Date, now: Date, zone: string): string {
  const dia = dayKey(scheduledAt, zone)
  const hora = hourLabel(scheduledAt, zone)
  return dia === dayKey(now, zone) ? hora : `${dayLabelConMes(dia)} · ${hora}`
}

/**
 * El pie de la pantalla. Las miradas solo cuando el sync ya las trajo: un cero inventado
 * diría «nadie miró» cuando lo cierto es «todavía no se sabe».
 */
export function pieDeAyer(servidos: number, miradas: number | null): string {
  if (servidos === 0) return 'Ayer no salió nada.'
  const cortes = servidos === 1 ? '1 corte servido' : `${servidos} cortes servidos`
  return miradas === null ? `Ayer: ${cortes}` : `Ayer: ${cortes} · ${formatNumber(miradas)} miradas`
}

/**
 * Las miradas de ayer a partir de las filas de `post_metrics` de esos posts: el último
 * día disponible por post, sumado. `day` es un `date` de Postgres, que Drizzle entrega
 * como texto `YYYY-MM-DD` — comparable con `>` tal cual, como ya hace `social/delta.ts`.
 * Un cero inventado es distinto de «no se sabe»: solo hay número si al menos un post trajo
 * uno de verdad (la red puede no reportar vistas y dejarlo en null).
 */
export function miradasDe(metricas: Array<{ postId: string; day: string; views: number | null }>): number | null {
  const ultimoPorPost = new Map<string, { day: string; views: number | null }>()
  for (const fila of metricas) {
    const actual = ultimoPorPost.get(fila.postId)
    if (!actual || fila.day > actual.day) ultimoPorPost.set(fila.postId, { day: fila.day, views: fila.views })
  }
  let miradas = 0
  let algunaMetrica = false
  for (const { views } of ultimoPorPost.values()) {
    if (views !== null) {
      miradas += views
      algunaMetrica = true
    }
  }
  return algunaMetrica ? miradas : null
}
