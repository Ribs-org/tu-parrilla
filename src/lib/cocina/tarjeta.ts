import type { EstadoComanda } from '@/db/schema'
import type { Tema } from '@/lib/tema'
import { cortes } from '@/lib/vocabulario'
import { NOMBRE_ESTADO, tandasEnPalabras } from './nombres'

// Lo que dice la tarjeta de una comanda en La Cocina, sin base: el estado en palabras, con el
// «3 de 5» al servir y cuántos cortes quedaron en el mesón al estar lista, y cuántas van antes.

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
