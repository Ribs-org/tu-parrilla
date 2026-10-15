import { beforeEach, describe, expect, it, vi } from 'vitest'

// `canjear` en el SQL que de verdad arma Drizzle, sin base: el mismo arnés que
// `aislamiento.test.ts` (ver su cabecera), con un cliente de `postgres` que anota cada
// consulta y contesta lo que el test puso en la cola. Lo que se prueba es el orden y la
// forma de las sentencias —que el intento se gaste en una sola, con el tope adentro, antes
// de comparar—, porque eso es lo que cierra la carrera de muchos intentos a la vez.
vi.mock('server-only', () => ({}))

type Captura = { sql: string; params: unknown[] }
const capturas: Captura[] = []
const cola: unknown[] = []

function respuesta() {
  const entregar = () =>
    cola.length > 0 ? Promise.resolve(cola.shift()) : Promise.reject(new Error('canjear.test: sin red, a propósito'))
  return {
    then: (ok?: never, err?: never) => entregar().then(ok, err),
    catch: (err?: never) => entregar().catch(err),
    finally: (fin?: never) => entregar().finally(fin),
    values: () => entregar(),
  }
}

vi.mock('postgres', () => ({
  default: () => {
    const cliente = () => {
      throw new Error('canjear.test: solo unsafe()')
    }
    cliente.unsafe = (sqlText: string, params: unknown[] = []) => {
      capturas.push({ sql: sqlText, params })
      return respuesta()
    }
    cliente.options = { parsers: {}, serializers: {} }
    cliente.end = async () => {}
    return cliente
  },
}))

process.env.DATABASE_URL = 'postgres://usuario:clave@host/base'
process.env.AUTH_SECRET = 'secreto-de-prueba-para-el-arnes'

const { canjear, claveCodigos } = await import('./usuarios')
const { hashCodigo, CODIGO_INCORRECTO, DEMASIADOS_FALLOS, DEMASIADOS_INTENTOS, MAX_FALLOS_POR_DIA, MAX_INTENTOS } =
  await import('./ingreso')

beforeEach(() => {
  capturas.length = 0
  cola.length = 0
})

const CORREO = 'persona@example.com'
const CODIGO = '123456'
const ahora = new Date()

// Las filas van como Drizzle las pide al driver: valores en el orden de las columnas.
const USUARIO = ['u-1', CORREO, null, 'usuario', 'America/Santiago', 1, ahora, ahora, ahora, ahora]
function filaCodigo(intentos = 0) {
  return ['c-1', 'u-1', hashCodigo(CODIGO, claveCodigos()), new Date(ahora.getTime() + 60_000), null, intentos, ahora]
}

/** Las respuestas de cada paso, en orden: usuario, fallos del día, código vivo, gastar, marcar usado, primer ingreso. */
function camino({ fallos = 0, intentos = 0, gastado = [[intentos + 1]] as unknown[], usada = [['c-1']] as unknown[] } = {}) {
  cola.push([USUARIO], [[fallos]], [filaCodigo(intentos)], gastado, usada, [])
}

describe('canjear', () => {
  it('gasta el intento antes de comparar, en una sola sentencia con el tope adentro', async () => {
    camino()
    const resultado = await canjear(CORREO, CODIGO)
    expect('usuario' in resultado).toBe(true)

    const gastar = capturas[3]!
    expect(gastar.sql).toMatch(/^update "codigos_ingreso" set "intentos" = .*"intentos" \+ 1/)
    expect(gastar.sql).toMatch(/"usado_en" is null/)
    expect(gastar.sql).toMatch(/"intentos" < \$\d+/)
    expect(gastar.params).toContain(MAX_INTENTOS)
  })

  it('al acertar devuelve el intento y marca el código usado solo si nadie lo usó antes', async () => {
    camino()
    await canjear(CORREO, CODIGO)
    const marcar = capturas[4]!
    expect(marcar.sql).toMatch(/^update "codigos_ingreso" set "usado_en" = \$\d+, "intentos" = .*"intentos" - 1/)
    expect(marcar.sql).toMatch(/"usado_en" is null/)
  })

  it('si otro intento se llevó el último, no compara aunque el código sea el bueno', async () => {
    camino({ gastado: [] })
    expect(await canjear(CORREO, CODIGO)).toEqual({ error: DEMASIADOS_INTENTOS })
    expect(capturas).toHaveLength(4)
  })

  it('un código equivocado gasta su intento y no marca nada', async () => {
    camino({ intentos: 1 })
    expect(await canjear(CORREO, '654321')).toEqual({ error: CODIGO_INCORRECTO })
    expect(capturas).toHaveLength(4)
  })

  it('el intento que agota el código ya lo dice', async () => {
    camino({ intentos: MAX_INTENTOS - 1 })
    expect(await canjear(CORREO, '654321')).toEqual({ error: DEMASIADOS_INTENTOS })
  })

  it('dos canjes del mismo código a la vez: el segundo no abre sesión', async () => {
    camino({ usada: [] })
    expect(await canjear(CORREO, CODIGO)).toEqual({ error: CODIGO_INCORRECTO })
    expect(capturas).toHaveLength(5)
  })

  it('con el tope de fallos del día, ni busca el código: tampoco el correcto entra', async () => {
    camino({ fallos: MAX_FALLOS_POR_DIA })
    expect(await canjear(CORREO, CODIGO)).toEqual({ error: DEMASIADOS_FALLOS })
    expect(capturas).toHaveLength(2)
    const fallos = capturas[1]!
    expect(fallos.sql).toMatch(/from "codigos_ingreso"/)
    expect(fallos.sql).toMatch(/sum\("intentos"\)/)
    expect(fallos.sql).toMatch(/"user_id" = \$\d+ and "codigos_ingreso"\."created_at" > \$\d+/)
    expect(fallos.params).toContain('u-1')
  })

  it('un fallo menos que el tope todavía deja entrar', async () => {
    camino({ fallos: MAX_FALLOS_POR_DIA - 1 })
    expect('usuario' in (await canjear(CORREO, CODIGO))).toBe(true)
  })
})
