import { beforeEach, describe, expect, it, vi } from 'vitest'

// `npm test` corre en CI sin `DATABASE_URL`: este archivo no puede necesitar una base.
//
// `getDb()` (en `src/db`) construye su cliente con `drizzle(postgres(DATABASE_URL))`, y ni
// `postgres()` ni `drizzle()` abren una conexión por sí solos — solo la abren al ejecutar una
// consulta. Así que este test deja pasar una `DATABASE_URL` falsa, sustituye el cliente de
// `postgres` (postgres-js) por uno que nunca sale a la red y se limita a anotar el SQL y los
// parámetros que Drizzle le habría mandado, y llama a las funciones reales del módulo. Cada una revienta al llegar a la "red" (a propósito) salvo que la consulta
// tenga una respuesta programada (ver `colaRespuestas`), que es lo que hace falta para
// que una función que encadena varias consultas alcance a construir la segunda, la
// tercera, etc. — antes de eso, con todo rechazando siempre, la primera consulta frenaba
// a la función y `capturas` nunca pasaba de un elemento.
//
// `import 'server-only'` tampoco resuelve bajo Vitest (el paquete no está en
// `node_modules`; solo lo entiende el bundler de Next), así que se sustituye por un
// módulo vacío para poder importar los módulos reales sin arrastrar esa barrera.
vi.mock('server-only', () => ({}))

// Las tres acciones de escritura que este archivo también cubre viven en
// `src/app/admin/actions.ts`, un archivo `'use server'` que usa `next/headers`,
// `next/cache` y `next/navigation` fuera de una petición real, y que se autentica con
// `requireUser`. Nada de eso es lo que este archivo verifica (eso lo prueba, si acaso,
// un test de esas rutas); acá solo importa que la función reciba el `ownerId` de
// `requireUser` y lo ate a cada consulta, así que se sustituyen por lo mínimo que hace
// falta para que el módulo cargue y la función corra.
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))
vi.mock('next/navigation', () => ({
  redirect: () => {
    throw new Error('aislamiento.test: redirect() no debía llamarse en este caso')
  },
}))
vi.mock('next/headers', () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }) }))
vi.mock('@/lib/auth', () => ({
  requireUser: async () => USUARIO,
  requireAdmin: async () => USUARIO,
  destroySession: async () => {},
}))
// La Tarea 7 suma la primera ruta móvil a este archivo: el guardia del teléfono no lee
// la petición que le pasa el test, así que una `Request` cualquiera sirve.
vi.mock('@/lib/mobile-guardia', () => ({ requireMobileUser: async () => USUARIO }))

type Captura = { sql: string; params: unknown[] }
const capturas: Captura[] = []

/**
 * Respuestas programadas para consultas sucesivas de una misma función, en orden. Una
 * función que encadena varias consultas (la fila que decide si sigue, o el resultado que
 * usa la consulta siguiente) necesita que las que la preceden se resuelvan de verdad, no
 * que rechacen: si no hay respuesta en la cola, la consulta rechaza igual que siempre.
 */
const colaRespuestas: unknown[] = []

/**
 * El cliente falso. `drizzle-orm/postgres-js` le pide dos cosas al construirse y una al
 * consultar:
 *
 *  - `options.parsers` y `options.serializers`, donde escribe sus conversores de fecha
 *    apenas se construye — si no existen, `drizzle()` revienta antes del primer test.
 *  - `unsafe(sql, params)`, que devuelve algo que se puede esperar *y* que además tiene
 *    `.values()`: Drizzle usa la primera forma cuando no mapea columnas y la segunda
 *    cuando sí. Las dos entregan la misma respuesta de la cola, una sola vez.
 *
 * La captura ocurre al construir la consulta, no al esperarla, que es lo que permite ver
 * todas las que una función alcanza a armar antes de que la primera sin respuesta la frene.
 */
function respuesta() {
  const entregar = () =>
    colaRespuestas.length > 0
      ? Promise.resolve(colaRespuestas.shift())
      : Promise.reject(new Error('aislamiento.test: sin red, a propósito'))
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
      throw new Error('aislamiento.test: este test no usa el tagged template, solo unsafe()')
    }
    cliente.unsafe = (sqlText: string, params: unknown[] = []) => {
      capturas.push({ sql: sqlText, params })
      return respuesta()
    }
    cliente.options = { parsers: {}, serializers: {} }
    cliente.end = async () => {}
    // `db.transaction()` de postgres-js pide `client.begin(fn)` (ver
    // `drizzle-orm/postgres-js/session`), no `unsafe()` directo. Este test no verifica
    // atomicidad de verdad (eso lo cubre `actions.test.ts`), solo que las consultas de
    // adentro también queden atadas al dueño — así que basta con correr el callback con el
    // mismo cliente, sin BEGIN/COMMIT reales.
    cliente.begin = async (fn: (client: typeof cliente) => Promise<unknown>) => fn(cliente)
    return cliente
  },
}))

process.env.DATABASE_URL = 'postgres://usuario:clave@host/base'
// `guardarCuenta` cifra el token antes de escribirlo, y `encryptToken` deriva su llave de
// `AUTH_SECRET`. Sin esto, la función revienta antes de construir ninguna consulta.
process.env.AUTH_SECRET = 'secreto-de-prueba-para-el-arnes'

// Import estático, después de los `vi.mock`: Vitest los sube al principio del archivo al
// transformarlo, así que el orden de las líneas no importa, pero un import dinámico dentro
// de cada `it` sí importa —cada uno paga otra vez la transformación de todo lo que carga
// (drizzle-orm, postgres, …), y bajo carga esa primera transformación puede no alcanzar a
// terminar antes de `testTimeout`. Mismo motivo que en `usuarios.test.ts` (ver el
// comentario de sus líneas 50-54).
const { getRecentVisits } = await import('./analytics')
const { getCuentas, getLecturasDe, getPostRows } = await import('./posts')
const { contarEnlacesPorPagina, getAllProfiles, getProfileBySlug } = await import('./profiles')
const { getCola, getComentariosQueFaltan } = await import('./comentarios-cola')
const { verificarCuentas, cuentaUnicaPorRed } = await import('./social/cuentas')
const { cuentaDeMusica } = await import('./musica-instagram')
const { playlistsDeLaCuenta } = await import('./playlists-youtube')
const { playlistsAccion } = await import('@/app/admin/playlists-actions')
const { esperaALaAnterior } = await import('./social/publish/secuencia')
const { todosLosCortes, cortesEntre, cortesQuemados, horasPorVenir, servidosAyer } = await import(
  './social/publish/cortes'
)
const { quitarCuenta, CUENTA_CONECTADA } = await import('./social/quitar')
const { vincularSinId } = await import('./social/vincular-sin-id')
const { listarBorradores, cargarBorrador, guardarBorrador, borrarBorrador } = await import('./borradores')
const { cuentasParaElTelefono } = await import('./borradores-movil')
const { creadorDeCuenta, recordarMusicaTikTok } = await import('./social/publish/tiktok-cuenta')
const { cuentaTiktokDelDueno } = await import('./social/tiktok-numeros-guardar')
const { leerAjuste } = await import('./ajustes')
const { leerLoPagado, tieneAnuncios } = await import('./lo-pagado')
const { leerProgramados } = await import('./schedule-leer')
const { numerosDeLosCortes } = await import('./lo-que-trajo')
const { celebrar, hitosDeLosCortes, porCelebrar } = await import('./hitos')
const { leerRacha } = await import('./racha')
const { loDeHoy } = await import('./push/bueno')
const { listarLlaves, crearLlave } = await import('./llaves')
const { leerResumen } = await import('./avisos/run')
const { archivarQuemados, archivarDestino } = await import('./social/publish/archivar')
const { CONSERVAR, editarPostProgramado } = await import('./social/publish/editar')
const { postParaEditarEnElTelefono } = await import('./editar-movil')
const { recibirSugerencia } = await import('./sugerencias/guardar')
const { misSugerencias, respuestasSinLeer, marcarRespuestaLeida } = await import('./sugerencias/responder')
const { materialesDeLaCamara, editarMaterial, sacarMaterial } = await import('./cocina/materiales')
const { usoDeLaCamara } = await import('./cocina/subidas')
const { pedirComanda } = await import('./cocina/pedir')
const { makeDefault, updateProfile, deleteScheduledPost, guardarCuenta, guardarTema, revocarLlaveApi } = await import(
  '@/app/admin/actions'
)
// `guardarCuenta` son dos funciones distintas con el mismo nombre: la de `admin/actions`
// guarda la cuenta *del usuario* y la de `social/conectar`, una cuenta *de una red*.
const { guardarCuenta: guardarCuentaDeRed, tomadasPorOtro } = await import('./social/conectar')
const { cuentasConectadas, esperandoEnLaParrilla, planDe, tokensDelMes } = await import('./planes/planes')
const { suscripcionVivaDe } = await import('./pagos/suscripciones')
const {
  contarFilas,
  leerClicks,
  leerComentarios,
  leerEtiquetas,
  leerLecturas,
  leerProgramado,
  leerSeguidores,
  leerVisitas,
  publicacionesDeEtiquetas,
  youtubeVencido,
} = await import('./planilla/leer')

