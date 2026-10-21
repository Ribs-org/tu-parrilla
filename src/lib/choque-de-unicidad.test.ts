import { DrizzleQueryError } from 'drizzle-orm/errors'
import postgres from 'postgres'
import { describe, expect, it } from 'vitest'
import { esChoqueCon } from './choque-de-unicidad'

// Con las clases de verdad, no con objetos armados a mano: el error que lanza el driver
// (`PostgresError`, con `constraint_name`) y el envoltorio con que Drizzle lo entrega
// (`DrizzleQueryError`, con el original en `cause`). Una prueba con `{ code, constraint }`
// pasaba con los tres detectores rotos.
const delDriver = (restriccion: string, code = '23505') =>
  new postgres.PostgresError({ message: 'duplicate key value violates unique constraint', code, constraint_name: restriccion } as never)
const deDrizzle = (causa: unknown) => new DrizzleQueryError('insert into "profiles" …', [], causa as Error)

describe('esChoqueCon', () => {
  it('reconoce el choque envuelto por Drizzle, que es como llega casi siempre', () => {
    expect(esChoqueCon(deDrizzle(delDriver('profiles_slug_unique')), 'profiles_slug_unique')).toBe(true)
  })

  it('reconoce el choque del driver crudo, sin Drizzle (scripts/migrar.ts)', () => {
    expect(esChoqueCon(delDriver('profiles_slug_unique'), 'profiles_slug_unique')).toBe(true)
  })

  it('otra restricción de unicidad no es esta: tiene que propagarse', () => {
    expect(esChoqueCon(deDrizzle(delDriver('social_posts_campaign_unique')), 'profiles_slug_unique')).toBe(false)
  })

  it('otro código con el mismo nombre de restricción tampoco', () => {
    expect(esChoqueCon(deDrizzle(delDriver('profiles_slug_unique', '23503')), 'profiles_slug_unique')).toBe(false)
  })

  it('el mensaje de Drizzle no dice nada: un error cualquiera no es un choque', () => {
    expect(esChoqueCon(deDrizzle(new Error('la base no responde')), 'profiles_slug_unique')).toBe(false)
  })

  it('no revienta sin error ni causa', () => {
    for (const raro of [null, undefined, 'texto', 42, {}]) expect(esChoqueCon(raro, 'profiles_slug_unique')).toBe(false)
  })
})
