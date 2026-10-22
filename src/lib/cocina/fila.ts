// El orden en que el chef toma las comandas que esperan. Puro, para probarlo sin base.
//
// Dos reglas del diseño («Capacidad, cupos y tiempos»): **las pruebas se saltan la fila**
// —son unos diez minutos de horno y no esperan detrás de un largo de cuatro horas—, y **la fila
// es pareja**: el chef no toma dos comandas del mismo usuario mientras haya otro esperando, así
// un cliente con diez comandas no tapa a los demás.

import type { TipoComanda } from '@/db/schema'

export type EnFila = { id: string; ownerId: string; tipo: TipoComanda; creadaEn: Date }

/**
 * Las pruebas primero, de la más vieja a la más nueva; después las demás, repartidas por
 * dueño: una de cada uno por vuelta, en el orden en que llegó la primera de cada dueño, y dentro
 * de un dueño de la más vieja a la más nueva.
 */
export function ordenarFila<T extends EnFila>(comandas: readonly T[]): T[] {
  const porFecha = [...comandas].sort((a, b) => a.creadaEn.getTime() - b.creadaEn.getTime() || a.id.localeCompare(b.id))
  const pruebas = porFecha.filter((c) => c.tipo === 'prueba')
  const resto = porFecha.filter((c) => c.tipo !== 'prueba')

  const porDueno = new Map<string, T[]>()
  for (const c of resto) {
    const lista = porDueno.get(c.ownerId) ?? []
    lista.push(c)
    porDueno.set(c.ownerId, lista)
  }
  const repartidas: T[] = []
  const colas = [...porDueno.values()]
  for (let vuelta = 0; colas.some((cola) => cola.length > vuelta); vuelta++) {
    for (const cola of colas) if (cola[vuelta]) repartidas.push(cola[vuelta]!)
  }
  return [...pruebas, ...repartidas]
}