beforeEach(() => {
  capturas.length = 0
  colaRespuestas.length = 0
})

const DUENO = 'owner-1'

/**
 * Lo que contesta la base cuando algo pregunta por el plan de un dueño (`planDe`): su fila —plan,
 * hasta, origen, cámara a mano, zona y prueba— y las dos filas de `planes`, que son de todos.
 */
const PERSONA_GRATIS = [['gratis', null, null, null, 'America/Santiago', null]]
const PLANES = [
  ['gratis', 'Gratis', 0, 0, 7, 50, 21474836480, 100000, 0],
  ['pagado', 'Maestro Parrillero', 34990, 7, 15, null, 214748364800, 2000000, 1],
]

const USUARIO = {
  id: DUENO,
  correo: 'dueno@example.com',
  nombre: null,
  rol: 'usuario' as const,
  zona: 'America/Santiago',
  tema: 'noche' as const,
  sesionVersion: 1,
  invitadoEn: new Date('2026-01-01'),
  primerIngresoEn: new Date('2026-01-01'),
  cocinaDesde: null,
  bodegaBytes: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
}

/**
 * Llama a la función real, deja que reviente contra la "red" falsa y devuelve TODAS las
 * consultas que alcanzó a construir (no solo la primera: el punto ciego que tenía este
 * archivo era mirar solo `capturas[0]`, que para una función de una sola consulta da lo
 * mismo, pero deja sin mirar a cualquier otra que la función alcance a construir antes de
 * que la que rechaza la frene). Si la función no llega a consultar nada, no hay captura y
 * el `expect` de abajo lo delata: un test que no puede fallar no sirve.
 */
async function todasLasConsultas(llamada: () => Promise<unknown>): Promise<Captura[]> {
  await expect(llamada()).rejects.toThrow()
  expect(capturas.length).toBeGreaterThan(0)
  return capturas.slice()
}

/**
 * Como `todasLasConsultas`, pero para una función que encadena varias consultas donde
 * cada una depende del resultado de la anterior (una fila que decide si sigue, o un id
 * que la siguiente consulta necesita). `respuestas` son las que hacen falta para que la
 * función avance más allá de la primera; la que se queda sin respuesta en la cola
 * revienta igual que siempre, y si la cola alcanza para todas la función simplemente
 * termina — de cualquier modo, lo único que importa es qué alcanzó a construir.
 */
async function consultasEncadenadas(
  llamada: () => Promise<unknown>,
  respuestas: unknown[] = [],
): Promise<Captura[]> {
  colaRespuestas.push(...respuestas)
  await llamada().catch(() => undefined)
  expect(capturas.length).toBeGreaterThan(0)
  return capturas.slice()
}

/**
 * owner_id como parámetro ligado de verdad, no solo como texto en el SQL: una columna
 * seleccionada también se llama "owner_id" y por sí sola no prueba ningún filtro.
 *
 * Y el predicado tiene que caer en la cláusula WHERE, no en el ON de un leftJoin: un
 * leftJoin con la condición en el ON no filtra nada, devuelve todas las filas con las
 * columnas del padre en NULL (así falló `getTopLinks` una vez en esta rama). Por eso se
 * corta el SQL en el último "where" y se busca el predicado solo en lo que queda:
 * - Consulta simple, un único WHERE: lo que queda es esa cláusula entera. Acepta.
 * - Subconsulta legítima dentro del WHERE (el patrón
 *   `inArray(hija.padreId, select … where owner_id = $)`): el "where" de la
 *   subconsulta es el más a la derecha del texto, así que lo que queda es justo su
 *   condición — sigue siendo parte del WHERE exterior. Acepta.
 * - Condición movida al ON de un leftJoin: el ON queda *antes* del "where" (o, si la
 *   consulta no tiene ningún WHERE propio, no hay "where" que cortar). En ningún caso
 *   aparece en lo que queda tras el corte. Rechaza.
 */
function esperarFiltradoPorDueno({ sql, params }: Captura) {
  expect(params).toContain(DUENO)
  const partes = sql.split(/\bwhere\b/i)
  expect(partes.length).toBeGreaterThan(1) // tiene que existir al menos un WHERE real.
  expect(partes.pop()).toMatch(/"owner_id"\s*=\s*\$/)
}

/** Una petición cualquiera: `requireMobileUser` está simulado y no la mira. */
function peticionMovil(cabeceras: Record<string, string> = {}): Request {
  return new Request('https://ejemplo.cl/api/mobile/schedule/accounts', { headers: cabeceras })
}

