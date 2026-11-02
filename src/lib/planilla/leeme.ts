// La hoja «Léeme»: la primera de la planilla, y la que la explica. Se escribe al final, cuando ya
// se sabe cuántas filas llevó cada hoja y qué quedó fuera. Pura, para los tests.

import {
  CLAVES_DE_HOJA,
  DESCRIPCION_ATRIBUTOS,
  NOTA_YOUTUBE,
  definicion,
  nombreDeHoja,
  type ClaveDeHoja,
} from './hojas'
import { ESTILO, serialEnZona, type CeldaLibre } from './xlsx'

/** Una hoja que no llevó todo lo que había. */
export type Recorte = {
  hoja: Exclude<ClaveDeHoja, 'leeme'>
  /** Cuántas filas llevó. */
  llevadas: number
  /** Cuántas había, si se contaron. */
  total: number | null
  /** Se cortó porque se acababa el tiempo, no por su tope. */
  porTiempo: boolean
}

export type DatosDelLeeme = {
  ahora: Date
  zona: string
  /** Los dos días del período, incluidos, `YYYY-MM-DD`. */
  desde: string
  hasta: string
  /** La cuenta elegida en Los Números, o null si son todas. */
  cuenta: string | null
  /** La página elegida, o null si son todas. */
  pagina: string | null
  bots: boolean
  filas: Partial<Record<Exclude<ClaveDeHoja, 'leeme'>, number>>
  recortes: readonly Recorte[]
}

const MIL = new Intl.NumberFormat('es-CL')

/** Lo que dice «Léeme», y la ventana del panel, de una hoja que no llevó todo. */
export function fraseDeRecorte(r: Recorte): string {
  const d = definicion(r.hoja)
  if (r.porTiempo) {
    return `${d.nombre}: se acabó el tiempo y llevó ${MIL.format(r.llevadas)} filas (${d.cuales ?? 'las primeras'}). Elige un período más corto para tenerla entera.`
  }
  const de = r.total !== null ? ` de ${MIL.format(r.total)}` : ''
  return `${d.nombre}: lleva ${d.cuales ?? 'las primeras'}, ${MIL.format(r.llevadas)}${de}. Elige un período más corto para tenerla entera.`
}

const fila = (...celdas: CeldaLibre[]): CeldaLibre[] => celdas
const texto = (valor: string, estilo: number = ESTILO.envuelto): CeldaLibre => ({ valor, estilo })
const vacia: CeldaLibre[] = []

/** Las filas de «Léeme», en dos columnas: el rótulo y lo que dice. */
export function filasDelLeeme(d: DatosDelLeeme): CeldaLibre[][] {
  const filas: CeldaLibre[][] = [
    fila(texto('Los Números de Tu Parrilla', ESTILO.titulo)),
    fila(texto('Para llevar: todo lo que Los Números puede sacar del período elegido, una hoja por tema.', ESTILO.nota)),
    vacia,
    fila(texto('Exportada el', ESTILO.negrita), { valor: serialEnZona(d.ahora, d.zona), estilo: ESTILO.fechaHoraSuelta }),
    fila(texto('Zona horaria', ESTILO.negrita), texto(`${d.zona}. Todas las fechas y horas de la planilla están en esta zona, la de Tu Cuenta.`)),
    fila(texto('Período', ESTILO.negrita), texto(`Del ${d.desde} al ${d.hasta}, los dos días incluidos.`)),
    fila(texto('Cuenta', ESTILO.negrita), texto(d.cuenta ?? 'Todas las cuentas')),
    fila(texto('Página', ESTILO.negrita), texto(d.pagina ?? 'Todas tus páginas')),
    fila(texto('Bots', ESTILO.negrita), texto(d.bots ? 'Incluidos («Bots» estaba prendido).' : 'Fuera, como en Los Números.')),
    vacia,
    fila(texto('Cómo leerla', ESTILO.seccion)),
    fila(texto('Celdas vacías', ESTILO.negrita), texto('Vacía es «no se sabe» o «la red no lo informa», que no es lo mismo que cero. Un cero es un cero.')),
    fila(
      texto('Textos con apóstrofo', ESTILO.negrita),
      texto(
        'Un texto que empieza con =, +, -, @, un tabulador o un salto lleva un apóstrofo adelante (\'), para que Excel nunca lo lea como una fórmula: los comentarios, los textos y los links los escribe cualquiera. La planilla no tiene fórmulas.',
      ),
    ),
    fila(texto('Cuentas', ESTILO.negrita), texto('Cada cuenta va por su nombre en la red, sin la @; la red, en su propia columna.')),
    fila(texto('Porcentajes', ESTILO.negrita), texto('CTR y arrastre van como porcentaje de Excel: 0,05 se ve 5,00 %.')),
    fila(texto('Filtros', ESTILO.negrita), texto('Cada hoja de datos tiene el encabezado fijo y filtros: usa la flecha de cada columna para ordenar o filtrar.')),
    fila(texto('YouTube', ESTILO.negrita), texto(NOTA_YOUTUBE)),
    vacia,
    fila(texto('Lo que quedó fuera', ESTILO.seccion)),
  ]

  if (d.recortes.length === 0) {
    filas.push(fila(texto('Nada', ESTILO.negrita), texto('Cada hoja lleva todo lo que había en el período.')))
  } else {
    for (const r of d.recortes) filas.push(fila(texto(definicion(r.hoja).nombre, ESTILO.negrita), texto(fraseDeRecorte(r))))
  }

  filas.push(vacia, fila(texto('Las hojas', ESTILO.seccion)))
  for (const clave of CLAVES_DE_HOJA) {
    if (clave === 'leeme') continue
    const d2 = definicion(clave)
    const cuantas = d.filas[clave]
    const tope = d2.tope ? ` Tope: ${MIL.format(d2.tope)} filas (${d2.cuales}).` : ''
    const llevo = cuantas === undefined ? '' : ` Lleva ${MIL.format(cuantas)} ${cuantas === 1 ? 'fila' : 'filas'}.`
    filas.push(fila(texto(d2.nombre, ESTILO.negrita), texto(`${d2.queTiene}${llevo}${tope}`)))
  }

  for (const clave of CLAVES_DE_HOJA) {
    if (clave === 'leeme') continue
    const d2 = definicion(clave)
    filas.push(vacia, fila(texto(`Columnas de «${nombreDeHoja(clave)}»`, ESTILO.seccion)))
    for (const columna of d2.columnas) {
      if (!columna.descripcion) continue
      filas.push(fila(texto(columna.titulo, ESTILO.negrita), texto(columna.descripcion)))
    }
    if (clave === 'publicaciones') filas.push(fila(texto('Atributo: …', ESTILO.negrita), texto(DESCRIPCION_ATRIBUTOS)))
  }

  return filas
}

/** Los anchos de las dos columnas de «Léeme». */
export const ANCHOS_DEL_LEEME = [30, 110] as const
