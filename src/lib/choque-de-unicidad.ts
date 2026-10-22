/**
 * Si un error de la base es un choque con una restricción de unicidad en particular (23505).
 * La comparten los cinco sitios que reaccionan a uno: el slug de una página al invitar o
 * adoptar (`usuarios.ts`, `scripts/migrar.ts`), la etiqueta de campaña al sincronizar
 * (`social/sync.ts`), la `ref` de una fila del lote (`social/publish/batch.ts`) y la de un
 * creativo de la cocina (`cocina/cocina.ts`).
 *
 * Fue una sola función porque las copias fallaban igual y en silencio: hasta el 2026-09-24
 * hubo tres detectores de este choque escritos de tres formas, y ninguno podía devolver `true`.
 * Lo que hay que saber para reconocer un error de Postgres en este proyecto:
 *
 * - **El campo es `constraint_name`**, que es lo que expone el driver, `postgres` (postgres-js;
 *   ver `node_modules/postgres/src/connection.js:46`). `constraint` es el de `node-postgres`,
 *   que no es el driver de acá; se mira igual, por si alguna capa lo normaliza.
 * - **Drizzle envuelve toda consulta fallida** en `DrizzleQueryError` y deja el error del driver
 *   en `cause` (`drizzle-orm/errors.cjs`, `pg-core/session.js`), así que se mira en los dos
 *   niveles. Una consulta del driver crudo, sin Drizzle, trae los campos arriba.
 * - **Se compara el nombre de la restricción, no solo el código**: otro choque de unicidad —de
 *   otra columna, de una restricción que se agregue mañana— tiene que propagarse, no tomarse por
 *   este.
 * - **Comparar contra el texto del mensaje no funciona y no falla**: el mensaje de Drizzle es
 *   `Failed query: <sql>`, así que devuelve `false` y el camino alternativo simplemente no
 *   ocurre. Las pruebas usan la forma real del driver envuelta por Drizzle, porque una que arma
 *   `{ code, constraint }` a mano pasa con la función rota.
 */
export function esChoqueCon(error: unknown, restriccion: string): boolean {
  const coincide = (candidato: unknown): boolean => {
    const { code, constraint_name, constraint } =
      (candidato as { code?: string; constraint_name?: string; constraint?: string } | null) ?? {}
    return code === '23505' && (constraint_name ?? constraint) === restriccion
  }
  // Sin `instanceof Error` delante, a propósito: descartaría un `cause` que no fuera un `Error`.
  return coincide(error) || coincide((error as { cause?: unknown } | null)?.cause)
}
