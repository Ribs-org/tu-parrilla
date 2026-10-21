// Las pruebas de integración: las que corren el SQL de verdad contra una Postgres, en vez de
// simular el cliente. Solo corren si hay una base para eso (`DATABASE_URL_PRUEBAS`): el CI la
// levanta como servicio en el job `sitio`, y en local se puede apuntar a cualquier Postgres
// desechable. Sin la variable, cada archivo de integración se salta entero.
//
// Cada archivo recibe su propia base, recién creada y migrada desde `drizzle/`: los archivos
// corren en paralelo, y dos que compartieran una se pisarían las filas. Migrar de cero es
// también la prueba de que las migraciones se aplican en una base vacía, que antes se veía
// recién en el build de producción.

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

/** La Postgres de las pruebas; sin ella, las pruebas de integración se saltan. */
export const URL_PRUEBAS = process.env.DATABASE_URL_PRUEBAS

/**
 * Crea (o recrea) la base `nombre` en el servidor de `URL_PRUEBAS`, le aplica todas las
 * migraciones y apunta `DATABASE_URL` a ella, para que `getDb()` la use. Se llama en el
 * `beforeAll` del archivo, antes de la primera consulta: `getDb()` arma su cliente la primera
 * vez que se lo pide.
 */
export async function prepararBase(nombre: string): Promise<string> {
  if (!URL_PRUEBAS) throw new Error('Falta DATABASE_URL_PRUEBAS')
  if (!/^[a-z_][a-z0-9_]*$/.test(nombre)) throw new Error(`Nombre de base inválido: ${nombre}`)

  const admin = postgres(URL_PRUEBAS, { max: 1, onnotice: () => {} })
  try {
    await admin.unsafe(`drop database if exists ${nombre} with (force)`)
    await admin.unsafe(`create database ${nombre}`)
  } finally {
    await admin.end()
  }

  const url = new URL(URL_PRUEBAS)
  url.pathname = `/${nombre}`
  const direccion = url.toString()

  const sql = postgres(direccion, { max: 1, onnotice: () => {} })
  try {
    await migrate(drizzle(sql), { migrationsFolder: 'drizzle' })
  } finally {
    await sql.end()
  }

  process.env.DATABASE_URL = direccion
  return direccion
}