describe('aislamiento por dueño (SQL generado, sin base)', () => {
  it('analytics: getRecentVisits filtra las visitas por el dueño del perfil', async () => {
    const consultas = await todasLasConsultas(() =>
      getRecentVisits({
        ownerId: DUENO,
        zone: 'Europe/Madrid', // distinta del default del sitio: el doble no debe coincidir con la constante.
        profileId: null,
        from: new Date('2026-01-01'),
        to: new Date('2026-01-31'),
        includeBots: true,
      }),
    )
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('posts: getCuentas filtra las cuentas por dueño', async () => {
    const consultas = await todasLasConsultas(() => getCuentas(DUENO))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('profiles: getAllProfiles filtra los perfiles por dueño', async () => {
    const consultas = await todasLasConsultas(() => getAllProfiles(DUENO))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  /**
   * Sin `ownerId`, `getProfileBySlug` tiene que seguir sirviendo el perfil de «círculo
   * cercano» del dueño, compartido por dirección secreta desde su propio dominio: ese
   * camino no puede quedar acotado a nadie. Por eso este caso comprueba justo lo
   * contrario que `esperarFiltradoPorDueno`, que exige el filtro.
   */
  it('profiles: getProfileBySlug sin ownerId no filtra por dueño (el círculo cercano sigue andando)', async () => {
    const consultas = await todasLasConsultas(() => getProfileBySlug('la-direccion-secreta'))
    expect(consultas).toHaveLength(1)
    const [{ sql, params }] = consultas as [Captura]
    expect(params).not.toContain(DUENO)
    // Solo el WHERE importa acá: las columnas seleccionadas incluyen "owner_id" igual,
    // así que el filtro de verdad se busca donde vive, no en la lista de columnas.
    expect(sql.split(/\bwhere\b/i).pop()).not.toMatch(/"owner_id"/)
  })

  it('profiles: getProfileBySlug con ownerId solo devuelve la fila si es de ese dueño', async () => {
    const consultas = await todasLasConsultas(() => getProfileBySlug('juanito', DUENO))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  /**
   * `ownerId` es un `string | undefined`: una cadena vacía es un valor válido de ese tipo,
   * no la ausencia del argumento. El filtro tiene que reaccionar a que el llamador haya
   * pasado algo, no a si ese algo es "verdadero" — `ownerId ? … : …` trataría `''` igual
   * que "no lo pasaron" y dejaría la consulta sin acotar. Hoy `adminId()` nunca devuelve
   * `''` (da un uuid o lanza), así que este caso es inalcanzable en producción, pero es la
   * línea exacta de la que depende todo el aislamiento de esta tarea.
   */
  it('profiles: getProfileBySlug con ownerId "" también filtra (presencia, no verdad)', async () => {
    const consultas = await todasLasConsultas(() => getProfileBySlug('juanito', ''))
    expect(consultas).toHaveLength(1)
    const [{ sql, params }] = consultas as [Captura]
    expect(params).toContain('')
    expect(sql.split(/\bwhere\b/i).pop()).toMatch(/"owner_id"\s*=\s*\$/)
  })

  it('comentarios-cola: getCola filtra por el dueño de la cuenta', async () => {
    const consultas = await todasLasConsultas(() => getCola(DUENO, { estado: 'pendientes', red: null }))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('comentarios-cola: getComentariosQueFaltan filtra por el dueño de la cuenta', async () => {
    const consultas = await todasLasConsultas(() => getComentariosQueFaltan(DUENO))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('social/cuentas: verificarCuentas ata la consulta al dueño', async () => {
    const consultas = await todasLasConsultas(() => verificarCuentas(DUENO, ['cuenta-1']))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('musica-instagram: cuentaDeMusica solo usa una cuenta del dueño (buscar, escuchar y sugerir pasan por acá)', async () => {
    const consultas = await todasLasConsultas(() => cuentaDeMusica(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('playlists-youtube: playlistsDeLaCuenta solo usa un canal del dueño (el compositor y el teléfono pasan por acá)', async () => {
    const consultas = await todasLasConsultas(() => playlistsDeLaCuenta(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('admin/playlists-actions: playlistsAccion ata la cuenta al dueño de la sesión', async () => {
    const consultas = await todasLasConsultas(() => playlistsAccion('6f1c2a54-9b1e-4c3d-8f00-0123456789ab'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('api/mobile/youtube/playlists: GET solo lee un canal del dueño del token', async () => {
    const { GET } = await import('../app/api/mobile/youtube/playlists/route')
    const consultas = await todasLasConsultas(() =>
      GET(new Request('https://ejemplo.cl/api/mobile/youtube/playlists?cuenta=6f1c2a54-9b1e-4c3d-8f00-0123456789ab')),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('social/publish/secuencia: esperaALaAnterior busca la historia anterior atada al dueño del post', async () => {
    const consultas = await todasLasConsultas(() =>
      esperaALaAnterior(DUENO, 'cuenta-1', { secuencia: 'abc', orden: 2 }),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('social/cuentas: cuentaUnicaPorRed ata la consulta al dueño', async () => {
    const consultas = await todasLasConsultas(() => cuentaUnicaPorRed(DUENO, ['instagram']))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * Posts + destinos + handle en una consulta, y la media en otra por los ids que esa ya
   * filtró (mismo criterio que `post_metrics` en `getPostRows`). Sin filas, la de media no
   * se construye: por eso el caso ve una sola consulta.
   */
  it('social/publish/cortes: todosLosCortes ata su consulta al dueño', async () => {
    const consultas = await todasLasConsultas(() => todosLosCortes(DUENO))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  /**
   * Las lecturas con ventana de La Parrilla: la semana o el día, lo quemado y la hora de lo que
   * viene. La subconsulta de `cortesQuemados` y la de `horasPorVenir` no llevan dueño propio
   * —van por el post de afuera—, así que el dueño tiene que quedar al final del `where` de
   * afuera, después de ellas.
   */
  it('social/publish/cortes: las lecturas con ventana atan su consulta al dueño', async () => {
    for (const leer of [
      () => cortesEntre(DUENO, new Date('2026-10-18T03:00:00Z'), new Date('2026-10-27T03:00:00Z')),
      () => cortesQuemados(DUENO),
      () => horasPorVenir(DUENO, new Date('2026-10-21T12:00:00Z')),
    ]) {
      capturas.length = 0
      const consultas = await todasLasConsultas(leer)
      expect(consultas).toHaveLength(1)
      esperarFiltradoPorDueno(consultas[0]!)
    }
  })

  it('profiles: contarEnlacesPorPagina cuenta solo los enlaces de las páginas del dueño', async () => {
    const consultas = await todasLasConsultas(() => contarEnlacesPorPagina(DUENO))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * Los borradores: la lista y la carga de uno atan su lectura al dueño; la media de la
   * lista va por los ids que esa lectura ya filtró (`borrador_media` no tiene dueño propio).
   */
  it('borradores: listarBorradores filtra por dueño, y su media va por los ids ya filtrados', async () => {
    const consultas = await consultasEncadenadas(() => listarBorradores(DUENO), [
      [['borrador-1', {}, null, new Date('2026-01-01')]],
    ])
    expect(consultas).toHaveLength(2)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[1]!.params).toContain('borrador-1')
  })

  it('borradores: cargarBorrador solo devuelve el borrador si es del dueño', async () => {
    const consultas = await consultasEncadenadas(() => cargarBorrador(DUENO, 'borrador-x'))
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain('borrador-x')
  })

  /**
   * `servidosAyer` encadena tres consultas: los destinos publicados ayer (atada al
   * dueño), los `social_posts` que cruzan por `external_id` (atada al dueño) y las
   * métricas de esos posts (`post_metrics` no tiene columna de dueño, así que va por
   * los ids que la consulta anterior ya filtró — mismo criterio que `getPostRows` más
   * arriba). Con un destino publicado y un post que cruza, la tercera consulta se
   * queda sin respuesta y revienta ahí, que es lo único que hace falta para verla.
   */
  it('social/publish/cortes: servidosAyer ata sus tres consultas al dueño, directo o por el id que ya filtró la anterior', async () => {
    // Cada fila es un arreglo de valores en el orden del `select`, no un objeto: la
    // primera consulta selecciona `postId, network, externalId` y la segunda
    // `id, network, externalId` — mismo formato que `filaPost` más abajo. La red tiene
    // que coincidir, o el cruce `red:externalId` descarta el post y no hay tercera.
    const consultas = await consultasEncadenadas(
      () => servidosAyer(DUENO, new Date('2026-01-02T12:00:00Z'), 'America/Santiago'),
      [[['post-1', 'instagram', 'ext-1']], [['social-post-1', 'instagram', 'ext-1']]],
    )
    expect(consultas).toHaveLength(3)
    const [destinos, posts, metricas] = consultas as [Captura, Captura, Captura]
    esperarFiltradoPorDueno(destinos)
    esperarFiltradoPorDueno(posts)
    expect(metricas.params).toContain('social-post-1') // post_metrics: por el id que ya filtró `posts`.
  })

  it('avisos/run: leerResumen ata sus cinco consultas al dueño: quemados, cuentas, cuentas en uso, lo último por salir y lo que vence en el mesón', async () => {
    // Sin nada por vencer en el mesón, no pregunta los nombres de las comandas: son cinco.
    const consultas = await consultasEncadenadas(() => leerResumen(DUENO, new Date('2026-10-17T12:00:00Z')), [[], [], [], [], []])
    expect(consultas).toHaveLength(5)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('lo-que-trajo: numerosDeLosCortes ata al dueño las publicaciones, la marca, las visitas y los comentarios de YouTube', async () => {
    // Un corte ya leído del dueño, con un destino en Instagram y otro en YouTube.
    const destino = { postId: 'post-1', status: 'published', opciones: null, lastError: null, handle: null }
    const corte = {
      post: { id: 'post-1', scheduledAt: new Date('2026-11-10T12:00:00Z') },
      targets: [
        { ...destino, id: 'd-ig', network: 'instagram', accountId: 'cuenta-ig', externalId: 'ig-1' },
        { ...destino, id: 'd-yt', network: 'youtube', accountId: 'cuenta-yt', externalId: 'yt-1' },
      ],
      media: [],
    } as unknown as Parameters<typeof numerosDeLosCortes>[1][number]
    let resultado: Awaited<ReturnType<typeof numerosDeLosCortes>> = []
    const consultas = await consultasEncadenadas(
      async () => {
        resultado = await numerosDeLosCortes(DUENO, [corte])
      },
      [
        [['sp-ig', 'cuenta-ig', 'ig-1', 'ig-1'], ['sp-yt', 'cuenta-yt', 'yt-1', 'yt-1']],
        [['sp-ig', 100, 10, 2, null], ['sp-yt', 900, 50, 7, null]],
        [],
        [{ corte: 'post-1', nuevas: 2, total: 2 }],
        [{ corte: 'post-1', nuevos: 1 }],
      ],
    )
    expect(consultas).toHaveLength(5)
    const [publicaciones, lecturas, marcas, visitas, comentarios] = consultas as [Captura, Captura, Captura, Captura, Captura]
    esperarFiltradoPorDueno(publicaciones)
    expect(lecturas.params.flat()).toContain('sp-ig') // post_metrics: por los ids que ya filtró la anterior.
    esperarFiltradoPorDueno(marcas)
    // Las visitas, solo a páginas del dueño; los comentarios, solo de sus cuentas.
    esperarFiltradoPorDueno(visitas)
    expect(visitas.sql).toMatch(/from "profiles" where "profiles"."owner_id" = \$/)
    esperarFiltradoPorDueno(comentarios)
    expect(comentarios.sql).toMatch(/from "social_accounts" where "social_accounts"."owner_id" = \$/)
    // YouTube no entra en los «me gusta»; sus comentarios de La Mesa, sí.
    expect(resultado[0]!.nuevo).toEqual({ meGusta: 10, comentarios: 3, visitas: 2 })
  })

  it('hitos: hitosDeLosCortes, porCelebrar y celebrar atan los hitos al dueño, y el corte por celebrar también', async () => {
    esperarFiltradoPorDueno((await todasLasConsultas(() => hitosDeLosCortes(DUENO, ['post-1'])))[0]!)
    capturas.length = 0

    // porCelebrar: los hitos del dueño, las vistas de sus cortes del mes para ver cuáles son raros,
    // lo que no lo es queda resuelto, y después el corte de cada uno: todo por dueño.
    const porCelebrarSql = await consultasEncadenadas(() => porCelebrar(DUENO, new Date('2026-11-11T12:00:00Z')), [
      [['hito-1', 'post-1', 1000], ['hito-2', 'post-1', 100]],
      [{ post_id: 'post-2', vistas: 5000 }, { post_id: 'post-3', vistas: 500 }, { post_id: 'post-4', vistas: 50 }],
      [],
    ])
    expect(porCelebrarSql).toHaveLength(4)
    for (const consulta of porCelebrarSql) esperarFiltradoPorDueno(consulta)
    expect(porCelebrarSql[2]!.params.flat()).toContain('hito-2') // las 100, que no son raras.
    capturas.length = 0

    // celebrar: el hito tiene que ser del dueño, y lo que marca también va atado a él.
    const celebrarSql = await consultasEncadenadas(
      () => celebrar(DUENO, '6f1c2a4e-1b7d-4c3a-9e0f-2a5b8c7d9e10', new Date('2026-11-11T12:00:00Z')),
      [[['post-1', 1000]]],
    )
    expect(celebrarSql).toHaveLength(2)
    esperarFiltradoPorDueno(celebrarSql[0]!)
    esperarFiltradoPorDueno(celebrarSql[1]!)
  })

  it('push/bueno: loDeHoy suma solo las publicaciones de los cortes del dueño', async () => {
    const consultas = await todasLasConsultas(() => loDeHoy(DUENO, '2026-11-11'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('racha: leerRacha cuenta solo lo publicado del dueño', async () => {
    const consultas = await todasLasConsultas(() => leerRacha(DUENO, new Date('2026-11-11T12:00:00Z'), 'America/Santiago'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('schedule-leer: leerProgramados ata los posts al dueño, y su media va por los ids ya filtrados', async () => {
    const consultas = await consultasEncadenadas(() => leerProgramados(DUENO, [], 'America/Santiago'), [
      [['post-1']],
    ])
    expect(consultas).toHaveLength(2)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[1]!.params).toContain('post-1')
  })

  it('lo-pagado: leerLoPagado ata los anuncios al dueño por la cuenta que los leyó, y la publicación también', async () => {
    const consultas = await todasLasConsultas(() => leerLoPagado(DUENO, '2026-10-01', '2026-10-31'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
    // La publicación se suma por un leftJoin: tiene que ser del mismo dueño, o un anuncio que
    // apuntara a otra mostraría su texto y su miniatura.
    const on = consultas[0]!.sql.split(/\bwhere\b/i)[0]!
    expect(on).toMatch(/left join "social_posts" on \([^)]*"social_posts"\."owner_id" = \$/i)
  })

  it('lo-pagado: tieneAnuncios mira solo los del dueño', async () => {
    const consultas = await todasLasConsultas(() => tieneAnuncios(DUENO))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('ajustes: leerAjuste filtra por dueño', async () => {
    const consultas = await todasLasConsultas(() => leerAjuste(DUENO, 'voz'))
    expect(consultas).toHaveLength(1)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('cocina/materiales: materialesDeLaCamara trae lo del dueño, y cuenta sus comandas en marcha solo entre sus insumos', async () => {
    const fila = ['m-1', DUENO, 'intro.mp4', 'intro', 'https://x/intro.mp4', 1000, 'video/mp4', 20, new Date(), new Date(), null]
    const consultas = await consultasEncadenadas(() => materialesDeLaCamara(DUENO), [[fila]])
    expect(consultas).toHaveLength(2)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('cocina/subidas: usoDeLaCamara lee la cuota de la fila del dueño y de su plan, y cuenta solo lo suyo', async () => {
    const consultas = await consultasEncadenadas(() => usoDeLaCamara(DUENO), [PERSONA_GRATIS, PLANES, [[0]], [[0]], [[0]]])
    expect(consultas).toHaveLength(5)
    expect(consultas[0]!.params).toContain(DUENO)
    expect(consultas[0]!.sql.split(/\bwhere\b/i).pop()).toMatch(/"id"\s*=\s*\$/)
    // Los planes son de todos: la tabla no tiene dueño.
    expect(consultas[1]!.sql).toMatch(/from "planes"/i)
    for (const c of consultas.slice(2)) esperarFiltradoPorDueno(c)
  })

  it('planes: el plan de alguien se lee por su id, y lo que lleva usado se cuenta solo de lo suyo', async () => {
    const delPlan = await consultasEncadenadas(() => planDe(DUENO), [PERSONA_GRATIS, PLANES])
    expect(delPlan[0]!.params).toContain(DUENO)
    expect(delPlan[0]!.sql.split(/\bwhere\b/i).pop()).toMatch(/"id"\s*=\s*\$/)
    capturas.length = 0
    const db = (await import('@/db')).getDb()
    for (const contar of [
      () => cuentasConectadas(db, DUENO),
      () => esperandoEnLaParrilla(db, DUENO),
      () => tokensDelMes(db, DUENO, 'America/Santiago', new Date('2026-11-08T12:00:00Z')),
    ]) {
      const [consulta] = await consultasEncadenadas(contar, [[[0]]])
      esperarFiltradoPorDueno(consulta!)
      capturas.length = 0
    }
  })

  it('pagos: la suscripción viva de alguien se busca solo entre las suyas', async () => {
    const consultas = await todasLasConsultas(() => suscripcionVivaDe(DUENO))
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/from "suscripciones"/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('llaves: listarLlaves solo trae las del dueño, y nunca su hash', async () => {
    const consultas = await todasLasConsultas(() => listarLlaves(DUENO))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.sql.split(/\bfrom\b/i)[0]).not.toMatch(/"hash"/)
  })

  /**
   * `getPostRows` hace seis consultas encadenadas: posts, sus snapshots de métricas (dos:
   * la última del período y la última de antes), las visitas, los clics y el "alguna vez
   * visto". Solo la primera (`social_posts`) y
   * las de visitas/clics tienen columna de dueño propia y llevan el filtro directo
   * (mismo criterio que `esperarFiltradoPorDueno` de arriba). Las de métricas
   * (`post_metrics`) no tienen columna de dueño: va por los ids de los posts que la
   * primera consulta ya filtró por dueño — exigirle un `owner_id` directo sería ruidoso
   * (esa tabla no lo tiene). Para esa se comprueba en cambio que va ligada a un id de la
   * fila ya filtrada (el id del post que la primera consulta devolvió), no a la tabla
   * entera: si alguien le quitara el filtro por dueño a la primera consulta, esta
   * segunda seguiría atada a *algún* post, pero uno arbitrario en vez de 'post-1', así
   * que ese id ya no aparecería entre sus parámetros y la aserción fallaría.
   */
  // select() de social_posts trae todas sus columnas, en el orden declarado en el
  // esquema: id, owner_id, network, account_id, external_id, permalink, caption,
  // thumbnail_url, media_type, published_at, campaign, archived_at, created_at, updated_at.
  const filaPost = [
    'post-1',
    DUENO,
    'instagram',
    'acc-1',
    'ext-1',
    null,
    null,
    null,
    null,
    new Date('2026-01-10T00:00:00Z'),
    'tag-1',
    null,
    new Date('2026-01-10T00:00:00Z'),
    new Date('2026-01-10T00:00:00Z'),
  ]

  it('posts: getPostRows filtra sus seis consultas por dueño, directo o por el id que ya filtró la primera', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        getPostRows({
          ownerId: DUENO,
          zone: 'Asia/Kolkata', // otra distinta, y de media hora: acá la zona es incidental, pero gratis.
          profileId: null,
          from: new Date('2026-01-01'),
          to: new Date('2026-01-31'),
          includeBots: true,
        }),
      [[filaPost], [], [], [], [], []],
    )
    expect(consultas).toHaveLength(6)
    const [posts, adentro, antes, visitas, clics, vistos] = consultas as [Captura, Captura, Captura, Captura, Captura, Captura]

    esperarFiltradoPorDueno(posts) // social_posts: filtro directo.
    expect(adentro.params).toContain('post-1') // post_metrics: por el id que ya filtró `posts`.
    expect(antes.params).toContain('post-1') // la última de antes del período, igual.
    esperarFiltradoPorDueno(visitas) // visits: por el profileId de una subconsulta a profiles filtrada por dueño.
    esperarFiltradoPorDueno(clics) // clicks: mismo molde.
    esperarFiltradoPorDueno(vistos) // "alguna vez visto": mismo molde.
  })

  it('posts: con las views a los 7 días, la consulta de más va por el id que ya filtró la primera', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        getPostRows(
          {
            ownerId: DUENO,
            zone: 'America/Santiago',
            profileId: null,
            from: new Date('2026-01-01'),
            to: new Date('2026-01-31'),
            includeBots: true,
          },
          false,
          { aLos7Dias: true },
        ),
      [[filaPost], [], [], [], [], [], []],
    )
    expect(consultas).toHaveLength(7)
    const aLos7Dias = consultas[3]!
    // post_metrics cruzada con social_posts solo por la fecha de publicación: el filtro es el id.
    expect(aLos7Dias.sql).toMatch(/captured_at/)
    expect(aLos7Dias.params).toContain('post-1')
  })

  it('posts: con las dos edades, cada consulta de más va por el id que ya filtró la primera', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        getPostRows(
          {
            ownerId: DUENO,
            zone: 'America/Santiago',
            profileId: null,
            from: new Date('2026-01-01'),
            to: new Date('2026-01-31'),
            includeBots: true,
          },
          false,
          { aLos7Dias: true, aLas48Horas: true },
        ),
      [[filaPost], [], [], [], [], [], [], []],
    )
    expect(consultas).toHaveLength(8)
    for (const aUnaEdad of [consultas[3]!, consultas[4]!]) {
      expect(aUnaEdad.sql).toMatch(/captured_at/)
      expect(aUnaEdad.params).toContain('post-1')
    }
  })

  it('posts: getLecturasDe ata sus lecturas al dueño por el post, aunque los ids vengan de la URL', async () => {
    const consultas = await todasLasConsultas(() => getLecturasDe(DUENO, ['post-1', 'post-ajeno']))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('posts: con actividad (el tablero), la subconsulta de visitas también va por las páginas del dueño', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        getPostRows(
          {
            ownerId: DUENO,
            zone: 'America/Santiago',
            profileId: null,
            from: new Date('2026-01-01'),
            to: new Date('2026-01-31'),
            includeBots: false,
          },
          false,
          { conActividad: true },
        ),
      [[]],
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
    // Dos veces el dueño: el de `social_posts` y el de las páginas en la subconsulta de visitas,
    // que sin él juntaría las etiquetas visitadas de todos los dueños.
    expect(consultas[0]!.params.filter((p) => p === DUENO)).toHaveLength(2)
  })
})

describe('aislamiento por dueño, escrituras (SQL generado, sin base)', () => {
  const PERFIL = 'profile-1'

  it('admin/actions: makeDefault ata sus tres consultas (leer, degradar, promover) al dueño', async () => {
    const consultas = await consultasEncadenadas(() => makeDefault(PERFIL), [
      [[PERFIL]], // la fila existe y es del dueño: sigue.
      [], // degradar a las demás: sigue.
    ])
    expect(consultas).toHaveLength(3)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('admin/actions: updateProfile ata su UPDATE al dueño', async () => {
    const formData = new FormData()
    formData.set('displayName', 'Nombre de prueba')
    const consultas = await consultasEncadenadas(() => updateProfile(PERFIL, {}, formData))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * «Tu Cuenta» es la única escritura del panel cuyo dueño no es un `owner_id`: la fila que
   * toca **es** la del usuario, así que la reja es `users.id = <el de la sesión>`. Por eso
   * no usa `esperarFiltradoPorDueno`, que exige la columna `owner_id` literal, y comprueba
   * lo mismo a mano: el predicado cae en el WHERE y el id viaja como parámetro ligado.
   */
  it('admin/actions: guardarCuenta ata su UPDATE a la fila del usuario de la sesión', async () => {
    const formData = new FormData()
    formData.set('nombre', 'Ana')
    formData.set('zona', 'Europe/Madrid')
    const consultas = await consultasEncadenadas(() => guardarCuenta({}, formData))
    expect(consultas).toHaveLength(1)

    const { sql, params } = consultas[0]!
    expect(sql).toMatch(/update "users"/i)
    expect(sql.split(/\bwhere\b/i).pop()).toMatch(/"id"\s*=\s*\$/)
    expect(params).toContain(DUENO)
    // Y el dueño va como parámetro ligado, nunca escrito en el texto de la consulta.
    expect(sql).not.toContain(DUENO)
  })

  /**
   * El modo es de la cuenta, y lo cambian dos puertas: el botón del panel y Ajustes en el
   * teléfono. Las dos escriben la fila del usuario de la sesión o del token, como «Tu Cuenta».
   */
  it('admin/actions: guardarTema ata su UPDATE a la fila del usuario de la sesión', async () => {
    const consultas = await consultasEncadenadas(() => guardarTema('dia'))
    expect(consultas).toHaveLength(1)
    const { sql, params } = consultas[0]!
    expect(sql).toMatch(/update "users"/i)
    expect(sql.split(/\bwhere\b/i).pop()).toMatch(/"id"\s*=\s*\$/)
    expect(params).toContain(DUENO)
    expect(params).toContain('dia')
    expect(sql).not.toContain(DUENO)
  })

  it('api/mobile/tema: PUT ata su UPDATE a la fila del dueño del token', async () => {
    const { PUT } = await import('../app/api/mobile/tema/route')
    const peticion = new Request('https://ejemplo.cl/api/mobile/tema', {
      method: 'PUT',
      body: JSON.stringify({ tema: 'dia' }),
    })
    const consultas = await consultasEncadenadas(() => PUT(peticion))
    expect(consultas).toHaveLength(1)
    const { sql, params } = consultas[0]!
    expect(sql).toMatch(/update "users"/i)
    expect(sql.split(/\bwhere\b/i).pop()).toMatch(/"id"\s*=\s*\$/)
    expect(params).toContain(DUENO)
    expect(sql).not.toContain(DUENO)
  })

  it('social/publish/archivar: archivarQuemados ata su lectura y su UPDATE al dueño', async () => {
    // Con un destino quemado sin archivar, la función sigue de la lectura a la escritura. La
    // fila va como arreglo, en el orden de las columnas elegidas: así la entrega postgres-js
    // cuando Drizzle mapea columnas (`values()`).
    const consultas = await consultasEncadenadas(
      () => archivarQuemados(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab', { archivar: true }),
      [[['0d6e3b1a-2c4f-4b8e-9a7d-5f1e2d3c4b5a', 'a1', 'failed', null]]],
    )
    expect(consultas).toHaveLength(2)
    expect(consultas[1]!.sql).toMatch(/^update "scheduled_post_targets"/i)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('social/publish/archivar: archivarDestino busca el destino atado al dueño antes de seguir', async () => {
    const consultas = await todasLasConsultas(() =>
      archivarDestino(DUENO, '0d6e3b1a-2c4f-4b8e-9a7d-5f1e2d3c4b5a', true),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('admin/actions: deleteScheduledPost ata su lectura y su DELETE al dueño', async () => {
    // Dos consultas en una transacción: los destinos del post, bloqueados (el dueño va en la
    // subconsulta que elige el post), y el DELETE. Con un destino programado sigue al DELETE.
    const consultas = await consultasEncadenadas(() => deleteScheduledPost('6f1c2a54-9b1e-4c3d-8f00-0123456789ab'), [
      [{ status: 'scheduled', reclamadoHasta: null }],
    ])
    expect(consultas).toHaveLength(2)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  // Las dos puertas de la edición —el panel y el teléfono— y la pantalla del teléfono leen
  // primero el post atado al dueño: lo demás va por el id que esa lectura ya confirmó.
  it('social/publish/editar: editarPostProgramado lee el post atado al dueño antes de seguir', async () => {
    const consultas = await todasLasConsultas(() =>
      editarPostProgramado(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab', {
        caption: 'Hola',
        scheduledAt: CONSERVAR,
        cuentas: { quitar: [] },
        media: CONSERVAR,
        portada: CONSERVAR,
        atributos: CONSERVAR,
        regla: CONSERVAR,
      }),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('editar-movil: postParaEditarEnElTelefono lee el post atado al dueño antes de seguir', async () => {
    const consultas = await todasLasConsultas(() =>
      postParaEditarEnElTelefono(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab', 'America/Santiago'),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * `guardarCuenta` es por donde pasa toda cuenta conectada, y la entrega de Meta le tocó
   * el `insert` y el `set` del `onConflictDoUpdate`. No usa `esperarFiltradoPorDueno`
   * porque ninguna de sus dos consultas tiene —ni puede tener— un `owner_id` en el WHERE:
   *
   * - La lectura busca por `(network, external_id)` **a propósito**: es justamente el
   *   guardia que descubre que esa cuenta ya es de otro dueño. Filtrar por el dueño de
   *   turno la dejaría ciega y el `insert` pisaría el token del primero.
   * - El `insert` no lleva WHERE, y su `onConflictDoUpdate` apunta a `(network,
   *   external_id)` porque esa es hoy la única de la tabla. Lo que sí tiene que ser cierto
   *   —y es lo que este caso fija— es que el `owner_id` que se escribe sea el que llegó
   *   por parámetro, y no uno derivado de la fila que ya estaba.
   */
  it('social/conectar: guardarCuenta escribe con el dueño que recibió', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        guardarCuentaDeRed(DUENO, 'instagram', {
          externalId: '17841400000000000',
          handle: 'cuenta',
          accessToken: 'token',
          refreshToken: null,
          expiresAt: null,
          metaUserId: '10201234567890',
        }),
      // Nadie tiene esa cuenta todavía; el dueño trabado, su plan y sus cuentas conectadas para el
      // tope; y el insert.
      [[], [[DUENO]], PERSONA_GRATIS, PLANES, [[0]], []],
    )
    expect(consultas).toHaveLength(6)

    const lectura = consultas[0]!
    const escritura = consultas[consultas.length - 1]!
    // El tope cuenta las cuentas de este dueño, no las de todos.
    esperarFiltradoPorDueno(consultas[4]!)
    // La lectura mira la cuenta, no al dueño: ese es el guardia de choque.
    expect(lectura.sql).toMatch(/from "social_accounts"/i)
    expect(lectura.params).toContain('17841400000000000')

    expect(escritura.sql).toMatch(/insert into "social_accounts"/i)
    expect(escritura.params).toContain(DUENO)
    // Y el dueño va como parámetro ligado, nunca escrito en el texto de la consulta.
    expect(escritura.sql).not.toContain(DUENO)
  })

  it('social/conectar: guardarCuenta no pisa la cuenta de otro dueño, y la nombra', async () => {
    colaRespuestas.push([['cuenta-1', 'otro-dueno', 'cifrado']])
    await expect(
      guardarCuentaDeRed(DUENO, 'instagram', {
        externalId: '17841400000000000',
        handle: '@ajena',
        accessToken: 'token',
        refreshToken: null,
        expiresAt: null,
      }),
    ).rejects.toThrow('«@ajena» ya está conectada por otra persona en Tu Parrilla.')
    // Solo la lectura del guardia: no llegó a escribir.
    expect(capturas).toHaveLength(1)
  })

  // «Agregar cuenta →» necesita saber si la red trajo una cuenta nueva o la de antes: es la
  // diferencia entre «conectado» y «se renovó y no se agregó otra».
  it('social/conectar: guardarCuenta dice si la cuenta era nueva para este dueño o solo se renovó', async () => {
    const cuenta = { externalId: '17841400000000000', handle: '@mia', accessToken: 'token', refreshToken: null, expiresAt: null }
    const tope = [[[DUENO]], PERSONA_GRATIS, PLANES, [[0]]] // el dueño trabado, su plan y sus conectadas
    colaRespuestas.push([], ...tope, []) // nadie la tenía; el tope; el insert.
    expect(await guardarCuentaDeRed(DUENO, 'instagram', cuenta)).toBe('nueva')
    colaRespuestas.push([['cuenta-1', DUENO, 'cifrado']], []) // ya era suya y conectada: sin tope; el upsert.
    expect(await guardarCuentaDeRed(DUENO, 'instagram', cuenta)).toBe('renovada')
    colaRespuestas.push([['cuenta-1', null, null]], ...tope, []) // una fila de antes de los dueños: en su panel no estaba.
    expect(await guardarCuentaDeRed(DUENO, 'instagram', cuenta)).toBe('nueva')
  })

  /**
   * La única lectura que cruza dueños a propósito: dice cuáles de las cuentas que trajo un
   * login ya tiene otro usuario. Tiene que excluir al dueño de la sesión —si no, sus propias
   * cuentas saldrían como «conectada por otra persona»— y preguntar solo por esos ids.
   */
  it('social/conectar: tomadasPorOtro excluye al dueño y pregunta solo por las cuentas del login', async () => {
    const consultas = await consultasEncadenadas(() => tomadasPorOtro(DUENO, 'instagram', ['ig-a', 'ig-b']), [[]])
    expect(consultas).toHaveLength(1)
    const { sql, params } = consultas[0]!
    expect(params).toEqual(expect.arrayContaining([DUENO, 'instagram', 'ig-a', 'ig-b']))
    expect(sql.split(/\bwhere\b/i).pop()).toMatch(/"owner_id"\s*<>\s*\$/)
  })

  /**
   * El id de la llave viaja desde el navegador: sin el dueño en el WHERE, cualquiera con
   * sesión revocaría la llave de otro sabiendo su id.
   */
  it('admin/actions: revocarLlaveApi ata su DELETE al dueño de la sesión', async () => {
    const consultas = await consultasEncadenadas(() => revocarLlaveApi('llave-x'), [[]])
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/delete from "llaves_api"/i)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain('llave-x')
  })

  it('llaves: crearLlave cuenta el tope sobre las llaves del dueño y escribe a su nombre', async () => {
    const consultas = await consultasEncadenadas(() => crearLlave(DUENO, 'Editor de videos'), [[[0]], []])
    expect(consultas).toHaveLength(2)
    const [conteo, insercion] = consultas as [Captura, Captura]
    esperarFiltradoPorDueno(conteo)
    expect(insercion.sql).toMatch(/insert into "llaves_api"/i)
    expect(insercion.params).toContain(DUENO)
    expect(insercion.sql).not.toContain(DUENO)
  })

  /**
   * El id del borrador viaja desde el navegador a cada pausa del compositor: sin el dueño en
   * el WHERE del UPDATE, cualquiera con sesión pisaría el borrador de otro sabiendo su id.
   * El UPDATE que no encuentra fila corta ahí (`perdido`) y no toca la media.
   */
  it('cocina/materiales: editarMaterial ata su UPDATE al dueño', async () => {
    const consultas = await todasLasConsultas(() =>
      editarMaterial(DUENO, '00000000-0000-4000-8000-000000000001', { nombre: 'Mi intro', uso: 'intro' }),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('cocina/materiales: sacarMaterial lee el material bloqueado, mira sus comandas y lo borra, todo atado al dueño', async () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const consultas = await consultasEncadenadas(() => sacarMaterial(DUENO, id, new Date()), [[[id, 'https://x/intro.mp4']], [], []])
    expect(consultas).toHaveLength(3)
    for (const c of consultas) esperarFiltradoPorDueno(c)
    expect(consultas[0]!.sql).toMatch(/for update/i)
    expect(consultas[2]!.sql).toMatch(/^delete/i)
  })

  it('api/mobile/cocina/materiales/[id]: PATCH («Cambiar» desde el teléfono) ata su UPDATE al dueño del token', async () => {
    const { PATCH } = await import('../app/api/mobile/cocina/materiales/[id]/route')
    const id = '00000000-0000-4000-8000-000000000001'
    const peticion = new Request(`https://ejemplo.cl/api/mobile/cocina/materiales/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ nombre: 'Mi intro', uso: 'intro' }),
    })
    const consultas = await todasLasConsultas(() => PATCH(peticion, { params: Promise.resolve({ id }) }))
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/^update/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * El token de los avisos viaja desde el teléfono en la ruta: sin el dueño en el WHERE, cualquiera
   * con sesión apagaría los avisos de otro sabiendo su token.
   */
  it('api/mobile/push/[token]: DELETE borra el token solo si es del dueño del token de la sesión', async () => {
    const { DELETE } = await import('../app/api/mobile/push/[token]/route')
    const token = 'ExponentPushToken[abcdefgh12345678]'
    const consultas = await todasLasConsultas(() => DELETE(peticionMovil(), { params: Promise.resolve({ token }) }))
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/^delete from "push_tokens"/i)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain(token)
  })

  it('push/enviar: avisarAlTelefono lee solo los teléfonos del dueño', async () => {
    const { avisarAlTelefono } = await import('./push/enviar')
    const consultas = await consultasEncadenadas(
      () => avisarAlTelefono(DUENO, () => ({ titulo: 't', cuerpo: 'c', tipo: 'fierro' })),
      [[]],
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('api/mobile/cocina/materiales/[id]: DELETE («Sacar» desde el teléfono) lee, mira y borra solo lo del dueño del token', async () => {
    const { DELETE } = await import('../app/api/mobile/cocina/materiales/[id]/route')
    const id = '00000000-0000-4000-8000-000000000001'
    const consultas = await consultasEncadenadas(
      () => DELETE(peticionMovil(), { params: Promise.resolve({ id }) }),
      [[[id, 'https://x/intro.mp4']], [], []],
    )
    expect(consultas).toHaveLength(3)
    for (const c of consultas) esperarFiltradoPorDueno(c)
  })

  it('api/mobile/cocina/comandas/[id]/cancelar: lee y cancela solo una comanda del dueño del token', async () => {
    const { POST } = await import('../app/api/mobile/cocina/comandas/[id]/cancelar/route')
    const id = '00000000-0000-4000-8000-000000000001'
    const consultas = await consultasEncadenadas(() => POST(peticionMovil(), { params: Promise.resolve({ id }) }), [[['recibida']]])
    expect(consultas.length).toBeGreaterThanOrEqual(2)
    for (const c of consultas.slice(0, 2)) esperarFiltradoPorDueno(c)
    expect(consultas[1]!.sql).toMatch(/^update "comandas"/i)
  })

  /*
   * El mesón en el teléfono (2026-11-07). El id del creativo y el de la comanda viajan desde la app:
   * sin el dueño en el WHERE, cualquiera con sesión vería, programaría o descartaría lo que el chef le
   * cocinó a otro sabiendo un id.
   */
  it('api/mobile/cocina/meson: GET lee el mesón y cuenta los borradores solo del dueño del token', async () => {
    const { GET } = await import('../app/api/mobile/cocina/meson/route')
    const conCocina = USUARIO as { cocinaDesde: Date | null }
    conCocina.cocinaDesde = new Date('2026-10-22')
    try {
      const comanda = '00000000-0000-4000-8000-000000000001'
      const consultas = await consultasEncadenadas(
        () => GET(new Request(`https://ejemplo.cl/api/mobile/cocina/meson?comanda=${comanda}`)),
        [[], []],
      )
      expect(consultas).toHaveLength(2)
      for (const c of consultas) esperarFiltradoPorDueno(c)
      expect(consultas[0]!.params).toContain(comanda)
    } finally {
      conCocina.cocinaDesde = null
    }
  })

  it('api/mobile/cocina/creativos/[id]/programar: pasa a un borrador solo un creativo del dueño del token', async () => {
    const { POST } = await import('../app/api/mobile/cocina/creativos/[id]/programar/route')
    const id = '00000000-0000-4000-8000-000000000001'
    const consultas = await consultasEncadenadas(() => POST(peticionMovil(), { params: Promise.resolve({ id }) }), [[]])
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/^update "creativos"/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('api/mobile/cocina/creativos/[id]/descartar: descarta solo un creativo del dueño del token', async () => {
    const { POST } = await import('../app/api/mobile/cocina/creativos/[id]/descartar/route')
    const id = '00000000-0000-4000-8000-000000000001'
    const peticion = new Request(`https://ejemplo.cl/api/mobile/cocina/creativos/${id}/descartar`, {
      method: 'POST',
      body: JSON.stringify({ motivo: 'corte', nota: 'Muy largo' }),
    })
    const consultas = await consultasEncadenadas(() => POST(peticion, { params: Promise.resolve({ id }) }), [[]])
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/^update "creativos"/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('cocina/pedir: pedirComanda mira la ref y bloquea los materiales elegidos solo entre los del dueño', async () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const consultas = await consultasEncadenadas(
      () =>
        pedirComanda({ id: DUENO, cocinaDesde: new Date() }, {
          ref: id,
          principal: id,
          subtipo: 'largo',
          acompanamientos: [],
          formatos: ['clips'],
          cantidad: 'lo-que-de',
          notas: '',
          paraCuando: null,
          marca: { nombre: 'V', handle: null, acento: null, ctaTexto: null },
        }, new Date()),
      [[]],
    )
    expect(consultas.length).toBeGreaterThanOrEqual(2)
    for (const c of consultas.slice(0, 2)) esperarFiltradoPorDueno(c)
    expect(consultas[1]!.sql).toMatch(/"materiales"/)
    expect(consultas[1]!.sql).toMatch(/for update/i)
  })

  it('borradores: guardarBorrador con id ata su UPDATE al dueño y, sin fila, no sigue', async () => {
    const consultas = await consultasEncadenadas(
      () => guardarBorrador(DUENO, { id: 'borrador-x', campos: {}, fecha: null, media: [] }),
      [[]],
    )
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/update "borradores"/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('borradores: guardarBorrador sin id crea el borrador a nombre del dueño', async () => {
    const consultas = await consultasEncadenadas(
      () => guardarBorrador(DUENO, { id: null, campos: {}, fecha: null, media: [] }),
      [[['borrador-nuevo']], []],
    )
    expect(consultas[0]!.sql).toMatch(/insert into "borradores"/i)
    expect(consultas[0]!.params).toContain(DUENO)
    expect(consultas[0]!.sql).not.toContain(DUENO)
    // La media se reescribe por el id que el INSERT devolvió, no por uno del navegador.
    expect(consultas[1]!.params).toContain('borrador-nuevo')
  })

  it('borradores: borrarBorrador ata su DELETE al dueño', async () => {
    const consultas = await consultasEncadenadas(() => borrarBorrador(DUENO, 'borrador-x'), [[]])
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/delete from "borradores"/i)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * Un borrador guardado desde el teléfono solo puede elegir cuentas que esta lectura
   * devuelva: sin el dueño, cualquiera metería en su borrador la cuenta de otro.
   */
  it('borradores: cuentasParaElTelefono lee solo las cuentas del dueño', async () => {
    const consultas = await todasLasConsultas(() => cuentasParaElTelefono(DUENO))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('api/mobile/schedule/accounts: lista solo las cuentas del dueño', async () => {
    const { GET } = await import('../app/api/mobile/schedule/accounts/route')
    const consultas = await todasLasConsultas(() => GET(peticionMovil()))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * Ronda de arreglos de la Tarea 7, punto 1: sin este filtro, una cuenta de TikTok
   * saldría en la lista y la app dibujaría un chip que el servidor iba a rechazar
   * después de que el dueño subiera el archivo.
   */
  it('api/mobile/schedule/accounts: no ofrece redes que el teléfono no publica (TikTok)', async () => {
    const { GET } = await import('../app/api/mobile/schedule/accounts/route')
    const consultas = await todasLasConsultas(() => GET(peticionMovil()))
    expect(consultas).toHaveLength(1)
    const { sql, params } = consultas[0]!
    const where = sql.split(/\bwhere\b/i).pop()!
    expect(where).toMatch(/"network"\s+in\s*\(/i)
    expect(params).not.toContain('tiktok')
  })

  it('api/mobile/schedule/accounts: a la app con el bloque de TikTok le ofrece TikTok, siempre del dueño', async () => {
    const { GET } = await import('../app/api/mobile/schedule/accounts/route')
    const consultas = await todasLasConsultas(() => GET(peticionMovil({ 'X-Parrilla-Publicar': 'tiktok' })))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain('tiktok')
  })

  it('borradores: cuentasParaElTelefono con TikTok lee igual solo las cuentas del dueño', async () => {
    const consultas = await todasLasConsultas(() => cuentasParaElTelefono(DUENO, true))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * `creator_info` se pide con el token de la cuenta: sin el dueño en la lectura, cualquiera con
   * el id de una cuenta ajena vería su nombre, su avatar y sus privacidades, y gastaría su cupo.
   */
  it('tiktok-cuenta: creadorDeCuenta lee la cuenta atada al dueño antes de pedir nada a TikTok', async () => {
    const consultas = await todasLasConsultas(() => creadorDeCuenta(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /**
   * TikTok for Business: «Lo que se busca en TikTok» y «Tu rubro» piden a TikTok con la credencial
   * de una cuenta. Sin el dueño en la lectura, cualquiera con el id de una cuenta ajena gastaría su
   * cupo o le cambiaría el rubro.
   */
  it('tiktok-numeros-guardar: cuentaTiktokDelDueno lee la cuenta atada al dueño antes de pedir nada a TikTok', async () => {
    const consultas = await todasLasConsultas(() => cuentaTiktokDelDueno(DUENO, '6f1c2a54-9b1e-4c3d-8f00-0123456789ab'))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('tiktok-numeros-guardar: cuentaTiktokDelDueno no consulta con un id que no es uuid', async () => {
    expect(await cuentaTiktokDelDueno(DUENO, 'nada')).toBeNull()
    expect(capturas).toHaveLength(0)
  })

  it('tiktok-cuenta: creadorDeCuenta no consulta con un id que no es uuid', async () => {
    expect(await creadorDeCuenta(DUENO, 'nada')).toEqual({ error: 'Conecta TikTok en Los Fierros antes de programar.' })
    expect(capturas).toHaveLength(0)
  })

  it('api/mobile/schedule/accounts/[id]/tiktok: lee solo una cuenta del dueño del token', async () => {
    const { GET } = await import('../app/api/mobile/schedule/accounts/[id]/tiktok/route')
    const consultas = await todasLasConsultas(() =>
      GET(peticionMovil(), { params: Promise.resolve({ id: '6f1c2a54-9b1e-4c3d-8f00-0123456789ab' }) }),
    )
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  it('tiktok-cuenta: recordarMusicaTikTok escribe solo en la cuenta del dueño', async () => {
    const opciones = {
      'cuenta-tt': {
        modo: 'directo' as const,
        privacidad: 'SELF_ONLY' as const,
        comentarios: false,
        duo: false,
        pegar: false,
        comercial: 'no' as const,
        musica: true as const,
      },
    }
    const consultas = await consultasEncadenadas(() => recordarMusicaTikTok(DUENO, opciones, { videos: 0, fotos: 2 }))
    expect(consultas).toHaveLength(1)
    expect(consultas[0]!.sql).toMatch(/update "social_accounts"/i)
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain('cuenta-tt')
  })

  /**
   * «Quitar» borra una cuenta con su historial, y el id llega desde el navegador: la lectura
   * que decide si se puede tiene que estar atada al dueño, o cualquiera borraría la cuenta de
   * otro sabiendo su id.
   */
  it('social/vincular-sin-id: lee los destinos y los videos, y escribe el id, todo atado al dueño', async () => {
    const consultas = await consultasEncadenadas(() => vincularSinId({ id: 'cuenta-tt', ownerId: DUENO }), [
      // Un destino publicado sin id…
      [['destino-1', null, 'published', null, null, 'Tres errores que cometí al lanzar mi producto', '2026-10-10T09:00:00.000Z']],
      // …y un video de la cuenta con el mismo texto a esa hora.
      [['7001', 'Tres errores que cometí al lanzar mi producto', '2026-10-10T09:05:00.000Z']],
    ])
    expect(consultas).toHaveLength(3)
    for (const c of consultas) esperarFiltradoPorDueno(c)
    expect(consultas[2]!.sql).toMatch(/^update "scheduled_post_targets"/)
  })

  it('social/quitar: quitarCuenta lee la cuenta atada al dueño antes de borrar nada', async () => {
    const consultas = await consultasEncadenadas(() => quitarCuenta(DUENO, '9692387a-41cc-4a81-9f8f-7b07135d742a'))
    esperarFiltradoPorDueno(consultas[0]!)
    expect(consultas[0]!.params).toContain('9692387a-41cc-4a81-9f8f-7b07135d742a')
    expect(consultas.every((c) => !/^\s*delete/i.test(c.sql))).toBe(true)
  })

  /**
   * El libro de sugerencias cuenta el tope del día y las cuentas por red de quien escribe, y
   * guarda a su nombre: sin el dueño en el WHERE, el tope sería el de todos y el issue diría las
   * cuentas de otro.
   */
  it('sugerencias/guardar: recibirSugerencia cuenta el tope y las cuentas del dueño, y guarda a su nombre', async () => {
    const consultas = await consultasEncadenadas(
      () =>
        recibirSugerencia(USUARIO, { tipo: 'idea', texto: 'Quiero X' }, { origen: 'panel', pantalla: null, navegador: 'Chrome 131 en Windows' }),
      [[[0]], [['instagram', 2]], [['sugerencia-1']]],
    )
    expect(consultas).toHaveLength(3)
    const [tope, cuentas, insercion] = consultas as [Captura, Captura, Captura]
    expect(tope.sql).toMatch(/from "sugerencias"/i)
    esperarFiltradoPorDueno(tope)
    expect(cuentas.sql).toMatch(/from "social_accounts"/i)
    esperarFiltradoPorDueno(cuentas)
    expect(insercion.sql).toMatch(/insert into "sugerencias"/i)
    expect(insercion.params).toContain(DUENO)
    expect(insercion.sql).not.toContain(DUENO)
    // El correo no viaja a la fila que se vuelve issue.
    expect(JSON.stringify(insercion.params)).not.toContain(USUARIO.correo)
  })

  /**
   * Lo que el libro le muestra a la persona —lo que escribió, con la respuesta del equipo, y el
   * punto de las respuestas sin leer— y marcar una como leída, con un id que llega del navegador o
   * del teléfono: todo atado a su dueño. Sin eso, una persona leería las sugerencias de otra.
   */
  it('sugerencias/responder: el libro, el punto y marcar leída van atados al dueño', async () => {
    for (const llamada of [
      () => misSugerencias(DUENO),
      () => respuestasSinLeer(DUENO),
      () => marcarRespuestaLeida(DUENO, '9692387a-41cc-4a81-9f8f-7b07135d742a'),
    ]) {
      capturas.length = 0
      const consultas = await todasLasConsultas(llamada)
      expect(consultas).toHaveLength(1)
      expect(consultas[0]!.sql).toMatch(/"sugerencias"/)
      esperarFiltradoPorDueno(consultas[0]!)
    }
  })

  it('api/mobile/sugerencias: GET lee solo lo de quien pregunta', async () => {
    const { GET } = await import('../app/api/mobile/sugerencias/route')
    const consultas = await todasLasConsultas(() => GET(peticionMovil()))
    expect(consultas).toHaveLength(1)
    esperarFiltradoPorDueno(consultas[0]!)
  })

  /*
   * La Mesa en el teléfono: las rutas leen y escriben con las funciones del panel, que reciben al
   * dueño del token. Cada consulta que alcanzan a armar —la cola, el contador, la fila que se va a
   * responder, descartar o redactar— tiene que terminar en él.
   */
  describe('api/mobile/comentarios: La Mesa del teléfono, solo lo del dueño del token', () => {
    const id = '00000000-0000-4000-8000-000000000001'
    const conId = { params: Promise.resolve({ id }) }

    it('GET lee la cola, cuenta los pendientes y busca lo que Instagram no entregó, los tres atados al dueño', async () => {
      const { GET } = await import('../app/api/mobile/comentarios/route')
      const consultas = await todasLasConsultas(() => GET(new Request('https://ejemplo.cl/api/mobile/comentarios?estado=automaticas&red=instagram')))
      expect(consultas).toHaveLength(3)
      for (const c of consultas) esperarFiltradoPorDueno(c)
    })

    it('pendientes: el número del acceso cuenta solo lo del dueño', async () => {
      const { GET } = await import('../app/api/mobile/comentarios/pendientes/route')
      const consultas = await todasLasConsultas(() => GET(peticionMovil()))
      expect(consultas).toHaveLength(1)
      esperarFiltradoPorDueno(consultas[0]!)
    })

    it('[id]/respuesta: «Enviar» busca el comentario solo entre los del dueño', async () => {
      const { POST } = await import('../app/api/mobile/comentarios/[id]/respuesta/route')
      const peticion = new Request(`https://ejemplo.cl/api/mobile/comentarios/${id}/respuesta`, {
        method: 'POST',
        body: JSON.stringify({ texto: 'Gracias' }),
      })
      const consultas = await todasLasConsultas(() => POST(peticion, conId))
      expect(consultas).toHaveLength(1)
      esperarFiltradoPorDueno(consultas[0]!)
    })

    it('[id]/descartar: busca el comentario solo entre los del dueño', async () => {
      const { POST } = await import('../app/api/mobile/comentarios/[id]/descartar/route')
      const consultas = await todasLasConsultas(() => POST(peticionMovil(), conId))
      expect(consultas).toHaveLength(1)
      esperarFiltradoPorDueno(consultas[0]!)
    })

    it('[id]/borrador: «Escribir otro borrador» busca el comentario solo entre los del dueño', async () => {
      const { POST } = await import('../app/api/mobile/comentarios/[id]/borrador/route')
      const consultas = await todasLasConsultas(() => POST(peticionMovil(), conId))
      expect(consultas).toHaveLength(1)
      esperarFiltradoPorDueno(consultas[0]!)
    })
  })

  it('social/quitar: una cuenta conectada no se quita, y no se borra nada', async () => {
    colaRespuestas.push([['@vicente', '1784', true]])
    expect(await quitarCuenta(DUENO, '9692387a-41cc-4a81-9f8f-7b07135d742a')).toEqual({ error: CUENTA_CONECTADA })
    expect(capturas).toHaveLength(1)
  })

  /**
   * La planilla de «Llevar para la casa» lee fila por fila lo que Los Números solo cuenta: cada
   * visita, cada click, cada lectura, cada comentario, cada destino. Cada una de esas consultas
   * tiene que terminar en el dueño, también la que sigue a un cursor.
   */
  describe('planilla: cada lectura de la planilla ata su consulta al dueño', () => {
    const filtros = {
      ownerId: DUENO,
      zone: 'Europe/Madrid',
      profileId: null,
      from: new Date('2026-01-01'),
      to: new Date('2026-01-31'),
      includeBots: false,
    }
    const dias = { desde: '2026-01-01', hasta: '2026-01-31' }
    const corte = new Date('2026-01-15')
    const cursor = { en: '2026-01-20T10:00:00.123456Z', id: '9692387a-41cc-4a81-9f8f-7b07135d742a' }

    it.each([
      ['leerVisitas', () => leerVisitas(filtros, cursor, 10)],
      ['leerClicks', () => leerClicks(filtros, cursor, 10)],
      ['leerLecturas', () => leerLecturas(DUENO, dias, null, corte, { en: '2026-01-20', id: cursor.id }, 10)],
      ['leerSeguidores', () => leerSeguidores(DUENO, dias, 'cuenta-1', corte, 10)],
      ['leerProgramado', () => leerProgramado(filtros, null, new Date('2026-01-31'), 10)],
      ['leerComentarios', () => leerComentarios(filtros, 'cuenta-1', corte, cursor, 10)],
      ['publicacionesDeEtiquetas', () => publicacionesDeEtiquetas(DUENO, ['reel-1'], corte)],
      ['youtubeVencido', () => youtubeVencido(DUENO, [cursor.id], corte)],
    ])('%s', async (_, llamada) => {
      const consultas = await todasLasConsultas(llamada)
      expect(consultas).toHaveLength(1)
      for (const c of consultas) esperarFiltradoPorDueno(c)
    })

    it('leerEtiquetas: las visitas y sus clicks', async () => {
      const consultas = await consultasEncadenadas(() => leerEtiquetas(filtros, 10), [[]])
      expect(consultas).toHaveLength(2)
      for (const c of consultas) esperarFiltradoPorDueno(c)
    })

    it('contarFilas: los cuatro conteos', async () => {
      const consultas = await consultasEncadenadas(() => contarFilas(filtros, dias, null, corte), [[[0]], [[0]], [[0]]])
      expect(consultas).toHaveLength(4)
      for (const c of consultas) esperarFiltradoPorDueno(c)
    })

    it('leerClicks: el link y la visita de un click se buscan solo entre los del dueño', async () => {
      const [consulta] = await todasLasConsultas(() => leerClicks(filtros, null, 10))
      // Tres veces: el link, la visita (`visit_id` no tiene clave foránea) y el click mismo.
      expect(consulta!.sql.match(/"profiles"\."owner_id" = \$/g)).toHaveLength(3)
    })
  })
})
