import { sql, type AnyColumn, type SQL } from 'drizzle-orm'

/**
 * `columna = any($1::uuid[])`: la lista de ids viaja en un solo parámetro, un arreglo, y no
 * en uno por id como con `inArray`. Postgres acepta hasta 65 535 parámetros por consulta, y una
 * lista que crece con el historial —los posts de un dueño, los de una baja de Meta— termina
 * pasándolo: la consulta no se rechaza de a poco, se rechaza entera.
 */
export function enIds(columna: AnyColumn, ids: readonly string[]): SQL {
  return sql`${columna} = any(${sql.param(ids)}::uuid[])`
}
