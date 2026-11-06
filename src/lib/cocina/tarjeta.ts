import type { EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'
import { cortes } from '@/lib/vocabulario'
import { NOMBRE_ESTADO, tandasEnPalabras } from './nombres'

// Lo que dice la tarjeta de una comanda en La Cocina, sin base: el estado en palabras, con el
// «3 de 5» al servir y cuántos cortes quedaron en el mesón al estar lista, cuántas van antes y en
// qué tramo de su recorrido va.

type ParaElEstado = { estado: EstadoComanda; tandasServidas: number; tandasTotal: number | null; enElMeson: number }

export function estadoEnPalabras(c: ParaElEstado, tema: Tema): string {
  if (c.estado === 'sirviendo') return `${NOMBRE_ESTADO.sirviendo[tema]}: ${tandasEnPalabras(c.tandasServidas, c.tandasTotal, tema)}`
  if (c.estado === 'lista') return `${NOMBRE_ESTADO.lista[tema]}: ${cortes(c.enElMeson, tema)}`
  return NOMBRE_ESTADO[c.estado][tema]
}

/** Cuántas comandas van antes en la fila, en palabras. */
export function antesEnLaFila(antes: number): string {
  if (antes === 0) return 'Es la próxima en la fila.'
  return antes === 1 ? 'Hay 1 comanda antes que la tuya.' : `Hay ${antes} comandas antes que la tuya.`
}

/**
 * En qué tramo del recorrido va, de 0 a 4 —colgada, el chef mira, el desposte, al fuego, el
 * mesón—, o 5 si ya llegó toda al mesón. Null si terminó sin cocinarse: no lleva recorrido.
 * `pregunta` y `probando` cuentan con el tramo donde ocurren: la pregunta, el del estado de donde
 * salió (`vuelveA`: al revisar o al despostar), y la prueba, al despostar.
 */
export function tramoDelRecorrido(estado: EstadoComanda, vuelveA?: EstadoComanda | null): number | null {
  if (estado === 'pregunta' && vuelveA && vuelveA !== 'pregunta') return tramoDelRecorrido(vuelveA)
  const tramos: Partial<Record<EstadoComanda, number>> = {
    recibida: 0,
    revisando: 1,
    pregunta: 1,
    en_preparacion: 2,
    probando: 2,
    en_el_horno: 3,
    sirviendo: 4,
    lista: 5,
    servida: 5,
  }
  return tramos[estado] ?? null
}
