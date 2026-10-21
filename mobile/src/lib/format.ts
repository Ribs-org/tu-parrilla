const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

/** `—` y nunca `0`: la red que no reportó un número no reportó un cero. */
export function num(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(1).replace('.', ',')} mil`
  return String(value)
}

export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'
  return `${value.toFixed(1).replace('.', ',')}%`
}

/**
 * El API manda ISO con el offset del sitio ya aplicado; leer sus dígitos es más
 * honesto que construir un Date, que volvería a traducir a la zona del teléfono.
 */
export function shortDate(iso: string): string {
  const mes = MESES[Number(iso.slice(5, 7)) - 1] ?? ''
  return `${Number(iso.slice(8, 10))} ${mes}, ${iso.slice(11, 16)}`
}

/**
 * Si un enlace que llegó de la API se puede abrir desde la app: solo `https`. El de una
 * publicación lo manda la red, y `Linking.openURL` abre lo que le den —otra app con su esquema,
 * un `intent:` de Android—; un enlace raro no tiene que sacar a nadie de la app a ciegas.
 */
export function esEnlaceSeguro(url: string | null | undefined): url is string {
  if (!url) return false
  try {
    return new URL(url).protocol === 'https:'
  } catch {
    return false
  }
}

/** Las claves de atributos ya vienen en español (`hook`, `tema`); solo falta mayúscula inicial. */
export function capitalizar(texto: string): string {
  return texto ? texto[0].toUpperCase() + texto.slice(1) : texto
}


/**
 * La comparación con el período anterior, como la escribe el panel: «+12%», «-8%» o «0%»
 * cuando casi no cambió; null cuando no hay con qué comparar (el período anterior tuvo cero,
 * o es «Todo»), que se pinta «—». `sube` dice el color: verde, rojo o ninguno.
 */
export function cambio(valor: number | null): { texto: string; sube: boolean | null } | null {
  if (valor === null || !Number.isFinite(valor)) return null
  if (Math.abs(valor) < 0.5) return { texto: '0%', sube: null }
  const redondo = Math.round(valor)
  return { texto: `${redondo > 0 ? '+' : ''}${redondo}%`, sube: redondo > 0 }
}
