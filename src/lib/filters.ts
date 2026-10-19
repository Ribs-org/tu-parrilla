import type { Filters } from './analytics'
import { parseRango } from './metrics-api'
import { PRIMER_DIA } from './rango'
import { dayKey } from './schedule-week'

export const RANGES = [
  { key: 'today', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'all', label: 'Todo' },
] as const

export type RangeKey = (typeof RANGES)[number]['key']

const DAYS: Record<RangeKey, number | null> = {
  today: 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  all: null,
}

/** Lo que la barra del período necesita saber del que está puesto. */
export type Periodo = {
  /** El atajo elegido, o `fechas` si se eligieron a mano (`?desde=&hasta=`). */
  rango: RangeKey | 'fechas'
  /** El primer y el último día del período, los dos incluidos, en la zona del dueño. */
  desde: string
  hasta: string
  /** Hoy en la zona del dueño: el tope del selector y desde donde se cuentan sus atajos. */
  hoy: string
}

export type ParsedFilters = Filters & { range: RangeKey | 'fechas'; periodo: Periodo }

/**
 * `zone` no sale de la URL: es la del dueño, y quien llama ya la tiene (la sesión en el
 * panel, `buscarPorId` en la API). Exigirla acá es lo que impide que una pantalla nueva
 * arme `Filters` y agrupe los días en la zona del servidor sin que nadie lo note.
 *
 * Las fechas a mano (`?desde=YYYY-MM-DD&hasta=YYYY-MM-DD`) mandan sobre `range` y se leen
 * igual que en la API de métricas (`parseRango`): días enteros en la zona del dueño, los dos
 * incluidos. Unas que no se entienden —un enlace viejo, una URL escrita a mano— no rompen
 * la pantalla: se ignoran y queda el atajo, o los 30 días de entrada.
 */
export function parseFilters(
  searchParams: Record<string, string | string[] | undefined>,
  ownerId: string,
  zone: string,
): ParsedFilters {
  const now = new Date()
  const desdePedido = typeof searchParams.desde === 'string' ? searchParams.desde : null
  const hastaPedido = typeof searchParams.hasta === 'string' ? searchParams.hasta : null
  const aMano = desdePedido !== null || hastaPedido !== null ? parseRango(desdePedido, hastaPedido, now, zone) : null

  let range: RangeKey | 'fechas'
  let from: Date
  let to: Date
  if (aMano !== null && !('error' in aMano)) {
    range = 'fechas'
    from = aMano.from
    to = aMano.to
  } else {
    const raw = typeof searchParams.range === 'string' ? searchParams.range : '30d'
    const atajo = (RANGES.find((r) => r.key === raw)?.key ?? '30d') as RangeKey
    const days = DAYS[atajo]
    range = atajo
    to = now
    from = days === null ? new Date('2020-01-01T00:00:00Z') : new Date(to.getTime() - days * 864e5)
  }

  // El último día es el del instante anterior a `to`: con fechas a mano, `to` es la
  // medianoche siguiente a `hasta`, que ya es otro día. «Todo» empieza a la medianoche UTC
  // del 1 de enero de 2020, que en Chile todavía es el 31 de diciembre: el selector no
  // ofrece nada antes del 1.
  const desdeDia = dayKey(from, zone)
  const periodo: Periodo = {
    rango: range,
    desde: desdeDia < PRIMER_DIA ? PRIMER_DIA : desdeDia,
    hasta: dayKey(new Date(to.getTime() - 1), zone),
    hoy: dayKey(now, zone),
  }

  const profileParam = typeof searchParams.profile === 'string' ? searchParams.profile : ''

  // El id del perfil llega de la URL sin comprobar que sea del dueño, y puede quedarse así
  // mientras toda consulta que lo use lleve además el filtro por dueño: la intersección de
  // «perfil ajeno» y «mis perfiles» es vacía. Una consulta futura que filtre solo por este
  // id vería filas de otro.
  return {
    range,
    periodo,
    ownerId,
    zone,
    from,
    to,
    profileId: profileParam && profileParam !== 'all' ? profileParam : null,
    includeBots: searchParams.bots === '1',
  }
}
