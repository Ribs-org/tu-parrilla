import { sql, type AnyColumn, type SQL } from 'drizzle-orm'

/**
 * La prioridad del plan que rige para el dueño `ownerId` —una columna o una expresión que dé su id—,
 * para ordenar las colas con `desc(...)`: el chef, la publicación, los comentarios y el sync. Es la
 * misma regla que `claveQueRige` (`plan.ts`), en SQL: el plan escrito si no es el gratis y no
 * venció; si no, el gratis. Un dueño que no existe ordena como 0.
 */
export function prioridadDelDueno(ownerId: AnyColumn | SQL): SQL<number> {
  return sql<number>`coalesce((
    select p.prioridad from users u
    join planes p on p.clave = case
      when u.plan <> 'gratis' and (u.plan_hasta is null or u.plan_hasta > now()) then u.plan
      else 'gratis'
    end
    where u.id = ${ownerId}
  ), 0)`.mapWith(Number)
}
