// Puro: recibe las filas ya leídas y arma lo que la sección dibuja. La zona no entra
// acá — los `day` ya vienen como fecha local desde la sincronización.
import { periodChange } from './social/delta'
import { sinMetricasDerivadas } from './social/politica-youtube'

export type AccountMetricRow = {
  network: string
  /** La cuenta de la lectura. Hace falta para agrupar por cuenta; por red no se mira. */
  accountId?: string
  day: string
  followers: number | null
  profileViews: number | null
  reach: number | null
}

/**
 * Una cuenta no «nace» dentro de una ventana como sí lo hace un post, así que su
 * contador sin lectura previa siempre significa «no lo puedo saber». Esta fecha
 * imposible es lo que le dice eso a `periodChange`, cuyo cuarto argumento existe
 * justamente para distinguir los dos casos.
 */
const LA_CUENTA_YA_EXISTIA = '0000-01-01'

export type AccountCard = {
  network: string
  /** La cuenta de la tarjeta al agrupar por cuenta; null al agrupar por red. */
  accountId: string | null
  followers: number | null
  /** Seguidores ganados dentro del período; null cuando no hay lectura previa. */
  followersChange: number | null
  profileViews: number | null
  reach: number | null
  /** Fecha corta (ej. «3 sep») del día del que salen `profileViews`/`reach`; null si no hay lectura. */
  dayLabel: string | null
}

/**
 * Una tarjeta por red o una por cuenta. Por red mezcla las lecturas de dos cuentas de la
 * misma red en una sola tarjeta —la cifra es la última lectura de cualquiera de las dos—,
 * así que el panel agrupa por cuenta; la app del teléfono sigue por red hasta que su
 * pantalla sepa mostrar dos tarjetas de una misma red (`docs/deuda-tecnica.md`).
 */
export function buildAccountCards(
  rows: AccountMetricRow[],
  from: string,
  to: string,
  agrupar: 'red' | 'cuenta' = 'red',
): AccountCard[] {
  const grupos = new Map<string, AccountMetricRow[]>()
  for (const row of rows) {
    const clave = agrupar === 'cuenta' ? (row.accountId ?? row.network) : row.network
    const list = grupos.get(clave) ?? []
    list.push(row)
    grupos.set(clave, list)
  }

  return [...grupos.values()].map((list) => {
    const network = list[0]!.network
    const ordered = [...list].sort((a, b) => a.day.localeCompare(b.day))
    const inside = ordered.filter((r) => r.day >= from && r.day <= to)
    const last = inside.at(-1) ?? null

    // El mismo motor que los posts: distingue «creció esto» de «no lo puedo saber».
    const followers = periodChange(
      ordered.map((r) => ({ day: r.day, value: r.followers })),
      from,
      to,
      LA_CUENTA_YA_EXISTIA,
    )

    return {
      network,
      accountId: agrupar === 'cuenta' ? (list[0]!.accountId ?? null) : null,
      followers: followers.current,
      // Los suscriptores ganados de YouTube salen de restar dos lecturas: una métrica
      // derivada, que sus políticas no permiten (`politica-youtube`). El total sí.
      followersChange: sinMetricasDerivadas(network) ? null : followers.change,
      profileViews: last?.profileViews ?? null,
      reach: last?.reach ?? null,
      dayLabel: last ? formatShortDay(last.day) : null,
    }
  })
}

export type AccountSeriesPoint = {
  date: string
  /** Suma entre redes; null solo cuando ninguna red aportó el dato ese día. */
  profileViews: number | null
  reach: number | null
}

function sumOrNull(a: number | null, b: number | null): number | null {
  if (a === null && b === null) return null
  return (a ?? 0) + (b ?? 0)
}

/**
 * Serie diaria de visitas al perfil y alcance, sumada entre redes cuando más de una
 * aporte el dato. Hoy solo Instagram lo entrega, pero la suma no lo asume: un día sin
 * ninguna lectura queda en null, no en cero. YouTube nunca entra en la suma: sumar sus
 * datos con los de otra red sería una métrica derivada (`politica-youtube`).
 */
export function buildAccountSeries(
  rows: AccountMetricRow[],
  from: string,
  to: string,
): AccountSeriesPoint[] {
  const byDay = new Map<string, { profileViews: number | null; reach: number | null }>()
  for (const row of rows) {
    if (row.day < from || row.day > to) continue
    if (sinMetricasDerivadas(row.network)) continue
    const existing = byDay.get(row.day) ?? { profileViews: null, reach: null }
    byDay.set(row.day, {
      profileViews: sumOrNull(existing.profileViews, row.profileViews),
      reach: sumOrNull(existing.reach, row.reach),
    })
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => ({ date, ...values }))
}

const MONTHS_SHORT = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

/** `YYYY-MM-DD` → «3 sep», sin construir un `Date` (el día ya es wall-clock, no un instante). */
export function formatShortDay(day: string): string {
  const [, month, dayOfMonth] = day.split('-').map(Number) as [number, number, number]
  return `${dayOfMonth} ${MONTHS_SHORT[month - 1]}`
}
