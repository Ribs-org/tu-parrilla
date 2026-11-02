// La aritmética del calendario de la app (`components/selector-fecha.tsx`), pura. Los días son
// «YYYY-MM-DD» en el reloj del teléfono, como los daban los selectores del sistema que reemplaza:
// la hora elegida es la de pared del teléfono, y el `Date` que sale se manda como siempre.

const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Las columnas del mes, de lunes a domingo, como en el panel. */
export const CABECERA_DE_SEMANA = ['lu', 'ma', 'mi', 'ju', 'vi', 'sá', 'do']

const dos = (n: number) => String(n).padStart(2, '0')

/** El día de un instante, en el reloj del teléfono. */
export function diaDe(fecha: Date): string {
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

/** El día y la hora juntos, en el reloj del teléfono. */
export function armar(dia: string, hora: number, minuto: number): Date {
  return new Date(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)), hora, minuto, 0, 0)
}

function sumarDias(dia: string, n: number): string {
  const d = new Date(Date.UTC(Number(dia.slice(0, 4)), Number(dia.slice(5, 7)) - 1, Number(dia.slice(8, 10)) + n))
  return d.toISOString().slice(0, 10)
}

/** «2026-11» */
export function mesDe(dia: string): string {
  return dia.slice(0, 7)
}

export function sumarMeses(mes: string, n: number): string {
  const total = Number(mes.slice(0, 4)) * 12 + Number(mes.slice(5, 7)) - 1 + n
  return `${Math.floor(total / 12)}-${dos((total % 12) + 1)}`
}

/** Seis semanas de lunes a domingo desde la del día 1: el mes no cambia de alto al pasar. */
export function semanasDelMes(mes: string): string[][] {
  const primero = `${mes}-01`
  const dow = (new Date(`${primero}T00:00:00Z`).getUTCDay() + 6) % 7
  const lunes = sumarDias(primero, -dow)
  return Array.from({ length: 6 }, (_, s) => Array.from({ length: 7 }, (_, d) => sumarDias(lunes, s * 7 + d)))
}

/** «noviembre de 2026» */
export function nombreDelMes(mes: string): string {
  return `${MESES[Number(mes.slice(5, 7)) - 1]} de ${mes.slice(0, 4)}`
}

/** «3 de noviembre de 2026», para el lector de pantalla. */
export function diaEnPalabras(dia: string): string {
  return `${Number(dia.slice(8))} de ${nombreDelMes(mesDe(dia))}`
}

/** Los minutos que se ofrecen: de cinco en cinco, y el que ya traía la fecha si no es uno de esos. */
export function minutosOfrecidos(actual: number): number[] {
  const cada5 = Array.from({ length: 12 }, (_, i) => i * 5)
  return cada5.includes(actual) ? cada5 : [...cada5, actual].sort((a, b) => a - b)
}

export function dosCifras(n: number): string {
  return dos(n)
}
